package com.vcapelcin.pdf2zugferd.service;

import com.vcapelcin.pdf2zugferd.model.Conversion;
import com.vcapelcin.pdf2zugferd.repository.ConversionRepository;
import lombok.extern.slf4j.Slf4j;
import org.mustangproject.ZUGFeRD.IZUGFeRDExporter;
import org.mustangproject.ZUGFeRD.ZUGFeRDExporterFromA1;
import org.mustangproject.validator.ZUGFeRDValidator;
import org.mustangproject.ZUGFeRD.Profiles;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfConversionService {

    private final ConversionRepository conversionRepository;
    private final ResourceLoader resourceLoader;

    @Value("${app.pdf.validation-max-size:2MB}")
    private String validationMaxSizeStr;

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

    public byte[] convertToPdfA3(byte[] pdfBytes, String originalFilename, byte[] xmlFileBytes, String xmlOriginalFilename, String zugferdConformanceLevel, String ipAddress) throws Exception {
        return convertToPdfA3(pdfBytes, originalFilename, xmlFileBytes, xmlOriginalFilename, zugferdConformanceLevel, ipAddress, null);
    }

    public byte[] convertToPdfA3(byte[] pdfBytes, String originalFilename, byte[] xmlFileBytes, String xmlOriginalFilename, String zugferdConformanceLevel, String ipAddress, List<XmlValidationService.ValidationError> pdfErrors) throws Exception {
        long startTime = System.currentTimeMillis();
        log.info("[CONVERSION_START] File: {}, Profile: {}, IP: {}", originalFilename, zugferdConformanceLevel, ipAddress);

        Conversion conversion = Conversion.builder()
                .filename(originalFilename)
                .status("PROCESSING")
                .ipAddress(ipAddress)
                .build();
        
        if (xmlFileBytes != null) {
            conversion.setXmlFilename(xmlOriginalFilename);
            conversion.setXmlSize((long) xmlFileBytes.length);
        }

        conversion = conversionRepository.save(conversion);

        if (!isPdfFile(pdfBytes)) {
            log.error("[CONVERSION_FAILED] File is not a valid PDF: {}", originalFilename);
            updateConversionStatus(conversion, "FAILED", "Invalid file type. Only PDF files are allowed.", startTime);
            throw new IOException("Invalid file type. Only PDF files are allowed.");
        }

        if (xmlFileBytes != null) {
            try {
                log.info("[XML_VALIDATION] Validating captured XML bytes against XSD");
                validateXmlAgainstXsd(xmlFileBytes);
                log.info("[XML_VALIDATION_SUCCESS] XML bytes are valid");
            } catch (Exception e) {
                log.warn("[XML_VALIDATION_WARNING] XML validation failed: {}", e.getMessage());
                // Throw it to catch it in the controller and show to the user as a real error
                throw e;
            }
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            conversion.setOriginalSize((long) pdfBytes.length);
            
            String targetFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";
            conversion.setTargetFilename(targetFilename);

            IZUGFeRDExporter exporter = new ZUGFeRDExporterFromA1();
            ((ZUGFeRDExporterFromA1)exporter).ignorePDFAErrors();

            log.info("[PDF_LOAD] Loading source PDF from bytes");
            try (java.io.ByteArrayInputStream pdfIs = new java.io.ByteArrayInputStream(pdfBytes)) {
                exporter.load(pdfIs);
            }

            exporter.setProfile(Profiles.getByName(zugferdConformanceLevel));
            
            if (xmlFileBytes != null) {
                log.info("[XML_ATTACH] Attaching XML bytes");
                exporter.setXML(xmlFileBytes);
            } else {
                log.info("[XML_ATTACH] Attaching dummy XML");
                byte[] dummyXml = ("<rsm:CrossIndustryInvoice xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\"></rsm:CrossIndustryInvoice>").getBytes();
                exporter.setXML(dummyXml);
            }

            log.info("[PDF_EXPORT] Exporting to PDF/A-3");
            exporter.export(out);
            byte[] convertedBytes = out.toByteArray();
            
            log.info("[PDFA_VALIDATION] Verifying PDF/A-3 compliance for document size: {} bytes", convertedBytes.length);
            long maxSize = parseSize(validationMaxSizeStr);
            if (convertedBytes.length <= maxSize) {
                List<XmlValidationService.ValidationError> errors = validatePdfA3(convertedBytes);
                if (pdfErrors != null && errors != null) {
                    pdfErrors.addAll(errors);
                }
            } else {
                log.info("[PDFA_VALIDATION_SKIPPED] File size > {}, skipping validation to speed up processing", validationMaxSizeStr);
            }
            
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

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String zugferdConformanceLevel, String ipAddress) throws Exception {
        return convertToPdfA3(file.getBytes(), file.getOriginalFilename(), 
                (xmlFile != null && !xmlFile.isEmpty()) ? xmlFile.getBytes() : null, 
                (xmlFile != null) ? xmlFile.getOriginalFilename() : null, 
                zugferdConformanceLevel, ipAddress);
    }

    private boolean isPdfFile(byte[] pdfBytes) {
        if (pdfBytes.length < 4) return false;
        // PDF magic bytes: %PDF (25 50 44 46)
        return pdfBytes[0] == 0x25 && pdfBytes[1] == 0x50 && pdfBytes[2] == 0x44 && pdfBytes[3] == 0x46;
    }

    private void validateXmlAgainstXsd(byte[] xmlBytes) throws Exception {
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        InputStream xsdStream = resourceLoader.getResource("classpath:xsd/zugferd22/factur-x.xsd").getInputStream();
        Schema schema = factory.newSchema(new StreamSource(xsdStream));
        Validator validator = schema.newValidator();
        validator.validate(new StreamSource(new java.io.ByteArrayInputStream(xmlBytes)));
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
        validateXmlAgainstXsd(xmlFile.getBytes());
    }

    public List<XmlValidationService.ValidationError> validatePdfA3(byte[] pdfBytes) {
        List<XmlValidationService.ValidationError> errors = new ArrayList<>();
        try {
            ZUGFeRDValidator validator = new ZUGFeRDValidator();
            // Need to write to temp file as ZUGFeRDValidator.validate(String) expects a filename
            java.io.File tempFile = java.io.File.createTempFile("pdfa-validation", ".pdf");
            try {
                java.nio.file.Files.write(tempFile.toPath(), pdfBytes);
                String report = validator.validate(tempFile.getAbsolutePath());
                
                // Mustang report is XML. 
                // We'll extract as much context as possible.
                if (report.contains("invalid") || report.contains("error") || report.contains("notice")) {
                    log.info("PDF/A-3 Validation potential issues for document: {}", report);
                    
                    // Improved regex to capture more context from the Mustang report
                    // Typically it has <error>...</error>, <notice>...</notice>
                    // Sometimes there is additional info in <summary> or other tags.
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("<(error|notice|warning)>(.*?)</\\1>", java.util.regex.Pattern.DOTALL);
                    java.util.regex.Matcher matcher = pattern.matcher(report);
                    while (matcher.find()) {
                        String type = matcher.group(1).toUpperCase();
                        String rawMessage = matcher.group(2).trim();
                        
                        // Clean up message while preserving important info
                        String message = rawMessage.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
                        
                        errors.add(XmlValidationService.ValidationError.builder()
                                .message(message)
                                .type(type.equals("NOTICE") ? "WARNING" : type)
                                .build());
                    }
                    
                    // If no specific messages found but status is invalid, provide a better hint
                    if (errors.isEmpty() && report.contains("invalid")) {
                        // Try to find a summary message
                        java.util.regex.Pattern summaryPattern = java.util.regex.Pattern.compile("status=\"invalid\"\\s+message=\"(.*?)\"");
                        java.util.regex.Matcher summaryMatcher = summaryPattern.matcher(report);
                        if (summaryMatcher.find()) {
                            errors.add(XmlValidationService.ValidationError.builder()
                                    .message("Validation failed: " + summaryMatcher.group(1))
                                    .type("ERROR")
                                    .build());
                        } else {
                            errors.add(XmlValidationService.ValidationError.builder()
                                    .message("ZUGFeRD validation failed with unknown error")
                                    .type("ERROR")
                                    .build());
                        }
                    }
                } else {
                    log.info("PDF/A-3 Validation report: {}", report);
                }
            } finally {
                tempFile.delete();
            }
        } catch (Exception e) {
            log.error("Error during PDF/A-3 validation", e);
        }
        return errors;
    }

    private long parseSize(String size) {
        if (size == null || size.isEmpty()) return 2 * 1024 * 1024;
        String upperSize = size.toUpperCase();
        if (upperSize.endsWith("MB")) {
            return Long.parseLong(upperSize.replace("MB", "").trim()) * 1024 * 1024;
        } else if (upperSize.endsWith("KB")) {
            return Long.parseLong(upperSize.replace("KB", "").trim()) * 1024;
        } else if (upperSize.endsWith("B")) {
            return Long.parseLong(upperSize.replace("B", "").trim());
        }
        try {
            return Long.parseLong(upperSize.trim());
        } catch (NumberFormatException e) {
            return 2 * 1024 * 1024; // Default to 2MB
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
