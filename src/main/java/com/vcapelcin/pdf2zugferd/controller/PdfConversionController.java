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
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

            // Step 1: Validate source PDF
            List<XmlValidationService.ValidationError> pdfErrors =
                    pdfConversionService.validateSourcePdf(pdfFileBytes);

            // Step 2: Validate XML
            List<XmlValidationService.ValidationError> xmlErrors = new java.util.ArrayList<>();
            if (xmlFileBytes != null) {
                xmlErrors = xmlValidationService.validateXmlDetailed(xmlFileBytes, profile);
                if (!xmlErrors.isEmpty()) {
                    log.warn("XML validation issues for file: {}. Count: {}", xmlOriginalFilename, xmlErrors.size());
                }
            }

            // Step 3: Convert
            byte[] convertedPdf = null;
            Exception conversionException = null;
            try {
                convertedPdf = pdfConversionService.convertToPdfA3(
                        pdfFileBytes, originalFilename, xmlFileBytes, xmlOriginalFilename, profile, ipAddress);
                log.info("Successfully converted file: {} in {}ms", originalFilename, System.currentTimeMillis() - startTime);
            } catch (Exception e) {
                conversionException = e;
                log.error("Conversion failed for file: {}", originalFilename, e);
            }

            // Step 4: Validate result (only when conversion succeeded)
            List<XmlValidationService.ValidationError> pdfa3Errors = new java.util.ArrayList<>();
            if (convertedPdf != null) {
                pdfa3Errors.addAll(pdfConversionService.validatePdfA3(convertedPdf));
            } else {
                Throwable root = conversionException;
                while (root != null && root.getCause() != null && root != root.getCause()) root = root.getCause();
                String reason = root != null && root.getMessage() != null ? root.getMessage() : "Conversion failed";
                pdfa3Errors.add(XmlValidationService.ValidationError.builder()
                        .message("PDF/A-3 validation was not performed: " + reason)
                        .type("WARNING")
                        .build());
            }

            // Build and send response
            try {
                String xmlJson    = mapper.writeValueAsString(xmlErrors);
                String pdfJson    = mapper.writeValueAsString(pdfErrors);
                String pdfa3Json  = mapper.writeValueAsString(pdfa3Errors);
                String exposeHdr  = "X-XML-Validation-Errors, X-PDF-Validation-Errors, X-PDFA3-Validation-Errors";

                if (convertedPdf != null && !deferredResult.isSetOrExpired()) {
                    String newFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";
                    deferredResult.setResult(
                            ResponseEntity.ok()
                                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + newFilename + "\"")
                                    .contentType(MediaType.APPLICATION_PDF)
                                    .header("X-XML-Validation-Errors",   xmlJson)
                                    .header("X-PDF-Validation-Errors",   pdfJson)
                                    .header("X-PDFA3-Validation-Errors", pdfa3Json)
                                    .header("Access-Control-Expose-Headers", exposeHdr)
                                    .body(convertedPdf));
                } else if (!deferredResult.isSetOrExpired()) {
                    Throwable root = conversionException;
                    while (root != null && root.getCause() != null && root != root.getCause()) root = root.getCause();
                    String errorMessage = root != null && root.getMessage() != null ? root.getMessage() : "An unexpected error occurred";
                    HttpStatus status = (root instanceof SAXException || root instanceof IllegalArgumentException)
                            ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;

                    Map<String, Object> errorMap = new HashMap<>();
                    errorMap.put("error",   errorMessage);
                    errorMap.put("message", errorMessage);
                    errorMap.put("status",  status.value());
                    errorMap.put("timestamp", System.currentTimeMillis());

                    deferredResult.setResult(
                            ResponseEntity.status(status)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .header("X-XML-Validation-Errors",   xmlJson)
                                    .header("X-PDF-Validation-Errors",   pdfJson)
                                    .header("X-PDFA3-Validation-Errors", pdfa3Json)
                                    .header("Access-Control-Expose-Headers", exposeHdr)
                                    .body(errorMap));
                }
            } catch (Exception serEx) {
                log.error("Failed to build response", serEx);
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
