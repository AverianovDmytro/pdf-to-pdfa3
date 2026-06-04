# Implementation Plan: ZUGFeRD PDF/A-3 Conversion Service

This document outlines the detailed steps required to implement the ZUGFeRD-compliant PDF/A-3 conversion service, as specified in `prompts/requirements.md`.

## 1. Backend Enhancements

### 1.1 Model & Persistence
- **Task**: Update `Conversion` entity to track the XML file.
- **Action**: Add `xml_filename` and `xml_size` fields to `com.vcapelcin.pdf2zugferd.model.Conversion`.
- **Action**: Create a Flyway/Liquibase migration or let JPA update the schema (depending on environment).

### 1.2 Service Layer (`PdfConversionService.java`)
- **Task**: Implement XML embedding and PDF/A-3 metadata.
- **Action**: Modify `convertToPdfA3` to accept an optional `MultipartFile xmlFile`.
- **Action**: Implement `embedZugferdXml(PDDocument document, byte[] xmlBytes, String filename)`:
  - Create `PDEmbeddedFile` from XML bytes.
  - Set subtype to `text/xml`.
  - Create `PDComplexFileSpecification` and associate it with the document's `EF` (EmbeddedFiles) dictionary.
  - Add the file specification to the `/AF` (Associated Files) array in the document catalog (required for PDF/A-3).
  - Set the relationship to `Alternative` (specifically `Data` for ZUGFeRD).
- **Action**: Update `makePdfA3` to include ZUGFeRD extension schema in XMP metadata (if not already present).
- **Action**: Ensure color profile (sRGB) is correctly embedded as `PDOutputIntent`.

### 1.3 Controller Layer (`PdfConversionController.java`)
- **Task**: Update API to accept two files.
- **Action**: Update `@PostMapping("/convert")` to accept:
  - `@RequestParam("file") MultipartFile file`
  - `@RequestParam(value = "xmlFile", required = false) MultipartFile xmlFile`
- **Action**: Update logic to pass `xmlFile` to the service.

## 2. Frontend Enhancements (`src/main/frontend`)

### 2.1 UI Components (`App.tsx`)
- **Task**: Add XML file upload capability.
- **Action**: Add a second file input state for the XML file.
- **Action**: Update the dropzone/input to handle both PDF and XML files (or add a separate input for XML).
- **Action**: Display the selected XML filename and size.

### 2.2 API Integration
- **Task**: Update `handleUpload` to send both files.
- **Action**: Append `xmlFile` to `FormData` if selected.
- **Action**: Improve error messaging to handle backend validation errors.

## 3. Testing & Validation

### 3.1 Unit Testing (`PdfConversionServiceTest.java`)
- **Task**: Verify XML embedding.
- **Action**: Add `testConversionWithXmlEmbedding` test case.
- **Action**: Assert that the output PDF contains the embedded XML file.
- **Action**: Assert that the PDF remains PDF/A-3 compliant.

### 3.2 Manual Validation
- **Task**: Verify with external tools.
- **Action**: Test the output with [VeraPDF](https://verapdf.org/) for PDF/A-3 compliance.
- **Action**: Test the output with ZUGFeRD validators to ensure the XML is correctly associated.

## 4. Documentation
- **Task**: Update `README.md` and OpenAPI spec.
- **Action**: Document the new `xmlFile` parameter in the API section.
- **Action**: Provide a Postman/cURL example for the dual-file upload.
