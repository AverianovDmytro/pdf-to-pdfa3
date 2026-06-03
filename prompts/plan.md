# Project Improvement Plan: PDF to PDF/A-3 Conversion Tool

This plan outlines the steps required to complete the features identified in `prompts/requirements.md` and further enhance the application's robustness and user experience.

## Phase 1: Frontend Enhancements

### 1.1 Document Upload Improvements
- **File Validation:** Implement client-side validation in `FileUpload.tsx` and `App.tsx` to strictly enforce `.pdf` and `.xml` extensions.
- **File Metadata Display:** Update the upload zones to display file size and other relevant metadata once a file is selected.
- **Status Reset:** Add a "Reset" or "Clear" button to allow users to start over easily.

### 1.2 XML Data Preview
- **Data Extraction:** Implement logic to parse the uploaded ZUGFeRD XML file on the client side (or via a dedicated backend preview endpoint).
- **Structured Display:** Create a new component `XMLPreview` to display:
    - Invoice summary (Number, Date, Currency).
    - Supplier/Buyer details.
    - Line item table.
    - Totals and VAT breakdown.
- **Tabbed Interface:** Implement a toggle or tab system in the right column to switch between "PDF Preview" and "XML Data Preview".

## Phase 2: Backend & Security

### 2.1 Enhanced Validation
- **XSD Validation:** Ensure the backend strictly validates the ZUGFeRD XML against the official schemas.
- **Business Logic Checks:** Implement checks to ensure the data in the XML matches the context of the PDF (where possible).
- **Security Audit:** Review file upload handling for potential vulnerabilities (e.g., zip slips, large file DoS).

### 2.2 API Improvements
- **Preview Endpoint:** Consider adding a lightweight endpoint to return JSON representation of the ZUGFeRD XML for the frontend preview.
- **Error Reporting:** Refine the `ErrorResponse` structure to provide more granular feedback for XSD validation errors.

## Phase 3: UI/UX & Quality Assurance

### 3.1 Design Polish
- **Responsive Design:** Verify and fix any layout issues on smaller screens.
- **Accessibility:** Ensure all interactive elements (buttons, dropzones) are keyboard accessible and have proper ARIA labels.

### 3.2 Testing & Linting
- **Fix Build Errors:** Resolve any existing TypeScript or Tailwind CSS build issues.
- **Unit Testing:** Add Vitest/React Testing Library tests for the new `XMLPreview` and validation logic.
- **Linting:** Ensure all code passes `npm run lint` without warnings.

## Phase 4: Integration & Deployment

### 4.1 Deployment Readiness
- **Production Build:** Verify the `npm run build` output and its integration with Spring Boot's static resources.
- **Docker Verification:** Ensure the `docker-compose.yaml` correctly builds and serves the latest version of both frontend and backend.
