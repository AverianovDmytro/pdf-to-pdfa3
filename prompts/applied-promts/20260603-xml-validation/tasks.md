# Project Improvement Tasks

This task list is derived from the [Project Improvement Plan](plan.md).

## 1. Backend Enhancements (Spring Boot)

### 1.1. Advanced XML Validation
- [x] Integrate an XSD validation library (e.g., standard `javax.xml.validation`).
- [x] Add ZUGFeRD 2.x (Factur-X) XSD schemas to `src/main/resources`.
- [x] Implement `XmlValidationService` to validate the `xmlFile` multipart parameter.
- [x] Update `PdfConversionController` to return 400 Bad Request with specific XML validation errors.

### 1.2. Improved Font Embedding
- [x] Implement a mechanism to locate and load system fonts or bundled fonts.
- [x] Update `PdfConversionService.embedFonts()` to actually embed missing fonts using `PDType0Font.load()`.
- [x] Add a configuration property for a "Font Directory" to allow customization in different environments.

### 1.3. Robust Metadata Handling
- [x] Refine `makePdfA3()` to support multiple ZUGFeRD profiles (MINIMUM, BASIC, COMFORT, EXTENDED).
- [x] Ensure the `DocumentFileName` in XMP matches the actual filename of the embedded XML.

## 2. Frontend Enhancements (React)

### 2.1. UI/UX Improvements
- [x] Replace basic file inputs with a more robust Drag-and-Drop component (e.g., `react-dropzone`).
- [x] Implement a progress bar for large file uploads.
- [x] Add a "Preview" feature for the uploaded PDF (if possible via an iframe or library like `react-pdf`).

### 2.2. Error Detail Visualization
- [x] Update the error alert in `App.tsx` to handle structured error objects from the backend.
- [x] If XML validation fails, display a list of specific schema errors (line number, description).

## 3. DevOps & Quality Assurance

### 3.1. Automated Compliance Testing
- [x] Add an integration test that uses an external tool (like `veraPDF` via a library or CLI) to verify the compliance of the generated files.
- [x] Create a suite of "Reference Files" (valid PDF/XML pairs) for regression testing.

### 3.2. Performance Benchmarking
- [x] Create a JMeter or Gatling script to test the service under load.
- [x] Monitor memory usage during conversion of very large (100MB+) PDF files.

## 4. Documentation

### 4.1. API Specification
- [x] Update the files in `openapi/` to reflect new validation error structures.
- [x] Ensure Swagger UI is accessible and functional in the dev profile.
