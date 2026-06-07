package com.vcapelcin.pdf2zugferd.controller;

import com.vcapelcin.pdf2zugferd.service.PdfConversionService;
import com.vcapelcin.pdf2zugferd.service.XmlValidationService;
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
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

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

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = {MediaType.APPLICATION_PDF_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public DeferredResult<ResponseEntity<?>> convertPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "xmlFile", required = false) MultipartFile xmlFile,
            @RequestParam(value = "profile", defaultValue = "BASIC") String profile,
            HttpServletRequest request) throws Exception {
        
        long startTime = System.currentTimeMillis();
        DeferredResult<ResponseEntity<?>> deferredResult = new DeferredResult<>(600000L); // 10 minutes
        String ipAddress = request.getRemoteAddr();
        String originalFilename = file.getOriginalFilename();
        
        log.info("Received request to convert file: {} (with xml: {}, profile: {}) from IP: {}", 
                originalFilename, 
                xmlFile != null ? xmlFile.getOriginalFilename() : "none",
                profile,
                ipAddress);

        deferredResult.onTimeout(() -> {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Conversion timed out after {}ms for file: {}", duration, originalFilename);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Request timed out. The file might be too large or the server is busy.");
            error.put("status", HttpStatus.REQUEST_TIMEOUT.value());
            error.put("timestamp", System.currentTimeMillis());
            deferredResult.setErrorResult(ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(error));
        });

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for file: {}", originalFilename);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Rate limit exceeded. Please try again later.");
            error.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            error.put("timestamp", System.currentTimeMillis());
            deferredResult.setResult(ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error));
            return deferredResult;
        }

        if (file.isEmpty()) {
            log.error("Received empty file");
            throw new IllegalArgumentException("File is empty");
        }

        // Use captured data for the async thread to avoid issues with temporary file cleanup
        byte[] pdfFileBytes = file.getBytes();
        byte[] xmlFileBytes = (xmlFile != null && !xmlFile.isEmpty()) ? xmlFile.getBytes() : null;
        String xmlOriginalFilename = (xmlFile != null) ? xmlFile.getOriginalFilename() : null;

        log.info("Starting async conversion for file: {} (PDF size: {} bytes)", originalFilename, pdfFileBytes.length);

        CompletableFuture.runAsync(() -> {
            try {
                List<XmlValidationService.ValidationError> xmlErrors = null;
                if (xmlFileBytes != null) {
                    xmlErrors = xmlValidationService.validateXmlDetailed(xmlFileBytes, profile);
                    if (!xmlErrors.isEmpty()) {
                        log.warn("XML Validation failed for file: {}. Errors: {}", xmlOriginalFilename, xmlErrors.size());
                    }
                }

                // Call service with bytes instead of MultipartFile if possible, or create a mock
                // Actually, let's update the service to accept bytes or keep it as is if it handles bytes
                List<XmlValidationService.ValidationError> pdfErrors = new java.util.ArrayList<>();
                byte[] convertedPdf = pdfConversionService.convertToPdfA3(pdfFileBytes, originalFilename, xmlFileBytes, xmlOriginalFilename, profile, ipAddress, pdfErrors);

                String newFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";

                log.info("Successfully converted file: {} to {} in {}ms", originalFilename, newFilename, System.currentTimeMillis() - startTime);

                ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + newFilename + "\"")
                        .contentType(MediaType.APPLICATION_PDF);

                List<XmlValidationService.ValidationError> allErrors = new java.util.ArrayList<>();
                if (xmlErrors != null) {
                    allErrors.addAll(xmlErrors);
                }
                allErrors.addAll(pdfErrors);

                if (!allErrors.isEmpty()) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        String errorsJson = mapper.writeValueAsString(allErrors);
                        String encodedErrors = java.util.Base64.getEncoder().encodeToString(errorsJson.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        responseBuilder.header("X-XML-Validation-Errors", encodedErrors);
                        responseBuilder.header("Access-Control-Expose-Headers", "X-XML-Validation-Errors");
                    } catch (Exception e) {
                        log.error("Failed to serialize validation errors", e);
                    }
                }

                if (!deferredResult.isSetOrExpired()) {
                    deferredResult.setResult(responseBuilder.body(convertedPdf));
                } else {
                    log.warn("Conversion finished but result already set or expired for file: {}", originalFilename);
                }
            } catch (Exception e) {
                log.error("Failed to convert PDF file: {}", originalFilename, e);
                if (!deferredResult.isSetOrExpired()) {
                    // Try to get the real cause if it's wrapped in an IOException or similar
                    Throwable rootCause = e;
                    while (rootCause.getCause() != null && rootCause != rootCause.getCause()) {
                        rootCause = rootCause.getCause();
                    }
                    
                    String errorMessage = rootCause.getMessage();
                    if (errorMessage == null || errorMessage.isEmpty()) {
                        errorMessage = e.getMessage();
                    }
                    if (errorMessage == null || errorMessage.isEmpty()) {
                        errorMessage = "An unexpected error occurred during conversion";
                    }

                    Map<String, Object> errorMap = new HashMap<>();
                    errorMap.put("error", errorMessage);
                    errorMap.put("message", errorMessage); // frontend uses message
                    errorMap.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
                    errorMap.put("timestamp", System.currentTimeMillis());
                    
                    // If it's a validation error or something that should be 400
                    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
                    if (rootCause instanceof SAXException || 
                        rootCause instanceof IllegalArgumentException || 
                        (errorMessage != null && errorMessage.contains("ZUGFeRD XML does not contain"))) {
                        status = HttpStatus.BAD_REQUEST;
                        errorMap.put("status", HttpStatus.BAD_REQUEST.value());
                    }

                    deferredResult.setResult(ResponseEntity.status(status)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(errorMap));
                }
            }
        });

        return deferredResult;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(org.springframework.web.multipart.MaxUploadSizeExceededException e) {
        log.error("File upload limit exceeded", e);
        Map<String, Object> error = new HashMap<>();
        error.put("error", "File size exceeds the allowed limit. Please upload a smaller file.");
        error.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        error.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e, HttpServletRequest request) {
        // If it's a client disconnect (Broken pipe), just log it and return empty response or similar
        // as the client is no longer there to receive it.
        if (e.getMessage() != null && (e.getMessage().contains("Broken pipe") || e.getMessage().contains("connection reset") || e instanceof org.springframework.web.context.request.async.AsyncRequestNotUsableException)) {
            log.warn("Client disconnected during conversion: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        log.error("Unhandled exception in controller", e);

        Map<String, Object> error = new HashMap<>();
        error.put("error", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
        error.put("message", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("timestamp", System.currentTimeMillis());
        
        // Ensure we can return JSON even if the request asked for PDF
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", e.getMessage());
        error.put("message", e.getMessage());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }

    private byte[] convertMapToBytes(Map<String, Object> map) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(map);
        } catch (IOException e) {
            return "{\"message\": \"Internal error\"}".getBytes();
        }
    }
}
