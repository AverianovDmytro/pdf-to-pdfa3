package com.vcapelcin.pdftopdfa3.controller;

import com.vcapelcin.pdftopdfa3.service.PdfConversionService;
import io.github.bucket4j.Bucket;
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

@RestController
@RequestMapping("/api/v1")
@Slf4j
public class PdfConversionController {
    private final PdfConversionService pdfConversionService;
    private final Bucket bucket;

    public PdfConversionController(PdfConversionService pdfConversionService, Bucket bucket) {
        this.pdfConversionService = pdfConversionService;
        this.bucket = bucket;
    }

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<byte[]> convertPdf(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Received request to convert file: {}", file.getOriginalFilename());
        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for file: {}", file.getOriginalFilename());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        if (file.isEmpty()) {
            log.error("Received empty file");
            throw new IllegalArgumentException("File is empty");
        }

        try {
            byte[] convertedPdf = pdfConversionService.convertToPdfA3(file);

            String originalFilename = file.getOriginalFilename();
            String newFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";

            log.info("Successfully converted file: {} to {}", originalFilename, newFilename);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + newFilename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(convertedPdf);
        } catch (Exception e) {
            log.error("Failed to convert PDF file: {}", file.getOriginalFilename(), e);
            throw e;
        }
    }
}
