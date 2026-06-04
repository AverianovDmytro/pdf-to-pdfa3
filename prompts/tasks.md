# Task List: PDF to PDF/A-3 (ZUGFeRD) Enhancements

This task list tracks the progress of improvements for the PDF to PDF/A-3 converter, following the implementation plan.

## Phase 1: Backend Compliance & Robustness

### 1.1 PDF/A-3 & XMP Metadata Enhancement
- [x] 1. Update `PdfConversionService` to include a full XMP Extension Schema for ZUGFeRD (Factur-X).
- [x] 2. Ensure the `/AFRelationship` is correctly set to `/Source` for the embedded XML in the PDF structure.
- [x] 3. Explicitly embed a Color Profile (e.g., sRGB IEC61966-2.1) to meet PDF/A requirements.
- [x] 4. Integrate `VeraPDF` (or a similar validation library) into the test suite for automated compliance checking.

### 1.2 Enhanced XML Validation
- [x] 5. Extend `XmlValidationService` to support multiple ZUGFeRD profiles (MINIMUM, BASIC, EN 16931, EXTENDED).
- [x] 6. Implement a custom `ErrorHandler` to capture line and column numbers for all XSD validation events.
- [x] 7. Add Schematron validation for deeper business rule checks beyond XSD (where applicable).

### 1.3 Error Handling & API Resilience
- [x] 8. Standardize the error response format across the API.
- [x] 9. Implement a custom exception handler to catch PDFBox or JAXP errors and return meaningful JSON instead of stack traces.
- [x] 10. Refine the Base64 encoding of validation errors in headers to ensure reliability for large error sets.

## Phase 2: Frontend UI/UX Refinement

### 2.1 Modernized Dashboard
- [x] 11. Implement a "Glassmorphism" effect for the main container using Tailwind's `backdrop-blur`.
- [x] 12. Enhance the `Hero` section with animated SVG icons from the Solar Icon set.
- [x] 13. Add a "Recent Conversions" list (stored in local storage) for quick access to previously processed files.

### 2.2 Advanced XML Visualization
- [x] 14. Create a dedicated `ZUGFeRDDataViewer` component for structured data presentation.
- [x] 15. Implement syntax highlighting for the XML preview (using `prismjs` or a lightweight alternative).
- [x] 16. Build a "Summary Card" that extracts and displays key invoice data (ID, Date, Total, Currency, Vendor).

### 2.3 Interactive Validation Feedback
- [x] 17. Make validation errors in `StatusDisplay` "clickable" to highlight the corresponding line in the XML preview.
- [x] 18. Add color-coded badges for error severity (e.g., Red for Errors, Amber for Warnings).

## Phase 3: Infrastructure & Quality Assurance

### 3.1 Frontend Build Optimization
- [x] 19. Fine-tune Vite's build options for better code splitting and chunking.
- [x] 20. Verify that all assets (fonts, icons) are correctly processed and served by the Spring Boot backend.
- [x] 21. Ensure Tailwind 4's JIT compiler is correctly picking up all dynamic classes.

### 3.2 Automated Testing & CI
- [x] 22. Add comprehensive unit tests for the `zugferdParser` utility.
- [x] 23. Implement an integration test for the full "Upload -> Convert -> Download" lifecycle.
- [x] 24. Set up a sample suite of valid/invalid PDF and XML files in `src/test/resources` for regression testing.
