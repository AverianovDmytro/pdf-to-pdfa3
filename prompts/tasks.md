# Task List: ZUGFeRD PDF/A-3 Conversion Service Implementation

## 1. Backend Enhancements

### 1.1 Model & Persistence
1. [ ] Add `xmlFilename` (String) and `xmlSize` (Long) fields to `com.vcapelcin.pdftopdfa3.model.Conversion`.
2. [ ] Ensure database schema is updated (JPA auto-update or migration).

### 1.2 Service Layer (`PdfConversionService.java`)
3. [ ] Update `convertToPdfA3` and `convertToPdfA3Async` method signatures to accept `MultipartFile xmlFile`.
4. [ ] Implement `embedZugferdXml` method to handle:
    - [ ] Creation of `PDEmbeddedFile` from XML bytes.
    - [ ] Setting MIME type to `text/xml`.
    - [ ] Creation of `PDComplexFileSpecification` and association with `EF` dictionary.
    - [ ] Adding file specification to `/AF` array in document catalog.
    - [ ] Setting relationship to `Data` (for ZUGFeRD compliance).
5. [ ] Update `makePdfA3` to include ZUGFeRD extension schema in XMP metadata.
6. [ ] Verify sRGB color profile embedding via `PDOutputIntent`.
7. [ ] Update `updateConversionStatus` to include XML metadata logging.

### 1.3 Controller Layer (`PdfConversionController.java`)
8. [ ] Update `@PostMapping("/convert")` to accept optional `@RequestParam("xmlFile") MultipartFile xmlFile`.
9. [ ] Pass the `xmlFile` from controller to `PdfConversionService`.

## 2. Frontend Enhancements (`src/main/frontend`)

### 2.1 UI Components (`App.tsx`)
10. [ ] Add state management for the selected XML file.
11. [ ] Update the UI to include an upload field/dropzone for the ZUGFeRD XML file.
12. [ ] Display the selected XML filename and size in the UI.

### 2.2 API Integration
13. [ ] Update `handleUpload` to append `xmlFile` to `FormData` if it is present.
14. [ ] Enhance error handling to display specific backend validation messages if conversion fails.

## 3. Testing & Validation

### 3.1 Unit Testing (`PdfConversionServiceTest.java`)
15. [ ] Create `testConversionWithXmlEmbedding` to verify:
    - [ ] The output PDF contains the embedded XML file.
    - [ ] The output PDF is still valid PDF/A-3.
16. [ ] Add a test case for conversion without an XML file (optional embedding).

### 3.2 Manual Validation
17. [ ] Verify generated PDF/A-3 files with VeraPDF.
18. [ ] Verify ZUGFeRD compliance using online/offline ZUGFeRD validators.

## 4. Documentation
19. [ ] Update `README.md` to document the new `xmlFile` parameter.
20. [ ] Provide updated cURL/Postman examples in `README.md` for dual-file upload.
21. [ ] (Optional) Update OpenAPI specification if applicable.
