package com.vcapelcin.pdftopdfa3.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class BulkConversionTest {

    @Autowired
    private PdfConversionService pdfConversionService;

    @Test
    void convertAllFilesFromFilesToConvert() throws Exception {
        Path resourcesPath = Paths.get("src/test/resources/filesToConvert");
        assertTrue(Files.exists(resourcesPath), "Resources directory does not exist: " + resourcesPath.toAbsolutePath());

        File[] files = resourcesPath.toFile().listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));
        assertNotNull(files, "No files found in " + resourcesPath.toAbsolutePath());
        assertTrue(files.length > 0, "No PDF files found in " + resourcesPath.toAbsolutePath());

        Path outputDir = Paths.get("target/converted-files");
        Files.createDirectories(outputDir);

        for (File file : files) {
            System.out.println("[DEBUG_LOG] Converting file: " + file.getName());
            byte[] content = Files.readAllBytes(file.toPath());
            MockMultipartFile multipartFile = new MockMultipartFile(
                    "file",
                    file.getName(),
                    "application/pdf",
                    content
            );

            byte[] convertedContent = pdfConversionService.convertToPdfA3(multipartFile, null);
            
            assertNotNull(convertedContent, "Conversion result is null for file: " + file.getName());
            assertTrue(convertedContent.length > 0, "Conversion result is empty for file: " + file.getName());

            // Automated Compliance Check (Internal Validation)
            pdfConversionService.validatePdfA3(convertedContent);
            
            Path outputPath = outputDir.resolve(file.getName().replace(".pdf", "-converted.pdf"));
            Files.write(outputPath, convertedContent);
            System.out.println("[DEBUG_LOG] Successfully converted and saved to: " + outputPath.toAbsolutePath());
        }
    }
}
