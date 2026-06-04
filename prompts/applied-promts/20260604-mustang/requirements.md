# Developer Guide: Transitioning to Mustangproject for ZUGFeRD/Factur-X

This guide outlines the steps to replace the current Apache PDFBox implementation with **Mustangproject** for converting PDFs to PDF/A-3 and embedding ZUGFeRD/Factur-X XML data.

## Overview

[Mustangproject](https://www.mustangproject.org/) is an open-source Java library (Apache License 2.0) specifically designed for e-invoicing. It automates:
- **XML Embedding:** Adding `factur-x.xml` to PDF/A-3.
- **PDF/A-3 Conversion:** Ensuring compliance and XMP metadata correctness.
- **Validation:** Built-in validation for ZUGFeRD/Factur-X standards.

## Actionable Steps

### 1. Update Project Dependencies
Replace the existing PDFBox dependencies in your `pom.xml` with the Mustangproject library.

**Old (Remove):**
```xml
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>${pdfbox.version}</version>
</dependency>
<!-- And other pdfbox-related dependencies -->
```

**New (Add):**
```xml
<dependency>
    <groupId>org.mustangproject</groupId>
    <artifactId>library</artifactId>
    <version>2.23.1</version>
</dependency>
```

### 2. Refactor PdfConversionService
The current implementation in `PdfConversionService.java` manually handles font embedding, metadata creation, and file attachment using PDFBox. Mustangproject simplifies this into a few lines of code.

#### Implementation Pattern:
```java
import org.mustangproject.ZUGFeRD.ZUGFeRDExporter;
import org.mustangproject.ZUGFeRD.Profiles;

// ... inside your service method ...

try (InputStream pdfSource = file.getInputStream();
     ByteArrayOutputStream out = new ByteArrayOutputStream()) {
    
    ZUGFeRDExporter exporter = new ZUGFeRDExporter();
    
    // Configure conformance level (e.g., BASIC, COMFORT, EXTENDED)
    exporter.setProfile(Profiles.getByName(zugferdConformanceLevel));
    
    // Load source PDF and embed XML
    exporter.load(pdfSource);
    exporter.setXML(xmlFile.getBytes());
    
    // Export to PDF/A-3
    exporter.export(out);
    return out.toByteArray();
}
```

### 3. Simplify XML Validation
Mustangproject includes a validator that can be used to ensure the resulting PDF/A-3 file and its embedded XML meet the required standards.

```java
import org.mustangproject.ZUGFeRD.ZUGFeRDValidator;

public void validatePdfA3(byte[] pdfBytes) {
    ZUGFeRDValidator validator = new ZUGFeRDValidator();
    String report = validator.validate(pdfBytes);
    if (!validator.isValid()) {
        log.warn("Validation failed: {}", report);
    }
}
```

### 4. Remove Legacy PDFBox Logic
Once the transition is complete, remove the following utility methods from `PdfConversionService.java` as they are now handled internally by Mustangproject:
- `embedFonts(PDDocument document)`
- `embedZugferdXml(...)`
- `makePdfA3(...)`

### 5. Update Tests
Update `PdfConversionServiceTest.java` to verify the new implementation. Since Mustangproject handles the complexity, focus tests on:
- Successful conversion of various PDF versions.
- Correctness of the returned byte array (non-empty, valid PDF header).
- Handling of invalid XML inputs.

## Why This Improvement Matters
- **Compliance:** Mustangproject is maintained to follow the latest ZUGFeRD/Factur-X specifications (EN 16931).
- **Maintainability:** Reduces hundreds of lines of low-level PDFBox code to a high-level API.
- **Reliability:** Passes strict external validators (like the Munich Enterprise validator) out of the box.
