# Project Improvement Plan: PDF to PDF/A-3 Conversion Service

This plan outlines strategic and technical improvements for the project based on the requirements defined in `prompts/requirements.md`.

## 1. Frontend Enhancements (UI/UX)
- [ ] **Pixel-Perfect Design Alignment**: Conduct a final review of `styles/design.png` and ensure all spacing, typography (fonts from `src/main/resources/fonts`), and color palettes are strictly applied using Tailwind CSS 4.0.
- [ ] **Advanced Error Visualization**: Instead of simple alerts, implement a toast system (using Radix Toast) to display detailed ZUGFeRD validation errors and backend failures.
- [ ] **Responsive Design**: Optimize the layout for mobile and tablet views, ensuring the drag-and-drop zone and previews remain usable.
- [ ] **Dark Mode Support**: Implement a consistent dark mode theme using Tailwind CSS.
- [ ] **Improved PDF/XML Previews**:
    - Add zoom and rotation controls to the `PDFPreview`.
    - Implement syntax highlighting and expandable/collapsible nodes for the `XMLPreview`.

## 2. Backend & API Improvements
- [ ] **ZUGFeRD XML Validation Service**: Implement a backend service to validate uploaded XML files against official XSD schemas (located in `src/main/resources/xsd`) before attempting conversion.
- [ ] **Enhanced Conversion Metadata**: Allow users to provide custom metadata (Author, Title, Subject) for the generated PDF/A-3 file.
- [ ] **Detailed Conversion Logs**: Improve backend logging to capture specific stages of the PDF/A-3 conversion process (e.g., color profile embedding, file attachment).
- [ ] **Async Processing**: For large PDF files, implement asynchronous conversion with a polling mechanism or WebSockets for status updates.

## 3. Developer Experience (DX) & CI/CD
- [ ] **Expand Test Coverage**:
    - **Frontend**: Add Vitest/Playwright tests for core user flows (upload, preview, convert).
    - **Backend**: Add integration tests that verify PDF/A-3 compliance using a library like VeraPDF or similar.
- [ ] **API Documentation**: Integrate Swagger/OpenAPI UI for interactive testing of the `/api/v1/convert` endpoint.
- [ ] **Standardized Linting/Formatting**: Enforce consistent code style across the project using Prettier and ESLint.
- [ ] **Automated PDF/A-3 Verification**: Integrate a PDF/A-3 validator into the CI pipeline to ensure no regressions in conversion quality.

## 4. Feature Roadmap
- [ ] **Batch Conversion**: Support for uploading and converting multiple PDF files in a single session.
- [ ] **User Accounts**: (Optional) Allow users to save their conversion history across sessions beyond `localStorage`.
- [ ] **Multiple ZUGFeRD Profiles**: Add support for different ZUGFeRD profiles (MINIMUM, BASIC, COMFORT, EXTENDED).
- [ ] **Language Support**: Internationalize the UI (i18n) to support German and English.
