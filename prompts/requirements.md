# PDF to PDF/A-3 Conversion Tool - Developer Guide

This document outlines the requirements and implementation steps for the PDF to PDF/A-3 (ZUGFeRD) conversion service. The goal is to provide a robust, user-friendly interface for embedding structured XML invoice data into standard PDF documents.

## Project Overview
- **Backend:** Spring Boot (Java 21)
- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Key Functionality:** Convert standard PDF + ZUGFeRD XML into a compliant PDF/A-3 document.

---

## Actionable Implementation Steps

### 1. Document Upload & Management
- [x] **Source PDF Upload:** Implement a drag-and-drop zone for standard PDF documents.
- [x] **ZUGFeRD XML Upload:** Implement a dedicated upload zone for the corresponding ZUGFeRD XML file.
- [ ] **File Validation:** Ensure only `.pdf` and `.xml` files are accepted respectively.
- [ ] **File Size & Info:** Display file names and sizes after selection (e.g., `file-example.pdf 0.99 MB`).

### 2. Live Document Preview
- [x] **PDF Preview:** Render the uploaded PDF within the interface to allow users to verify the document before conversion.
- [ ] **XML Data Preview:** Implement a structured preview section for the uploaded ZUGFeRD XML. This should display:
    - **Invoice Details:** Number, Issue Date, Type Code, Currency.
    - **Party Information:** Supplier and Buyer names, addresses, and VAT IDs.
    - **References:** Purchase order and sales order references.
    - **Line Items:** Description, quantity, unit price, and VAT rate.
    - **Totals & VAT:** Document totals, discounts, VAT categories, and VAT breakdown.
    - **Payment Details:** Bank details and payment instructions.

### 3. Conversion Process
- [x] **Trigger Conversion:** A prominent button to initiate the "Step 3: Convert PDF to PDF/A-3" process.
- [x] **Progress Tracking:** Show a progress bar and status messages (e.g., "Uploading Files...", "Processing PDF/A-3...").
- [x] **Success Handling:** Upon successful conversion, automatically trigger the download of the new PDF/A-3 file (suffixed with `_a3.pdf`).

### 4. Error Handling & Validation
- [ ] **Validation Feedback:** If the XML is invalid or doesn't match the PDF, provide clear error messages.
- [x] **Error Table:** Implement a table or structured list to display specific validation errors (e.g., XSD validation failures or business logic mismatches).
- [ ] **Status Reset:** Allow users to clear selections and reset the state to "Idle" for a new conversion.

---

## Technical Guidelines

### Frontend Best Practices
- **Component Architecture:** Keep UI components modular (e.g., `FileUpload`, `PDFPreview`, `StatusDisplay`).
- **State Management:** Use React hooks (`useState`, `useCallback`) for managing file states and UI transitions.
- **Styling:** Use Tailwind CSS for consistent, responsive design. Follow the existing color palette (Slate, Primary, Accent).
- **Icons:** Use `lucide-react` or `@iconify/react` for visual cues.

### Building and Testing
- **Development:** Run `npm run dev` in `src/main/frontend`.
- **Production Build:** Use `npm run build` to generate optimized assets.
- **Linting:** Run `npm run lint` to ensure code quality.
- **Backend Integration:** The frontend communicates with the backend via `POST /api/v1/convert`. Ensure the `responseType` is set to `blob` for PDF downloads.

---

## UI Structure Outline
1. **Hero Section:** Title and brief service description.
2. **Upload Section (Left Column):**
    - Step 1: Source PDF Upload
    - Step 2: ZUGFeRD XML Upload
    - Action: Convert Button
    - Status: Success/Error messages and Error Table.
3. **Preview Section (Right Column):**
    - Toggle/Tab between PDF Preview and XML Data Preview.
4. **Footer:** Company branding and copyright info.
