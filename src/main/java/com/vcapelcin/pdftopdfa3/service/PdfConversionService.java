package com.vcapelcin.pdftopdfa3.service;

import com.vcapelcin.pdftopdfa3.model.Conversion;
import com.vcapelcin.pdftopdfa3.repository.ConversionRepository;
import lombok.RequiredArgsConstructor;
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
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.preflight.ValidationResult;
import org.apache.pdfbox.preflight.parser.PreflightParser;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.common.filespecification.PDComplexFileSpecification;
import org.apache.pdfbox.pdmodel.common.filespecification.PDEmbeddedFile;
import org.apache.xmpbox.schema.XMPSchema;
import org.apache.xmpbox.type.AbstractStructuredType;
import org.apache.xmpbox.type.StructuredType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.scheduling.annotation.Async;
import java.util.concurrent.CompletableFuture;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Calendar;

@Service
@Slf4j
public class PdfConversionService {

    private final ConversionRepository conversionRepository;
    private final ResourceLoader resourceLoader;

    @Value("${app.font-directory:src/main/resources/fonts}")
    private String fontDirectory;

    public PdfConversionService(ConversionRepository conversionRepository, ResourceLoader resourceLoader) {
        this.conversionRepository = conversionRepository;
        this.resourceLoader = resourceLoader;
    }

    @Async
    public CompletableFuture<byte[]> convertToPdfA3Async(MultipartFile file, MultipartFile xmlFile, String ipAddress) throws Exception {
        return CompletableFuture.completedFuture(convertToPdfA3(file, xmlFile, "BASIC", ipAddress));
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile) throws Exception {
        return convertToPdfA3(file, xmlFile, "BASIC", null);
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String ipAddress) throws Exception {
        return convertToPdfA3(file, xmlFile, "BASIC", ipAddress);
    }

    public byte[] convertToPdfA3(MultipartFile file, MultipartFile xmlFile, String zugferdConformanceLevel, String ipAddress) throws Exception {
        long startTime = System.currentTimeMillis();
        String originalFilename = file.getOriginalFilename();
        log.debug("Starting PDF to PDF/A-3 conversion for file: {} (Profile: {})", originalFilename, zugferdConformanceLevel);

        Conversion conversion = Conversion.builder()
                .filename(originalFilename)
                .status("PROCESSING")
                .ipAddress(ipAddress)
                .build();
        
        if (xmlFile != null && !xmlFile.isEmpty()) {
            conversion.setXmlFilename(xmlFile.getOriginalFilename());
            conversion.setXmlSize(xmlFile.getSize());
        }

        conversion = conversionRepository.save(conversion);

        if (!isPdfFile(file)) {
            log.error("File is not a valid PDF: {}", originalFilename);
            updateConversionStatus(conversion, "FAILED", "Invalid file type. Only PDF files are allowed.", startTime);
            throw new IOException("Invalid file type. Only PDF files are allowed.");
        }

        if (xmlFile != null && !xmlFile.isEmpty()) {
            try {
                validateXmlAgainstXsd(xmlFile);
            } catch (Exception e) {
                log.error("XML validation failed: {}", e.getMessage());
                updateConversionStatus(conversion, "FAILED", "XML Validation Error: " + e.getMessage(), startTime);
                throw e;
            }
        }

        try (InputStream is = file.getInputStream()) {
            byte[] fileBytes = is.readAllBytes();
            conversion.setOriginalSize((long) fileBytes.length);
            log.debug("Read {} bytes from file: {}", fileBytes.length, originalFilename);
            
            String targetFilename = (originalFilename != null ? originalFilename.replace(".pdf", "") : "converted") + "_a3.pdf";
            conversion.setTargetFilename(targetFilename);

        try (PDDocument document = Loader.loadPDF(fileBytes)) {
                embedFonts(document);
                
                String embeddedXmlFilename = null;
                if (xmlFile != null && !xmlFile.isEmpty()) {
                    // Use standard ZUGFeRD 2.x / Factur-X filename
                    embeddedXmlFilename = "factur-x.xml";
                    embedZugferdXml(document, xmlFile.getBytes(), embeddedXmlFilename);
                }

                makePdfA3(document, embeddedXmlFilename, zugferdConformanceLevel);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                document.save(baos, org.apache.pdfbox.pdfwriter.compress.CompressParameters.NO_COMPRESSION);
                byte[] convertedBytes = baos.toByteArray();
                
                validatePdfA3(convertedBytes);
                
                log.debug("Successfully created PDF/A-3 document, size: {} bytes", convertedBytes.length);
                
                conversion.setConvertedSize((long) convertedBytes.length);
                updateConversionStatus(conversion, "COMPLETED", null, startTime);
                
                return convertedBytes;
            }
        } catch (IOException e) {
            log.error("IOException during PDF conversion for file: {}", originalFilename, e);
            updateConversionStatus(conversion, "FAILED", e.getMessage(), startTime);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during PDF conversion for file: {}", originalFilename, e);
            updateConversionStatus(conversion, "FAILED", e.getMessage(), startTime);
            throw new IOException("Error during PDF conversion", e);
        }
    }

