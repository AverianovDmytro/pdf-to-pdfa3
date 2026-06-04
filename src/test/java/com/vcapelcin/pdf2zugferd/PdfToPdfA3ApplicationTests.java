package com.vcapelcin.pdf2zugferd;

import com.vcapelcin.pdf2zugferd.service.PdfConversionService;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PdfToPdfA3ApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PdfConversionService pdfConversionService;

    @MockBean
    private Bucket bucket;

    @BeforeEach
    void setUp() {
        when(bucket.tryConsume(1)).thenReturn(true);
    }

    @Test
    void shouldConvertPdf() throws Exception {
        byte[] pdfContent = "%PDF-1.4\n%...".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfContent
        );

        when(pdfConversionService.convertToPdfA3(any(), any())).thenReturn(pdfContent);

        mockMvc.perform(multipart("/api/v1/convert").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test_a3.pdf\""));
    }

    @Test
    void shouldReturnBadRequestWhenFileIsEmpty() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                new byte[0]
        );

        mockMvc.perform(multipart("/api/v1/convert").file(file))
                .andExpect(status().isBadRequest());
    }
}
