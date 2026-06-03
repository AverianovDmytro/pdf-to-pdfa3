# Developer Guide: PDF to PDF/A-3 (ZUGFeRD) Conversion Service

This guide outlines the requirements and implementation steps for a service that creates ZUGFeRD-compliant invoices. The service transforms a standard PDF document into a PDF/A-3 format and embeds a required XML metadata file.

## Project Context
The application is a Spring Boot service with a React frontend. It uses Apache PDFBox for PDF manipulations and Preflight for PDF/A validation.

## Functional Requirements
- **Format**: Convert input PDF to PDF/A-3 (ISO 19005-3).
- **Compliance**: Fully support European standard EN 16931 (ZUGFeRD 2.0+).
- **Input**: Accept a PDF file and a corresponding ZUGFeRD XML file.
- **Output**: Return a single PDF/A-3 file with the XML file embedded as an attachment.

## Technical Implementation Steps

### 1. Update the API Endpoint
- Modify `PdfConversionController` to accept two parts in the multipart request:
  - `file`: The source PDF document.
  - `xmlFile`: The ZUGFeRD XML file to be embedded.
- Update Swagger/OpenAPI documentation to reflect these changes.

### 2. Enhance PDF Conversion Service
Extend `PdfConversionService.java` with the following logic:
- **Load Document**: Use `Loader.loadPDF()` to read the source PDF.
- **PDF/A-3 Conversion**: 
  - Set PDF/A-3 identification in XMP metadata (Part 3, Conformance Level B).
  - Embed necessary color profiles (e.g., sRGB).
  - Ensure all fonts are embedded.
- **XML Embedding**:
  - Add the XML file as an embedded file (Associated File) to the PDF.
  - Set the relationship to "Alternative" or "Data".
  - Specify the MIME type as `text/xml`.
- **Validation**: Use the Preflight library to verify that the resulting document adheres to PDF/A-3 standards.

### 3. Frontend Integration
- Update the React UI (`src/main/frontend`) to allow users to upload both the PDF and the XML file.
- Improve error handling to display validation failures from the backend.

### 4. Database Tracking
- Ensure the `Conversion` entity tracks the presence of the XML file.
- Log conversion time and success/failure status in the PostgreSQL database.

## Verification & Testing
- **Unit Tests**: Add tests in `PdfConversionServiceTest.java` to verify XML embedding.
- **Integration Tests**: Verify the REST endpoint with both PDF and XML inputs.
- **Compliance Check**: Use external tools (like VeraPDF) to manually verify the ZUGFeRD compliance of generated files during development.
