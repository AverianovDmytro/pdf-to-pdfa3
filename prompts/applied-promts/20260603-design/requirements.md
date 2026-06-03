# PDF to PDF/A-3 (ZUGFeRD) Developer Guide

This document provides a comprehensive guide for developers working on the PDF to PDF/A-3 conversion project. It outlines the current state, technical requirements, and actionable steps for future improvements.

## 1. Project Overview

The application is a full-stack solution designed to convert standard PDF documents into ZUGFeRD-compliant PDF/A-3 files by embedding structured XML data.

- **Backend:** Spring Boot (Java 21) handling PDF manipulation via Apache PDFBox and XML validation.
- **Frontend:** React 19 with Vite, TypeScript, and Tailwind CSS.
- **Core Feature:** Validating PDF/XML pairs and generating a compliant archival document.

---

## 2. Functional Requirements

### Conversion Workflow
The user interface must guide the user through a 3-step process:
1. **Step 1: PDF Upload** - Upload the source PDF (Validation: must be a valid PDF).
2. **Step 2: XML Upload** - Upload the ZUGFeRD XML (Validation: must follow XSD schema).
3. **Step 3: Process & Download** - Trigger conversion, display a progress indicator, and provide the resulting PDF/A-3 for download.

### Validation & Error Handling
- **XSD Validation:** All uploaded XML files must be validated against the official ZUGFeRD schemas.
- **Error Reporting:** If validation fails, display a clear table or list of errors including:
    - Line/Column number.
    - Error description.
    - File source (PDF or XML).

---

## 3. UI/UX Transformation (Finance-Tech Style)

The goal is to move from the current basic UI to a professional "Finance-Tech" aesthetic based on the reference image `/styles/style_finance.png`.

### Design Guidelines
- **Theme:** "Professional, Secure, Minimalist".
- **Color Palette (extracted from reference):**
    - **Primary:** Deep Blue/Navy for trust.
    - **Accent:** Vibrant Green or Gold for "success" actions.
    - **Background:** Clean White/Light Gray with subtle gradients.
- **Typography:** Use modern sans-serif fonts like **Inter**, **Roboto**, or **Poppins**.
- **Icons:** 
    - Use [Solar Linear](https://iconify.design/icon-sets/solar/) for functional UI (Upload, Settings, Download).
    - Use [Simple Icons](https://iconify.design/icon-sets/simple-icons/) for technology logos (Size: 96x36px).

### UI Components
- **Dropzones:** Redesign to support drag-and-drop with clear visual "active" states.
- **PDF Preview:** Enhance the iframe-based preview to be responsive and integrated into the layout.
- **Status Feed:** A dedicated section for validation results and conversion status.

---

## 4. Technical Stack & Standards

- **Frontend:** React 19, Vite, Tailwind CSS (v3.4+), Axios.
- **Icons:** `@iconify/react` (Solar & Simple Icons sets).
- **Backend:** Spring Boot 3.x, Apache PDFBox, Preflight (for PDF/A validation).
- **Code Quality:** 
    - ESLint for frontend consistency.
    - Maven Checkstyle/Lombok for backend.

---

## 5. Actionable Implementation Steps

### Phase 1: Infrastructure & Cleanup
- [ ] **Verify Environment:** Ensure Node.js >= 22.16.0 and JDK 21 are used.
- [ ] **Clean App.tsx:** Refactor current `App.tsx` into smaller, reusable components (e.g., `FileUpload`, `ValidationStatus`, `PreviewSection`).

### Phase 2: Design Implementation
- [ ] **Style Overhaul:** Implement Tailwind configuration for the new color palette and typography.
- [ ] **Hero Section:** Build the "Pixel-Hero" landing section as per `/styles/style_finance.png`.
- [ ] **Component Styling:** Apply Radix UI or Shadcn UI primitives for accessible and consistent interactive elements.

### Phase 3: Validation Features
- [ ] **Enhanced XML Feedback:** Update the frontend to display the `xmlErrors` array in a formatted table instead of a simple list.
- [ ] **Real-time Validation:** (Optional) Add client-side basic validation before sending to the backend.

### Phase 4: Build & Deployment
- [ ] **Production Build:** Run `npm run build` in `src/main/frontend` and verify files are output to `src/main/resources/static`.
- [ ] **Backend Integration:** Verify Spring Boot serves the built frontend on `http://localhost:8084`.
- [ ] **Final Test:** Perform a full end-to-end conversion with `file-example_PDF_1MB.pdf` and `ZugFerd_Gutschrift.xml`.

---

## 6. Development Commands

| Task | Command |
| :--- | :--- |
| **Start Frontend (Dev)** | `cd src/main/frontend && npm run dev` |
| **Build Frontend** | `cd src/main/frontend && npm run build` |
| **Run Backend** | `./mvnw spring-boot:run` |
| **Linting** | `cd src/main/frontend && npm run lint` |