    private void updateConversionStatus(Conversion conversion, String status, String errorMessage, long startTime) {
        try {
            conversion.setStatus(status);
            conversion.setErrorMessage(errorMessage);
            conversion.setProcessingTimeMs(System.currentTimeMillis() - startTime);
            conversionRepository.save(conversion);
        } catch (Exception e) {
            log.error("Failed to update conversion status in database", e);
        }
    }

    private void validateXmlAgainstXsd(MultipartFile xmlFile) throws Exception {
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        // Using Factur-X / ZUGFeRD 2.2 XSD
        InputStream xsdStream = resourceLoader.getResource("classpath:xsd/zugferd22/factur-x.xsd").getInputStream();
        Schema schema = factory.newSchema(new StreamSource(xsdStream));
        Validator validator = schema.newValidator();
        validator.validate(new StreamSource(xmlFile.getInputStream()));
        log.info("XML Validation against XSD successful.");
    }

    public void validatePdfA3(byte[] pdfBytes) throws IOException {
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
                        log.debug("Font not embedded: {}. Attempting to embed.", font.getName());
                        try {
                            // Try to find the font in the configured font directory
                            String ttfFilename = font.getName().replace("+", "") + ".ttf";
                            File fontFile = new File(fontDirectory, ttfFilename);
                            if (fontFile.exists()) {
                                PDType0Font.load(document, fontFile);
                                log.info("Successfully embedded font: {}", font.getName());
                            } else {
                                log.warn("Font file not found in directory: {}", fontFile.getAbsolutePath());
                            }
                        } catch (Exception e) {
                            log.error("Failed to embed font: {}", font.getName(), e);
                        }
                    }
                }
            }
        }
    }

    private void embedZugferdXml(PDDocument document, byte[] xmlBytes, String filename) throws IOException {
        log.debug("Embedding ZUGFeRD XML: {}", filename);
        
        PDEmbeddedFile embeddedFile = new PDEmbeddedFile(document, new java.io.ByteArrayInputStream(xmlBytes));
        embeddedFile.setSubtype("text/xml");
        embeddedFile.setSize(xmlBytes.length);
        embeddedFile.setCreationDate(Calendar.getInstance());
        embeddedFile.setModDate(Calendar.getInstance());

        PDComplexFileSpecification fileSpec = new PDComplexFileSpecification();
        fileSpec.setFile(filename);
        fileSpec.setEmbeddedFile(embeddedFile);
        fileSpec.setEmbeddedFileUnicode(embeddedFile);
        
        COSDictionary dict = fileSpec.getCOSObject();
        dict.setName(COSName.getPDFName("AFRelationship"), "Data");

        PDDocumentCatalog catalog = document.getDocumentCatalog();
        COSName afName = COSName.getPDFName("AF");
        org.apache.pdfbox.cos.COSArray afArray = (org.apache.pdfbox.cos.COSArray) catalog.getCOSObject().getDictionaryObject(afName);
        if (afArray == null) {
            afArray = new org.apache.pdfbox.cos.COSArray();
            catalog.getCOSObject().setItem(afName, afArray);
        }
        afArray.add(fileSpec);

        org.apache.pdfbox.pdmodel.PDDocumentNameDictionary names = catalog.getNames();
        if (names == null) {
            names = new org.apache.pdfbox.pdmodel.PDDocumentNameDictionary(catalog);
            catalog.setNames(names);
        }
        org.apache.pdfbox.pdmodel.PDEmbeddedFilesNameTreeNode efTree = names.getEmbeddedFiles();
        if (efTree == null) {
            efTree = new org.apache.pdfbox.pdmodel.PDEmbeddedFilesNameTreeNode();
            names.setEmbeddedFiles(efTree);
        }
        
        java.util.Map<String, PDComplexFileSpecification> namesMap = new java.util.HashMap<>();
        namesMap.put(filename, fileSpec);
        efTree.setNames(namesMap);
    }

    private void makePdfA3(PDDocument document, String xmlFilename, String conformanceLevel) throws IOException {
        PDDocumentInformation info = document.getDocumentInformation();
        
        XMPMetadata xmp = XMPMetadata.createXMPMetadata();
        
        if (xmlFilename != null) {
            try {
                // Add ZUGFeRD extension schema
                // Using Factur-X / ZUGFeRD 2.x namespace
                String namespace = "urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#";
                XMPSchema zugferdSchema = new XMPSchema(xmp, namespace, "fx", "Factur-X PDFA Extension Schema");
                zugferdSchema.setTextPropertyValue("ConformanceLevel", conformanceLevel != null ? conformanceLevel : "BASIC");
                zugferdSchema.setTextPropertyValue("DocumentFileName", xmlFilename);
                zugferdSchema.setTextPropertyValue("DocumentType", "INVOICE");
                zugferdSchema.setTextPropertyValue("Version", "1.0");
                xmp.addSchema(zugferdSchema);
            } catch (Exception e) {
                log.warn("Failed to add ZUGFeRD extension schema to XMP metadata", e);
            }
        }

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
