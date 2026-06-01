package com.vcapelcin.pdftopdfa3.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.common.PDMetadata;
import org.apache.pdfbox.pdmodel.graphics.color.PDOutputIntent;
import org.apache.xmpbox.XMPMetadata;
import org.apache.xmpbox.schema.PDFAIdentificationSchema;
import org.apache.xmpbox.xml.XmpSerializer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;

@Service
public class PdfConversionService {

    public byte[] convertToPdfA3(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {

            makePdfA3(document);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private void makePdfA3(PDDocument document) throws IOException {
        // This is a simplified conversion to PDF/A-3.
        // A full conversion requires embedding fonts, ICC profiles, etc.
        // For this task, we'll set the necessary metadata.

        XMPMetadata xmp = XMPMetadata.createXMPMetadata();
        PDFAIdentificationSchema id = xmp.createAndAddPDFAIdentificationSchema();
        try {
            id.setPart(3);
            id.setConformance("B"); // Basic conformance
        } catch (Exception e) {
            throw new IOException("Failed to set PDFA identification schema", e);
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

        // Set output intent (simplified)
        InputStream colorProfile = getClass().getResourceAsStream("/sRGB.icc");
        if (colorProfile != null) {
            PDOutputIntent intent = new PDOutputIntent(document, colorProfile);
            intent.setInfo("sRGB IEC61966-2.1");
            intent.setOutputCondition("sRGB IEC61966-2.1");
            intent.setOutputConditionIdentifier("sRGB IEC61966-2.1");
            intent.setRegistryName("http://www.color.org");
            document.getDocumentCatalog().addOutputIntent(intent);
        }

        PDDocumentInformation info = document.getDocumentInformation();
        info.setModificationDate(Calendar.getInstance());
    }
}
