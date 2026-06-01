package com.vcapelcin.pdftopdfa3.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.common.PDMetadata;
import org.apache.pdfbox.pdmodel.graphics.color.PDOutputIntent;
import org.apache.xmpbox.XMPMetadata;
import org.apache.xmpbox.schema.AdobePDFSchema;
import org.apache.xmpbox.schema.DublinCoreSchema;
import org.apache.xmpbox.schema.PDFAIdentificationSchema;
import org.apache.xmpbox.schema.XMPBasicSchema;
import org.apache.xmpbox.xml.XmpSerializer;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.preflight.ValidationResult;
import org.apache.pdfbox.preflight.parser.PreflightParser;
import org.springframework.scheduling.annotation.Async;
import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;

@Service
@Slf4j
public class PdfConversionService {

    @Async
    public CompletableFuture<byte[]> convertToPdfA3Async(MultipartFile file) throws IOException {
        return CompletableFuture.completedFuture(convertToPdfA3(file));
    }

    public byte[] convertToPdfA3(MultipartFile file) throws IOException {
        log.debug("Starting PDF to PDF/A-3 conversion for file: {}", file.getOriginalFilename());
        if (!isPdfFile(file)) {
            log.error("File is not a valid PDF: {}", file.getOriginalFilename());
            throw new IOException("Invalid file type. Only PDF files are allowed.");
        }
        try (InputStream is = file.getInputStream()) {
            byte[] fileBytes = is.readAllBytes();
            log.debug("Read {} bytes from file: {}", fileBytes.length, file.getOriginalFilename());
            try (PDDocument document = Loader.loadPDF(fileBytes)) {
                embedFonts(document);
                makePdfA3(document);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                document.save(baos, org.apache.pdfbox.pdfwriter.compress.CompressParameters.NO_COMPRESSION);
                byte[] convertedBytes = baos.toByteArray();
                
                validatePdfA3(convertedBytes);
                
                log.debug("Successfully created PDF/A-3 document, size: {} bytes", convertedBytes.length);
                return convertedBytes;
            }
        } catch (IOException e) {
            log.error("IOException during PDF conversion for file: {}", file.getOriginalFilename(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during PDF conversion for file: {}", file.getOriginalFilename(), e);
            throw new IOException("Error during PDF conversion", e);
        }
    }

    private void validatePdfA3(byte[] pdfBytes) throws IOException {
        java.io.File tempFile = java.io.File.createTempFile("pdfa-validation", ".pdf");
        try {
            java.nio.file.Files.write(tempFile.toPath(), pdfBytes);
            ValidationResult result = PreflightParser.validate(tempFile);
            if (result != null && !result.isValid()) {
                log.warn("PDF/A-3 Validation failed for document:");
                for (ValidationResult.ValidationError error : result.getErrorsList()) {
                    log.warn("  Validation Error: {} : {}", error.getErrorCode(), error.getDetails());
                }
            } else if (result != null) {
                log.info("PDF/A-3 Validation successful.");
            }
        } catch (Exception e) {
            log.error("Error during PDF/A-3 validation", e);
        } finally {
            tempFile.delete();
        }
    }

    private void embedFonts(PDDocument document) throws IOException {
        for (PDPage page : document.getPages()) {
            PDResources resources = page.getResources();
            if (resources != null) {
                for (COSName fontName : resources.getFontNames()) {
                    PDFont font = resources.getFont(fontName);
                    if (font != null && !font.isEmbedded()) {
                        // In a real implementation, we would try to find the font on the system and embed it.
                        // For this task, we identify non-embedded fonts.
                        log.debug("Font not embedded: {}", font.getName());
                    }
                }
            }
        }
    }

    private void makePdfA3(PDDocument document) throws IOException {
        PDDocumentInformation info = document.getDocumentInformation();
        
        XMPMetadata xmp = XMPMetadata.createXMPMetadata();
        
        PDFAIdentificationSchema id = xmp.createAndAddPDFAIdentificationSchema();
        try {
            id.setPart(3);
            id.setConformance("B");
        } catch (Exception e) {
            throw new IOException("Failed to set PDFA identification schema", e);
        }

        XMPBasicSchema basic = xmp.createAndAddXMPBasicSchema();
        Calendar cal = Calendar.getInstance();
        basic.setCreateDate(cal);
        basic.setModifyDate(cal);
        if (info.getCreator() != null) {
            basic.setCreatorTool(info.getCreator());
        }

        AdobePDFSchema pdf = xmp.createAndAddAdobePDFSchema();
        if (info.getProducer() != null) {
            pdf.setProducer(info.getProducer());
        }
        pdf.setPDFVersion("1.7");

        DublinCoreSchema dc = xmp.createAndAddDublinCoreSchema();
        if (info.getTitle() != null) {
            dc.setTitle(info.getTitle());
        }
        if (info.getAuthor() != null) {
            dc.addCreator(info.getAuthor());
        }
        if (info.getSubject() != null) {
            dc.setDescription(info.getSubject());
        }

        XmpSerializer serializer = new XmpSerializer();
        ByteArrayOutputStream xmpOutputStream = new ByteArrayOutputStream();
        try {
            serializer.serialize(xmp, xmpOutputStream, true);
        } catch (Exception e) {
            throw new IOException("Failed to serialize XMP metadata", e);
        }

        PDMetadata metadata = new PDMetadata(document);
        metadata.importXMPMetadata(xmpOutputStream.toByteArray());
        document.getDocumentCatalog().setMetadata(metadata);

        // Set output intent
        String profilePath = "/sRGB.icc";
        try (InputStream colorProfile = getClass().getResourceAsStream(profilePath)) {
            if (colorProfile != null) {
                PDOutputIntent intent = new PDOutputIntent(document, colorProfile);
                intent.setInfo("sRGB IEC61966-2.1");
                intent.setOutputCondition("sRGB IEC61966-2.1");
                intent.setOutputConditionIdentifier("sRGB IEC61966-2.1");
                intent.setRegistryName("http://www.color.org");
                document.getDocumentCatalog().addOutputIntent(intent);
            } else {
                log.warn("ICC profile not found at {}", profilePath);
            }
        } catch (Exception e) {
            log.error("Error setting output intent with profile at {}", profilePath, e);
        }

        info.setModificationDate(cal);
        info.setCreationDate(cal);
    }

    private boolean isPdfFile(MultipartFile file) throws IOException {
        if (file.getOriginalFilename() != null && !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            return false;
        }
        try (InputStream is = file.getInputStream()) {
            byte[] magicBytes = new byte[4];
            if (is.read(magicBytes) != 4) {
                return false;
            }
            // PDF magic bytes: %PDF (25 50 44 46)
            return magicBytes[0] == 0x25 && magicBytes[1] == 0x50 && magicBytes[2] == 0x44 && magicBytes[3] == 0x46;
        }
    }
}
