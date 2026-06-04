# Implementation Plan: PDF to PDF/A-3 (ZUGFeRD) Improvements

This plan outlines the technical steps to enhance the PDF to PDF/A-3 converter, focusing on compliance, robustness, and user experience, based on the `requirements.md` developer guide.

## Phase 1: Backend Compliance & Robustness
### 1.1 PDF/A-3 & XMP Metadata Enhancement
- **Objective**: Ensure 100% compliance with ISO 19005-3.
- **Actions**:
    - Update `PdfConversionService` to include a full XMP Extension Schema for ZUGFeRD (Factur-X).
    - Ensure the `/AFRelationship` is correctly set to `/Data` for the embedded XML.
    - Explicitly embed a Color Profile (e.g., sRGB IEC61966-2.1) to meet PDF/A requirements.
    - Add a `VeraPDF` integration (or similar validation library) to the test suite for automated compliance checking.

### 1.2 Enhanced XML Validation
- **Objective**: Provide granular feedback on XML structure and business rules.
- **Actions**:
    - Extend `XmlValidationService` to support multiple ZUGFeRD profiles (MINIMUM, BASIC, EN 16931, EXTENDED).
    - Implement a custom `ErrorHandler` to capture line and column numbers for all XSD validation events.
    - Add Schematron validation (if applicable) for deeper business rule checks beyond XSD.

### 1.3 Error Handling & API Resilience
- **Objective**: Improve communication between backend and frontend.
- **Actions**:
    - Standardize the error response format.
    - Implement a custom exception handler to catch PDFBox or JAXP errors and return meaningful JSON instead of stack traces.
    - Refine the Base64 encoding of validation errors in headers to ensure no data loss for large error sets.

## Phase 2: Frontend UI/UX Refinement
### 2.1 Modernized Dashboard (e-rechnungs-checker.de inspired)
- **Objective**: A professional, clean, and interactive interface.
- **Actions**:
    - Implement a "Glassmorphism" effect for the main container using Tailwind's `backdrop-blur`.
    - Enhance the `Hero` section with animated SVG icons from the Solar Icon set.
    - Add a "Recent Conversions" list (local storage based) for quick access to previously processed files.

### 2.2 Advanced XML Visualization
- **Objective**: Make the embedded data readable and actionable.
- **Actions**:
    - Create a dedicated `ZUGFeRDDataViewer` component.
    - Implement syntax highlighting for the XML preview (using a library like `prismjs` or a lightweight custom implementation).
    - Build a "Summary Card" that extracts and displays key invoice data (Invoice ID, Date, Total Amount, Currency, Vendor Name).

### 2.3 Interactive Validation Feedback
- **Objective**: Help users fix their XML files.
- **Actions**:
    - In `StatusDisplay`, make validation errors "clickable" to highlight the corresponding line in the XML preview.
    - Use color-coded badges for error severity (Error vs. Warning).

## Phase 3: Infrastructure & Quality Assurance
### 3.1 Frontend Build Optimization
- **Objective**: Ensure a fast and reliable production build.
- **Actions**:
    - Fine-tune Vite's build options for better chunking.
    - Ensure all assets (fonts, icons) are correctly processed and served by Spring Boot.
    - Verify that Tailwind 4's JIT compiler is correctly picking up all dynamic classes.

### 3.2 Automated Testing & CI
- **Objective**: Prevent regressions.
- **Actions**:
    - Add unit tests for the `zugferdParser` utility.
    - Implement an integration test that performs a full "Upload -> Convert -> Download" cycle.
    - Set up a sample suite of valid/invalid PDF and XML files in `src/test/resources` for continuous testing.

## Success Metrics
1. **Compliance**: Generated files pass the VeraPDF "PDF/A-3b" profile validation.
2. **Performance**: Conversion of a standard 1-page PDF takes < 1.5 seconds.
3. **Usability**: Zero UI-related console errors and 100% test pass rate in both frontend and backend.
