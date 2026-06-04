package com.vcapelcin.pdftopdfa3.service;

import com.vcapelcin.pdftopdfa3.model.Conversion;
import com.vcapelcin.pdftopdfa3.repository.ConversionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mustangproject.ZUGFeRD.IZUGFeRDExporter;
import org.mustangproject.ZUGFeRD.ZUGFeRDExporterFromA1;
import org.mustangproject.validator.ZUGFeRDValidator;
import org.mustangproject.ZUGFeRD.Profiles;
import org.springframework.core.io.ResourceLoader;
import org.springframework.scheduling.annotation.Async;
import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Service
@Slf4j
public class PdfConversionService {

    private final ConversionRepository conversionRepository;
    private final ResourceLoader resourceLoader;

    public PdfConversionService(ConversionRepository conversionRepository, ResourceLoader resourceLoader) {
        this.conversionRepository = conversionRepository;
        this.resourceLoader = resourceLoader;
    }

    @Async
    public CompletableFuture<byte[]> convertToPdfA3Async(MultipartFile file, MultipartFile xmlFile, String ipAddress) throws Exception {
        return CompletableFuture.completedFuture(convertToPdfA3(file, xmlFile, "BASIC", ipAddress));
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile) throws Exception {
        return convertToPdfA3(file, xmlFile, "BASIC", null);
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String ipAddress) throws Exception {
        return convertToPdfA3(file, xmlFile, "BASIC", ipAddress);
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String zugferdConformanceLevel, String ipAddress) throws Exception {
        long startTime = System.currentTimeMillis();
        String originalFilename = file.getOriginalFilename();
        log.debug("Starting PDF to PDF/A-3 conversion for file: {} (Profile: {})", originalFilename, zugferdConformanceLevel);

        Conversion conversion = Conversion.builder()
                .filename(originalFilename)
                .status("PROCESSING")
                .ipAddress(ipAddress)
                .build();
        
        if (xmlFile != null && !xmlFile.isEmpty()) {
            conversion.setXmlFilename(xmlFile.getOriginalFilename());
            conversion.setXmlSize(xmlFile.getSize());
        }

        conversion = conversionRepository.save(conversion);

        if (!isPdfFile(file)) {
            log.error("File is not a valid PDF: {}", originalFilename);
            updateConversionStatus(conversion, "FAILED", "Invalid file type. Only PDF files are allowed.", startTime);
            throw new IOException("Invalid file type. Only PDF files are allowed.");
        }

        if (xmlFile != null && !xmlFile.isEmpty()) {
            try {
                validateXmlAgainstXsd(xmlFile);
            } catch (Exception e) {
                log.warn("XML validation failed during conversion (ignoring): {}", e.getMessage());
                // We proceed with conversion even if XML is invalid as per user request
            }
        }

        try (InputStream pdfSource = file.getInputStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            conversion.setOriginalSize(file.getSize());
            
            String targetFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";
            conversion.setTargetFilename(targetFilename);

            IZUGFeRDExporter exporter = new ZUGFeRDExporterFromA1();
            
            // Ignore PDFA errors to allow regular PDF input
            ((ZUGFeRDExporterFromA1)exporter).ignorePDFAErrors();

            // Load source PDF
            exporter.load(pdfSource);

            // Configure conformance level
            exporter.setProfile(Profiles.getByName(zugferdConformanceLevel));
            
            if (xmlFile != null && !xmlFile.isEmpty()) {
                exporter.setXML(xmlFile.getBytes());
            } else {
                // If no XML is provided, we still need to provide a minimum valid ZUGFeRD XML 
                // because Mustangproject's export() requires it.
                // However, our service is also used for general PDF/A-3 conversion.
                // If the user didn't provide XML, we can either:
                // 1. Skip ZUGFeRD metadata (not possible with this exporter)
                // 2. Provide a dummy minimal XML.
                byte[] dummyXml = ("<rsm:CrossIndustryInvoice xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\"></rsm:CrossIndustryInvoice>").getBytes();
                exporter.setXML(dummyXml);
            }
            
            // Export to PDF/A-3
            exporter.export(out);
            byte[] convertedBytes = out.toByteArray();
            
            validatePdfA3(convertedBytes);
            
            log.debug("Successfully created PDF/A-3 document, size: {} bytes", convertedBytes.length);
            
            conversion.setConvertedSize((long) convertedBytes.length);
            updateConversionStatus(conversion, "COMPLETED", null, startTime);
            
            return convertedBytes;
        } catch (IOException e) {
            log.error("IOException during PDF conversion for file: {}", originalFilename, e);
            updateConversionStatus(conversion, "FAILED", e.getMessage(), startTime);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during PDF conversion for file: {}", originalFilename, e);
            updateConversionStatus(conversion, "FAILED", e.getMessage(), startTime);
            throw new IOException("Error during PDF conversion", e);
        }
    }

    private void updateConversionStatus(Conversion conversion, String status, String errorMessage, long startTime) {
        try {
            conversion.setStatus(status);
            conversion.setErrorMessage(errorMessage);
            conversion.setProcessingTimeMs(System.currentTimeMillis() - startTime);
            conversionRepository.save(conversion);
        } catch (Exception e) {
            log.error("Failed to update conversion status in database", e);
        }
    }

    private void validateXmlAgainstXsd(MultipartFile xmlFile) throws Exception {
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        // Using Factur-X / ZUGFeRD 2.2 XSD
        InputStream xsdStream = resourceLoader.getResource("classpath:xsd/zugferd22/factur-x.xsd").getInputStream();
        Schema schema = factory.newSchema(new StreamSource(xsdStream));
        Validator validator = schema.newValidator();
        validator.validate(new StreamSource(xmlFile.getInputStream()));
        log.info("XML Validation against XSD successful.");
    }

    public void validatePdfA3(byte[] pdfBytes) {
        try {
            ZUGFeRDValidator validator = new ZUGFeRDValidator();
            // Need to write to temp file as ZUGFeRDValidator.validate(String) expects a filename
            java.io.File tempFile = java.io.File.createTempFile("pdfa-validation", ".pdf");
            try {
                java.nio.file.Files.write(tempFile.toPath(), pdfBytes);
                String report = validator.validate(tempFile.getAbsolutePath());
                if (report.contains("invalid") || report.contains("error")) {
                    log.warn("PDF/A-3 Validation potential issues for document: {}", report);
                } else {
                    log.info("PDF/A-3 Validation report: {}", report);
                }
            } finally {
                tempFile.delete();
            }
        } catch (Exception e) {
            log.error("Error during PDF/A-3 validation", e);
        }
    }

    private boolean isPdfFile(MultipartFile file) throws IOException {
        if (file.getOriginalFilename() != null && !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            return false;
        }
        try (InputStream is = file.getInputStream()) {
            byte[] magicBytes = new byte[4];
            if (is.read(magicBytes) != 4) {
                return false;
            }
            // PDF magic bytes: %PDF (25 50 44 46)
            return magicBytes[0] == 0x25 && magicBytes[1] == 0x50 && magicBytes[2] == 0x44 && magicBytes[3] == 0x46;
        }
    }
}
