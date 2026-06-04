# Task List: Transition to Mustangproject

Detailed task list for migrating from Apache PDFBox to Mustangproject based on `prompts/plan.md`.

## Phase 1: Dependency Management
1. [x] Remove `pdfbox` dependency from `pom.xml`
2. [x] Remove `xmpbox` dependency from `pom.xml`
3. [x] Remove `preflight` dependency from `pom.xml`
4. [x] Add `org.mustangproject:library:2.23.1` dependency to `pom.xml`
5. [x] Run `./mvnw dependency:resolve` to verify Maven dependencies

## Phase 2: Service Refactoring
6. [x] Update imports in `PdfConversionService.java` to use `org.mustangproject.ZUGFeRD.*`
7. [x] Refactor `convertToPdfA3` method to use `ZUGFeRDExporter`
8. [x] Replace manual metadata creation with `ZUGFeRDExporter` logic
9. [x] Implement `ZUGFeRDValidator` in `validatePdfA3` or replace current validation
10. [x] Remove `embedFonts` method from `PdfConversionService.java`
11. [x] Remove `embedZugferdXml` method from `PdfConversionService.java`
12. [x] Remove `makePdfA3` method from `PdfConversionService.java`
13. [x] Verify conversion tracking (database persistence) still functions correctly
14. [x] Ensure `isPdfFile` validation remains active

## Phase 3: Test Suite Updates
15. [x] Update `PdfConversionServiceTest.java` imports
16. [x] Adjust test cases that rely on `PDDocument` for input generation if necessary
17. [x] Verify existing tests for conversion persistence and failure handling pass
18. [x] Add a test case to verify ZUGFeRD metadata in the output using `ZUGFeRDValidator`
19. [x] Fix any compilation errors in tests caused by removing PDFBox

## Phase 4: Verification & Cleanup
20. [x] Execute `./mvnw clean install` and ensure build success
21. [x] Run all unit tests using `./mvnw test`
22. [x] Manually test the `/api/v1/convert` endpoint via Postman or cURL
23. [x] Validate a generated PDF/A-3 file with an external validator
24. [x] Final review of `PdfConversionService.java` for any remaining PDFBox references
