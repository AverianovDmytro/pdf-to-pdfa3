package com.vcapelcin.pdftopdfa3.controller;

import com.vcapelcin.pdftopdfa3.service.PdfConversionService;
import org.springframework.http.HttpHeaders;
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
class PdfConversionController {

    private final PdfConversionService pdfConversionService;

    public PdfConversionController(PdfConversionService pdfConversionService) {
        this.pdfConversionService = pdfConversionService;
    }

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<byte[]> convertPdf(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        byte[] convertedPdf = pdfConversionService.convertToPdfA3(file);

        String originalFilename = file.getOriginalFilename();
        String newFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + newFilename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(convertedPdf);
    }
}
