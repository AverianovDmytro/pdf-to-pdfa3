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

        List<String> xmlErrors = null;
        if (xmlFile != null && !xmlFile.isEmpty()) {
            xmlErrors = xmlValidationService.validateXml(xmlFile.getBytes());
            if (!xmlErrors.isEmpty()) {
                log.warn("XML Validation failed for file: {}. Errors: {}", xmlFile.getOriginalFilename(), xmlErrors);
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
                    String errorsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(xmlErrors);
                    responseBuilder.header("X-XML-Validation-Errors", java.util.Base64.getEncoder().encodeToString(errorsJson.getBytes()));
                    responseBuilder.header("Access-Control-Expose-Headers", "X-XML-Validation-Errors");
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

    private byte[] convertMapToBytes(Map<String, Object> map) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(map);
        } catch (IOException e) {
            return "{\"message\": \"Internal error\"}".getBytes();
        }
    }
}
