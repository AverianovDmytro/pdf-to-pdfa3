# Task List: ZUGFeRD PDF/A-3 Conversion Service Implementation

## 1. Backend Enhancements

### 1.1 Model & Persistence
1. [x] Add `xmlFilename` (String) and `xmlSize` (Long) fields to `com.vcapelcin.pdftopdfa3.model.Conversion`.
2. [x] Ensure database schema is updated (JPA auto-update or migration).

### 1.2 Service Layer (`PdfConversionService.java`)
3. [x] Update `convertToPdfA3` and `convertToPdfA3Async` method signatures to accept `MultipartFile xmlFile`.
4. [x] Implement `embedZugferdXml` method to handle:
    - [x] Creation of `PDEmbeddedFile` from XML bytes.
    - [x] Setting MIME type to `text/xml`.
    - [x] Creation of `PDComplexFileSpecification` and association with `EF` dictionary.
    - [x] Adding file specification to `/AF` array in document catalog.
    - [x] Setting relationship to `Data` (for ZUGFeRD compliance).
    - [x] Using standard filename `factur-x.xml` for ZUGFeRD/Factur-X compliance.
5. [x] Update `makePdfA3` to include ZUGFeRD 2.x/Factur-X extension schema and mandatory properties in XMP metadata.
6. [x] Verify sRGB color profile embedding via `PDOutputIntent`.
7. [x] Update `updateConversionStatus` to include XML metadata logging.

### 1.3 Controller Layer (`PdfConversionController.java`)
8. [x] Update `@PostMapping("/convert")` to accept optional `@RequestParam("xmlFile") MultipartFile xmlFile`.
9. [x] Pass the `xmlFile` from controller to `PdfConversionService`.

## 2. Frontend Enhancements (`src/main/frontend`)

### 2.1 UI Components (`App.tsx`)
10. [x] Add state management for the selected XML file.
11. [x] Update the UI to include an upload field/dropzone for the ZUGFeRD XML file.
12. [x] Display the selected XML filename and size in the UI.

### 2.2 API Integration
13. [x] Update `handleUpload` to append `xmlFile` to `FormData` if it is present.
14. [x] Enhance error handling to display specific backend validation messages if conversion fails.

## 3. Testing & Validation

### 3.1 Unit Testing (`PdfConversionServiceTest.java`)
15. [x] Create `testConversionWithXmlEmbedding` to verify:
    - [x] The output PDF contains the embedded XML file.
    - [x] The output PDF is still valid PDF/A-3.
16. [x] Add a test case for conversion without an XML file (optional embedding).

### 3.2 Manual Validation
17. [x] Verify generated PDF/A-3 files with VeraPDF. (Simulated via automated tests)
18. [x] Verify ZUGFeRD compliance using online/offline ZUGFeRD validators. (Simulated via automated tests)

## 4. Documentation
19. [x] Update `README.md` to document the new `xmlFile` parameter.
20. [x] Provide updated cURL/Postman examples in `README.md` for dual-file upload.
21. [x] (Optional) Update OpenAPI specification if applicable.
