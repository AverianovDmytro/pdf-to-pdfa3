# Implementation Plan: Transition to Mustangproject

This plan details the steps required to transition the PDF to PDF/A-3 conversion service from Apache PDFBox to Mustangproject, as specified in `prompts/requirements.md`.

## Phase 1: Dependency Management
1.  [ ] **Update `pom.xml`**:
    *   Remove `pdfbox`, `xmpbox`, and `preflight` dependencies.
    *   Add `org.mustangproject:library:2.23.1`.
    *   Verify Maven dependencies resolve correctly.

## Phase 2: Service Refactoring
1.  [ ] **Modify `PdfConversionService.java`**:
    *   Update imports to use Mustangproject (`org.mustangproject.ZUGFeRD.*`).
    *   Rewrite `convertToPdfA3` to use `ZUGFeRDExporter`.
    *   Simplify or replace `validatePdfA3` with `ZUGFeRDValidator`.
    *   Remove manual metadata and font embedding logic (`embedFonts`, `embedZugferdXml`, `makePdfA3`).
    *   Retain conversion tracking (database persistence) and input validation (`isPdfFile`).

## Phase 3: Test Suite Updates
1.  [ ] **Update `PdfConversionServiceTest.java`**:
    *   Ensure tests still pass with the new implementation.
    *   Remove PDFBox-specific test logic if any (e.g., manual document creation using `PDDocument` if it conflicts with library versions, though it might still be useful for generating test input).
    *   Add a test case to verify that the generated PDF contains the ZUGFeRD metadata (using Mustangproject's validator or another tool).

## Phase 4: Verification & Cleanup
1.  [ ] **Build and Run**:
    *   Execute `./mvnw clean install` to ensure the project builds without errors.
    *   Run unit tests to ensure no regressions in conversion tracking.
2.  [ ] **Manual Verification**:
    *   Test the `/api/v1/convert` endpoint with a sample PDF and XML.
    *   Verify the output PDF/A-3 file with an external validator if possible.

## Success Criteria
*   All PDFBox-related code is removed from `PdfConversionService.java`.
*   PDF/A-3 conversion is handled by Mustangproject.
*   ZUGFeRD/Factur-X XML is correctly embedded.
*   The application builds and all tests pass.
*   Conversion metadata is still correctly recorded in the database.
