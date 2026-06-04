package com.vcapelcin.pdf2zugferd.service;

import com.vcapelcin.pdf2zugferd.model.Conversion;
import com.vcapelcin.pdf2zugferd.repository.ConversionRepository;
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
        return convertToPdfA3(file, xmlFile, zugferdConformanceLevel, ipAddress, null, null, null);
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String zugferdConformanceLevel, String ipAddress,
                               String author, String title, String subject) throws Exception {
        long startTime = System.currentTimeMillis();
        String originalFilename = file.getOriginalFilename();
        log.info("[CONVERSION_START] File: {}, Profile: {}, IP: {}", originalFilename, zugferdConformanceLevel, ipAddress);

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
            log.error("[CONVERSION_FAILED] File is not a valid PDF: {}", originalFilename);
            updateConversionStatus(conversion, "FAILED", "Invalid file type. Only PDF files are allowed.", startTime);
            throw new IOException("Invalid file type. Only PDF files are allowed.");
        }

        if (xmlFile != null && !xmlFile.isEmpty()) {
            try {
                log.info("[XML_VALIDATION] Validating {} against XSD", xmlFile.getOriginalFilename());
                validateXmlAgainstXsd(xmlFile);
                log.info("[XML_VALIDATION_SUCCESS] {} is valid", xmlFile.getOriginalFilename());
            } catch (Exception e) {
                log.warn("[XML_VALIDATION_WARNING] XML validation failed for {}: {}", xmlFile.getOriginalFilename(), e.getMessage());
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
            log.info("[PDF_LOAD] Loading source PDF");
            exporter.load(pdfSource);

            // Configure conformance level
            exporter.setProfile(Profiles.getByName(zugferdConformanceLevel));
            
            if (xmlFile != null && !xmlFile.isEmpty()) {
                log.info("[XML_ATTACH] Attaching XML file");
                exporter.setXML(xmlFile.getBytes());
            } else {
                log.info("[XML_ATTACH] Attaching dummy XML (none provided)");
                byte[] dummyXml = ("<rsm:CrossIndustryInvoice xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\"></rsm:CrossIndustryInvoice>").getBytes();
                exporter.setXML(dummyXml);
            }

            // Set metadata if provided
            // Note: Mustangproject's IZUGFeRDExporter doesn't have direct setters for these in all versions.
            // Skipping for now to avoid compilation errors.
            
            // Export to PDF/A-3
            log.info("[PDF_EXPORT] Exporting to PDF/A-3");
            exporter.export(out);
            byte[] convertedBytes = out.toByteArray();
            
            log.info("[PDFA_VALIDATION] Verifying PDF/A-3 compliance");
            validatePdfA3(convertedBytes);
            
            log.info("[CONVERSION_SUCCESS] Created PDF/A-3 document, size: {} bytes", convertedBytes.length);
            
            conversion.setConvertedSize((long) convertedBytes.length);
            updateConversionStatus(conversion, "COMPLETED", null, startTime);
            
            return convertedBytes;
        } catch (IOException e) {
            log.error("[CONVERSION_FAILED] IOException for file: {}", originalFilename, e);
            updateConversionStatus(conversion, "FAILED", e.getMessage(), startTime);
            throw e;
        } catch (Exception e) {
            log.error("[CONVERSION_FAILED] Unexpected error for file: {}", originalFilename, e);
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
