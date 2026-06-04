# Task List: PDF to PDF/A-3 Conversion Service Improvements

This task list is derived from the `prompts/plan.md` and tracks the progress of project enhancements.

## 1. Frontend Enhancements (UI/UX)
1. [x] **Pixel-Perfect Design Alignment**:
    - [x] Review `styles/design.png` and `styles/zugferd_converter_ui.html`.
    - [x] Apply exact spacing, typography, and color palettes in Tailwind CSS 4.0.
    - [x] Ensure fonts from `src/main/resources/fonts` are correctly loaded and used.
2. [x] **Advanced Error Visualization**:
    - [x] Integrate `@radix-ui/react-toast`.
    - [x] Implement a toast system for ZUGFeRD validation errors.
    - [x] Implement a toast system for backend API errors.
3. [x] **Responsive Design**:
    - [x] Audit layout on mobile (375px) and tablet (768px) breakpoints.
    - [x] Optimize FileUpload drag-and-drop zone for touch devices.
    - [x] Adjust PDF and XML preview layouts for smaller screens.
4. [x] **Dark Mode Support**:
    - [x] Define dark mode color palette in Tailwind configuration.
    - [x] Implement theme toggle or system preference detection.
    - [x] Ensure all components (Radix, custom) transition smoothly to dark mode.
5. [x] **Improved PDF/XML Previews**:
    - [x] Add zoom-in, zoom-out, and rotation controls to `PDFPreview.tsx`.
    - [x] Add syntax highlighting to `XMLPreview.tsx`.
    - [x] Implement expandable/collapsible nodes for the XML tree view.

## 2. Backend & API Improvements
6. [x] **ZUGFeRD XML Validation Service**:
    - [x] Create a validation service using XSD schemas from `src/main/resources/xsd`.
    - [x] Integrate validation into the `POST /api/v1/convert` flow.
    - [x] Return detailed XSD validation errors to the frontend.
7. [-] **Enhanced Conversion Metadata**:
    - [x] Update API to accept optional metadata (Author, Title, Subject).
    - [ ] Modify PDF/A-3 conversion logic to embed this metadata. (Mustangproject limitation)
    - [ ] Add frontend fields to allow users to input metadata.
8. [x] **Detailed Conversion Logs**:
    - [x] Implement SLF4J logging for each conversion step.
    - [x] Log specific events: file receipt, XML validation, color profile embedding, file attachment.
9. [ ] **Async Processing**:
    - [ ] Implement an asynchronous job queue for conversions.
    - [ ] Create a polling endpoint `GET /api/v1/status/{jobId}`.
    - [ ] (Optional) Integrate WebSockets for real-time status updates.

## 3. Developer Experience (DX) & CI/CD
10. [ ] **Expand Test Coverage**:
    - [ ] Set up Vitest for frontend unit/integration testing.
    - [ ] Write Playwright tests for the main upload -> convert -> download flow.
    - [ ] Add backend integration tests using VeraPDF for PDF/A-3 compliance verification.
11. [x] **API Documentation**:
    - [x] Add SpringDoc OpenAPI (Swagger UI) dependency.
    - [x] Annotate controllers for better documentation.
    - [x] Ensure Swagger UI is accessible at `/swagger-ui.html`.
12. [x] **Standardized Linting/Formatting**:
    - [x] Configure Prettier and synchronize with ESLint.
    - [x] Add a pre-commit hook (e.g., using husky and lint-staged) to enforce style.
13. [ ] **Automated PDF/A-3 Verification**:
    - [ ] Add a CI step in GitHub Actions/GitLab CI to run VeraPDF validation on sample outputs.

## 4. Feature Roadmap
14. [ ] **Batch Conversion**:
    - [ ] Update UI to support multiple file selection.
    - [ ] Implement backend logic to process and zip multiple converted PDFs.
15. [ ] **User Accounts**:
    - [ ] Design a simple database schema for users and conversion history.
    - [ ] Implement basic authentication (e.g., Spring Security).
    - [ ] Create a "My Conversions" dashboard.
16. [ ] **Multiple ZUGFeRD Profiles**:
    - [ ] Update XML parser and validator to support MINIMUM, BASIC, COMFORT, and EXTENDED profiles.
    - [ ] Add a profile selector in the UI.
17. [x] **Language Support (i18n)**:
    - [x] Integrate `react-i18next`.
    - [x] Create translation files for English (`en.json`) and German (`de.json`).
    - [x] Add a language switcher to the header.
