# Project Improvement Plan: PDF to PDF/A-3 Converter

This plan outlines the steps required to evolve the current "PDF to PDF/A-3 Converter" from a basic prototype into a production-ready application.

## 1. Requirements & Documentation Improvements
- **Clarify Compliance:** Define specific PDF/A-3b (Basic) or PDF/A-3u (Unicode) requirements.
- **Error Handling:** Define a standardized error response format for the API.
- **User Personas:** Add brief personas (e.g., Accountant, Archivist) to guide UI/UX.
- **Operational Requirements:** Add logging, monitoring, and health check requirements (Actuator is already in `pom.xml`).

## 2. Backend Enhancements (Java/Spring Boot)
- **Robust PDF/A-3 Conversion:**
    - Implement full font embedding logic.
    - Ensure ICC profile handling is robust (don't just check for `/sRGB.icc`).
    - Integrate a PDF/A validator (e.g., VeraPDF or PDFBox Preflight) to verify output.
- **Database & Persistence:**
    - Refine the `conversions` table schema to include error details and processing time.
    - Implement a file storage strategy (Temporary local storage vs. S3-compatible).
- **Security:**
    - Implement file type verification (beyond extension).
    - Add rate limiting for the `/api/convert` endpoint.
- **API Improvements:**
    - Complete the OpenAPI specification in the `openapi/` directory.
    - Implement asynchronous processing for large files (using Spring `@Async`).

## 3. Frontend Enhancements (React)
- **UI/UX Refinement:**
    - Implement Shadcn/UI or a similar component library for professional look and feel.
    - Add a dashboard to view conversion history (if persistence is fully implemented).
    - Implement multi-file upload support.
- **State Management:**
    - Use a light state management solution (e.g., React Context or Zustand) to track upload/conversion status.
- **Client-side Validation:**
    - Check file size and type before uploading.

## 4. Testing & Quality Assurance
- **Unit Testing:**
    - Increase coverage for `PdfConversionService`.
    - Mock PDFBox components where possible.
- **Integration Testing:**
    - Use Testcontainers to test database interactions.
    - End-to-end testing of the conversion flow using `MockMvc`.
- **Frontend Testing:**
    - Add Vitest or Jest for component testing.
    - Implement Playwright or Cypress for E2E testing.

## 5. Deployment & CI/CD
- **Dockerization:** Create a `Dockerfile` for the Spring Boot application.
- **CI Pipeline:** Define a GitHub Actions or GitLab CI pipeline for building, testing, and linting both backend and frontend.
- **Frontend Integration:** Ensure Vite build output is correctly served by Spring Boot (`src/main/resources/static`).

## 6. Future Considerations
- **Support for ZUGFeRD:** Specific support for embedding XML invoices in the PDF/A-3.
- **Batch Processing:** Ability to upload ZIP files for batch conversion.
- **User Authentication:** Secure access to personal conversion history.
