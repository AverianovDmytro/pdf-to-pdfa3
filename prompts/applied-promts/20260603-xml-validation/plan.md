# Project Improvement Plan

Based on the analysis of `prompts/requirements.md` and the current state of the "PDF to PDF/A-3 Conversion Service", the following improvements are planned. This plan is divided into technical modules.

## 1. Backend Enhancements (Spring Boot)

### 1.1. Advanced XML Validation
- **Objective**: Ensure incoming ZUGFeRD XML files comply with EN 16931 before embedding.
- **Tasks**:
  - Integrate an XSD validation library (e.g., standard `javax.xml.validation`).
  - Add ZUGFeRD 2.x (Factur-X) XSD schemas to `src/main/resources`.
  - Implement `XmlValidationService` to validate the `xmlFile` multipart parameter.
  - Update `PdfConversionController` to return 400 Bad Request with specific XML validation errors.

### 1.2. Improved Font Embedding
- **Objective**: Automate font embedding to ensure full PDF/A-3 compliance.
- **Tasks**:
  - Implement a mechanism to locate and load system fonts or bundled fonts.
  - Update `PdfConversionService.embedFonts()` to actually embed missing fonts using `PDType0Font.load()`.
  - Add a configuration property for a "Font Directory" to allow customization in different environments.

### 1.3. Robust Metadata Handling
- **Objective**: Ensure all mandatory ZUGFeRD metadata is correctly set in XMP.
- **Tasks**:
  - Refine `makePdfA3()` to support multiple ZUGFeRD profiles (MINIMUM, BASIC, COMFORT, EXTENDED).
  - Ensure the `DocumentFileName` in XMP matches the actual filename of the embedded XML.

## 2. Frontend Enhancements (React)

### 2.1. UI/UX Improvements
- **Objective**: Provide a better user experience for file uploads and status tracking.
- **Tasks**:
  - Replace basic file inputs with a more robust Drag-and-Drop component (e.g., `react-dropzone`).
  - Implement a progress bar for large file uploads.
  - Add a "Preview" feature for the uploaded PDF (if possible via an iframe or library like `react-pdf`).

### 2.2. Error Detail Visualization
- **Objective**: Help users fix invalid files by showing detailed validation errors.
- **Tasks**:
  - Update the error alert in `App.tsx` to handle structured error objects from the backend.
  - If XML validation fails, display a list of specific schema errors (line number, description).

## 3. DevOps & Quality Assurance

### 3.1. Automated Compliance Testing
- **Objective**: Verify that the output of the service is always valid PDF/A-3.
- **Tasks**:
  - Add an integration test that uses an external tool (like `veraPDF` via a library or CLI) to verify the compliance of the generated files.
  - Create a suite of "Reference Files" (valid PDF/XML pairs) for regression testing.

### 3.2. Performance Benchmarking
- **Objective**: Identify bottlenecks in the conversion process.
- **Tasks**:
  - Create a JMeter or Gatling script to test the service under load.
  - Monitor memory usage during conversion of very large (100MB+) PDF files.

## 4. Documentation

### 4.1. API Specification
- **Objective**: Keep the OpenAPI documentation up-to-date.
- **Tasks**:
  - Update the files in `openapi/` to reflect new validation error structures.
  - Ensure Swagger UI is accessible and functional in the dev profile.
