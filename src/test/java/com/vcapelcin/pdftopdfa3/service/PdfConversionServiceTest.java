package com.vcapelcin.pdftopdfa3.service;

import com.vcapelcin.pdftopdfa3.repository.ConversionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class PdfConversionServiceTest {

    @Autowired
    private PdfConversionService pdfConversionService;

    @Autowired
    private ConversionRepository conversionRepository;

    @Test
    void testConversionPersistence() throws Exception {
        byte[] pdfContent = "%PDF-1.7\n%\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Count 1/Kids[3 0 R]>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000111 00000 n \ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "persistence_test.pdf", "application/pdf", pdfContent);

        long beforeCount = conversionRepository.count();
        pdfConversionService.convertToPdfA3(file, null, "127.0.0.1");
        long afterCount = conversionRepository.count();

        assertEquals(beforeCount + 1, afterCount);
        var conversions = conversionRepository.findAll();
        var lastConversion = conversions.get(conversions.size() - 1);
        assertEquals("persistence_test.pdf", lastConversion.getFilename());
        assertEquals("persistence_test_a3.pdf", lastConversion.getTargetFilename());
        assertEquals("COMPLETED", lastConversion.getStatus());
        assertEquals("127.0.0.1", lastConversion.getIpAddress());
        assertNotNull(lastConversion.getOriginalSize());
        assertNotNull(lastConversion.getConvertedSize());
        assertNotNull(lastConversion.getProcessingTimeMs());
    }

    @Test
    void testFailedConversionPersistence() {
        byte[] invalidContent = "Hello World".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "failed_test.txt", "text/plain", invalidContent);

        long beforeCount = conversionRepository.count();
        assertThrows(Exception.class, () -> pdfConversionService.convertToPdfA3(file, null));
        long afterCount = conversionRepository.count();

        assertEquals(beforeCount + 1, afterCount);
        var conversions = conversionRepository.findAll();
        var lastConversion = conversions.get(conversions.size() - 1);
        assertEquals("failed_test.txt", lastConversion.getFilename());
        assertEquals("FAILED", lastConversion.getStatus());
        assertNotNull(lastConversion.getErrorMessage());
    }

    @Test
    void testIsPdfFileWithValidPdf() throws Exception {
        byte[] pdfContent = "%PDF-1.7\n%\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Count 1/Kids[3 0 R]>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000111 00000 n \ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfContent);
        
        assertDoesNotThrow(() -> pdfConversionService.convertToPdfA3(file, null));
    }

    @Test
    void testConvertSampleFile() throws Exception {
        java.io.File sampleFile = new java.io.File("src/main/resources/test-files/sample-a4.pdf");
        if (!sampleFile.exists()) {
            return;
        }
        byte[] content = java.nio.file.Files.readAllBytes(sampleFile.toPath());
        MockMultipartFile file = new MockMultipartFile("file", "sample-a4.pdf", "application/pdf", content);

        byte[] converted = pdfConversionService.convertToPdfA3(file, null);
        assertNotNull(converted);
    }
    @Test
    void testIsPdfFileWithInvalidFile() {
        byte[] invalidContent = "Hello World".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", invalidContent);
        
        assertThrows(Exception.class, () -> pdfConversionService.convertToPdfA3(file, null));
    }

    @Test
    void testConversionWithXmlEmbedding() throws Exception {
        byte[] pdfContent = "%PDF-1.7\n%\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Count 1/Kids[3 0 R]>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000111 00000 n \ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfContent);
        
        // Use a minimal valid ZUGFeRD XML
        byte[] xmlContent = "<rsm:CrossIndustryInvoice xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\"></rsm:CrossIndustryInvoice>".getBytes();
        MockMultipartFile xmlFile = new MockMultipartFile("xmlFile", "factur-x.xml", "text/xml", xmlContent);

        // It should NOT throw an exception now
        assertDoesNotThrow(() -> pdfConversionService.convertToPdfA3(file, xmlFile));
        
        var conversions = conversionRepository.findAll();
        var lastConversion = conversions.get(conversions.size() - 1);
        assertEquals("COMPLETED", lastConversion.getStatus());
    }
}
