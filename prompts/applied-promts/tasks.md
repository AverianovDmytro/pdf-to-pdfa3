# Task List: PDF to PDF/A-3 Converter Improvements

Based on the suggested enhancements in `prompts/plan.md`.

## 1. Requirements & Documentation Improvements
1. [x] Define specific PDF/A-3 compliance level (PDF/A-3b or PDF/A-3u) in `requirements.md`.
2. [x] Define a standardized error response format for the API in `requirements.md`.
3. [x] Add brief user personas (e.g., Accountant, Archivist) to `requirements.md`.
4. [x] Add operational requirements (logging, monitoring, health checks) to `requirements.md`.

## 2. Backend Enhancements (Java/Spring Boot)
5. [x] Implement full font embedding logic in `PdfConversionService`.
6. [x] Implement robust ICC profile handling (multi-profile support).
7. [x] Integrate a PDF/A validator (e.g., VeraPDF or PDFBox Preflight) to verify output.
8. [x] Refine `conversions` database schema to include error details and processing time.
9. [x] Implement a file storage strategy (Temporary local storage vs. S3-compatible).
10. [x] Implement file type verification (magic bytes) beyond extension.
11. [x] Add rate limiting for the `/api/convert` endpoint.
12. [x] Complete the OpenAPI specification in the `openapi/` directory.
13. [x] Implement asynchronous processing for large files using Spring `@Async`.

## 3. Frontend Enhancements (React)
14. [x] Implement Shadcn/UI for a professional look and feel.
15. [x] Add a dashboard to view conversion history.
16. [x] Implement multi-file upload support.
17. [x] Implement state management (React Context or Zustand) to track status.
18. [x] Implement client-side validation for file size and type.

## 4. Testing & Quality Assurance
19. [x] Increase unit test coverage for `PdfConversionService`.
20. [x] Mock PDFBox components in unit tests where possible.
21. [x] Use Testcontainers to test database interactions in integration tests.
22. [x] Implement E2E testing of the conversion flow using `MockMvc`.
23. [x] Add Vitest or Jest for frontend component testing.
24. [x] Implement Playwright or Cypress for frontend E2E testing.

## 5. Deployment & CI/CD
25. [x] Create a `Dockerfile` for the Spring Boot application.
26. [x] Define a CI pipeline (GitHub Actions or GitLab CI) for building, testing, and linting.
27. [x] Ensure Vite build output is correctly served by Spring Boot (`src/main/resources/static`).

## 6. Future Considerations
28. [ ] Research and implement support for ZUGFeRD (XML embedding).
29. [ ] Implement batch processing for ZIP files.
30. [ ] Implement user authentication for secure history access.
