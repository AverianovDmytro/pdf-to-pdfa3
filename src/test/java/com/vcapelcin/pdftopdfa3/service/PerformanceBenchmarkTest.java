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
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class PerformanceBenchmarkTest {

    @Autowired
    private PdfConversionService pdfConversionService;

    @Test
    void benchmarkConversion() throws Exception {
        Path resourcesPath = Paths.get("src/test/resources/filesToConvert");
        File[] files = resourcesPath.toFile().listFiles((dir, name) -> name.toLowerCase().endsWith(".pdf"));
        if (files == null || files.length == 0) return;

        File testFile = files[0];
        byte[] content = Files.readAllBytes(testFile.toPath());
        MockMultipartFile multipartFile = new MockMultipartFile("file", testFile.getName(), "application/pdf", content);

        int iterations = 10;
        List<Long> times = new ArrayList<>();

        System.out.println("[DEBUG_LOG] Starting benchmark for " + testFile.getName() + " (" + iterations + " iterations)");
        
        Runtime runtime = Runtime.getRuntime();
        
        for (int i = 0; i < iterations; i++) {
            long start = System.currentTimeMillis();
            byte[] result = pdfConversionService.convertToPdfA3(multipartFile, null);
            long end = System.currentTimeMillis();
            
            assertNotNull(result);
            times.add(end - start);
            
            long memory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
            System.out.println("[DEBUG_LOG] Iteration " + (i + 1) + ": " + (end - start) + "ms, Memory: " + memory + "MB");
        }

        double average = times.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long max = times.stream().mapToLong(Long::longValue).max().orElse(0);
        long min = times.stream().mapToLong(Long::longValue).min().orElse(0);

        System.out.println("[DEBUG_LOG] Benchmark Results:");
        System.out.println("[DEBUG_LOG] Average Time: " + average + "ms");
        System.out.println("[DEBUG_LOG] Max Time: " + max + "ms");
        System.out.println("[DEBUG_LOG] Min Time: " + min + "ms");
    }
}
