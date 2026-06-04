package com.vcapelcin.pdftopdfa3.controller;

import com.vcapelcin.pdftopdfa3.service.PdfConversionService;
import com.vcapelcin.pdftopdfa3.service.XmlValidationService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Slf4j
public class PdfConversionController {
    private final PdfConversionService pdfConversionService;
    private final XmlValidationService xmlValidationService;
    private final Bucket bucket;

    public PdfConversionController(PdfConversionService pdfConversionService, 
                                 XmlValidationService xmlValidationService,
                                 Bucket bucket) {
        this.pdfConversionService = pdfConversionService;
        this.xmlValidationService = xmlValidationService;
        this.bucket = bucket;
    }

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<byte[]> convertPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "xmlFile", required = false) MultipartFile xmlFile,
            @RequestParam(value = "profile", defaultValue = "BASIC") String profile,
            HttpServletRequest request) throws Exception {
        
        String ipAddress = request.getRemoteAddr();
        
        log.info("Received request to convert file: {} (with xml: {}, profile: {}) from IP: {}", 
                file.getOriginalFilename(), 
                xmlFile != null ? xmlFile.getOriginalFilename() : "none",
                profile,
                ipAddress);
        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for file: {}", file.getOriginalFilename());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        if (file.isEmpty()) {
            log.error("Received empty file");
            throw new IllegalArgumentException("File is empty");
        }

        List<XmlValidationService.ValidationError> xmlErrors = null;
        if (xmlFile != null && !xmlFile.isEmpty()) {
            xmlErrors = xmlValidationService.validateXmlDetailed(xmlFile.getBytes());
            if (!xmlErrors.isEmpty()) {
                log.warn("XML Validation failed for file: {}. Errors: {}", xmlFile.getOriginalFilename(), xmlErrors.size());
            }
        }

        try {
            byte[] convertedPdf = pdfConversionService.convertToPdfA3(file, xmlFile, profile, ipAddress);

            String originalFilename = file.getOriginalFilename();
            String newFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";

            log.info("Successfully converted file: {} to {}", originalFilename, newFilename);

            ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + newFilename + "\"")
                    .contentType(MediaType.APPLICATION_PDF);

            if (xmlErrors != null && !xmlErrors.isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    String errorsJson = mapper.writeValueAsString(xmlErrors);
                    // Use standard Base64 encoding for the header
                    String encodedErrors = java.util.Base64.getEncoder().encodeToString(errorsJson.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    responseBuilder.header("X-XML-Validation-Errors", encodedErrors);
                    responseBuilder.header("Access-Control-Expose-Headers", "X-XML-Validation-Errors");
                    log.debug("Added {} XML validation errors to header (encoded length: {})", xmlErrors.size(), encodedErrors.length());
                } catch (Exception e) {
                    log.error("Failed to serialize XML errors", e);
                }
            }

            return responseBuilder.body(convertedPdf);
        } catch (Exception e) {
            log.error("Failed to convert PDF file: {}", file.getOriginalFilename(), e);
            throw e;
        }
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("Unhandled exception in controller", e);
        Map<String, Object> error = new HashMap<>();
        error.put("error", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", e.getMessage());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    private byte[] convertMapToBytes(Map<String, Object> map) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(map);
        } catch (IOException e) {
            return "{\"message\": \"Internal error\"}".getBytes();
        }
    }
}
