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
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
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
            log.info("[XML_VALIDATION] Validating XML against XSD");
            validateXmlAgainstXsd(xmlFileBytes);
            log.info("[XML_VALIDATION_SUCCESS] XML is valid");
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
            throw e;
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

    public List<XmlValidationService.ValidationError> validateSourcePdf(byte[] pdfBytes) {
        List<XmlValidationService.ValidationError> errors = new ArrayList<>();
        if (!isPdfFile(pdfBytes)) {
            errors.add(XmlValidationService.ValidationError.builder()
                    .message("File is not a valid PDF (invalid file header)")
                    .type("ERROR")
                    .build());
            return errors;
        }
        try {
            IZUGFeRDExporter exporter = new ZUGFeRDExporterFromA1();
            ((ZUGFeRDExporterFromA1) exporter).ignorePDFAErrors();
            try (java.io.ByteArrayInputStream is = new java.io.ByteArrayInputStream(pdfBytes)) {
                exporter.load(is);
            }
        } catch (Exception e) {
            errors.add(XmlValidationService.ValidationError.builder()
                    .message("Source PDF could not be loaded: " + e.getMessage())
                    .type("ERROR")
                    .build());
        }
        return errors;
    }

    public List<XmlValidationService.ValidationError> validatePdfA3(byte[] pdfBytes) {
        long maxSize = parseSize(validationMaxSizeStr);
        if (pdfBytes.length > maxSize) {
            log.info("[PDFA3_VALIDATION_SKIPPED] File size {} > {}", pdfBytes.length, validationMaxSizeStr);
            List<XmlValidationService.ValidationError> result = new ArrayList<>();
            result.add(XmlValidationService.ValidationError.builder()
                    .message("Validation was not processed: file size exceeds the limit of " + validationMaxSizeStr)
                    .type("WARNING")
                    .build());
            return result;
        }
        List<XmlValidationService.ValidationError> errors = new ArrayList<>();
        try {
            ZUGFeRDValidator validator = new ZUGFeRDValidator();
            java.io.File tempFile = java.io.File.createTempFile("pdfa3-validation", ".pdf");
            try {
                java.nio.file.Files.write(tempFile.toPath(), pdfBytes);
                String report = validator.validate(tempFile.getAbsolutePath());
                parseMustangReport(report, errors, false);
            } finally {
                tempFile.delete();
            }
        } catch (Exception e) {
            log.error("Error during PDF/A-3 validation", e);
            errors.add(XmlValidationService.ValidationError.builder()
                    .message("PDF/A-3 validation failed unexpectedly: " + e.getMessage())
                    .type("ERROR")
                    .build());
        }
        return errors;
    }

    protected void parseMustangReport(String report, List<XmlValidationService.ValidationError> errors, boolean pdfStructureOnly) {
        if (report == null || report.isEmpty()) return;
        try {
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            dbFactory.setNamespaceAware(true);
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            java.io.InputStream is = new java.io.ByteArrayInputStream(report.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            Document doc = dBuilder.parse(is);
            doc.getDocumentElement().normalize();

            // PDF/A-3 structural errors — always included
            String[] tags = {"error", "warning", "notice"};
            for (String tag : tags) {
                NodeList nodeList = doc.getElementsByTagName(tag);
                for (int i = 0; i < nodeList.getLength(); i++) {
                    Element element = (Element) nodeList.item(i);
                    String message = element.getTextContent().trim();
                    String type = tag.equalsIgnoreCase("notice") ? "WARNING" : tag.toUpperCase();
                    errors.add(XmlValidationService.ValidationError.builder()
                            .message(message)
                            .type(type)
                            .build());
                }
            }

            // ZUGFeRD business-rule assertions (Schematron) — skipped in PDF-structure-only mode
            if (!pdfStructureOnly) {
                NodeList failedAsserts = doc.getElementsByTagName("failedAssert");
                for (int i = 0; i < failedAsserts.getLength(); i++) {
                    Element element = (Element) failedAsserts.item(i);
                    String test = element.getAttribute("test");
                    String location = element.getAttribute("location");
                    String message = element.getTextContent().trim();
                    errors.add(XmlValidationService.ValidationError.builder()
                            .message(message + (test.isEmpty() ? "" : " (Test: " + test + ")"))
                            .location(location)
                            .type("ERROR")
                            .build());
                }

                // Generic ZUGFeRD content fallback — skipped in PDF-structure-only mode
                if (errors.isEmpty() && report.contains("status=\"invalid\"")) {
                    errors.add(XmlValidationService.ValidationError.builder()
                            .message("ZUGFeRD validation failed (Mustang report indicates invalid status)")
                            .type("ERROR")
                            .build());
                }
            }

        } catch (Exception parseEx) {
            log.error("Failed to parse Mustang XML report, falling back to regex", parseEx);
            parseReportWithRegex(report, errors, pdfStructureOnly);
        }
    }

    protected void parseMustangReport(String report, List<XmlValidationService.ValidationError> errors) {
        parseMustangReport(report, errors, false);
    }

    private void parseReportWithRegex(String report, List<XmlValidationService.ValidationError> errors, boolean pdfStructureOnly) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("<(error|notice|warning)>(.*?)</\\1>", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcher = pattern.matcher(report);
        while (matcher.find()) {
            String type = matcher.group(1).toUpperCase();
            String rawMessage = matcher.group(2).trim();
            String message = rawMessage.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
            errors.add(XmlValidationService.ValidationError.builder()
                    .message(message)
                    .type(type.equals("NOTICE") ? "WARNING" : type)
                    .build());
        }

        if (!pdfStructureOnly && errors.isEmpty() && report.contains("status=\"invalid\"")) {
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
