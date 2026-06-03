# Project Improvement Plan: PDF to PDF/A-3 (ZUGFeRD)

This plan outlines the detailed steps required to modernize the PDF to PDF/A-3 conversion service, focusing on a UI/UX overhaul and enhanced validation reporting.

## Phase 1: Infrastructure, Cleanup & Refactoring
**Goal:** Prepare the codebase for styling changes and improve maintainability.

1. **Environment Verification**
   - [ ] Verify Node.js version (>= 22.16.0) and NPM version (>= 11.4.0).
   - [ ] Verify Java version (21).
   - [ ] Run `npm install` in `src/main/frontend` to ensure all dependencies are resolved.

2. **Frontend Architecture Refactoring**
   - [ ] Extract `FileUpload` component from `App.tsx` (handle both PDF and XML drops).
   - [ ] Extract `PDFPreview` component.
   - [ ] Extract `StatusDisplay` component for messages and error tables.
   - [ ] Create a `layout` folder for global UI wrappers (Hero section, Footer).

3. **Dependency Updates**
   - [ ] Add `@iconify/react` for the new icon sets (Solar & Simple Icons).
   - [ ] (Optional) Install `@radix-ui/react-*` primitives if specific accessibility features are needed.

## Phase 2: Design & UI Implementation ("Finance-Tech" Style)
**Goal:** Implement the visual identity based on `/styles/style_finance.png`.

1. **Tailwind Configuration**
   - [ ] Update `tailwind.config.js` with the custom color palette (Deep Blue/Navy, Accent Green/Gold).
   - [ ] Configure standard border-radius and shadow utilities for the "layered" look.
   - [ ] Setup font families (Inter/Roboto/Poppins).

2. **Hero Section Development**
   - [ ] Build the "Pixel-Hero" landing area.
   - [ ] Integrate professional placeholder images from Unsplash.
   - [ ] Add branding logos using Iconify (Simple Icons).

3. **Interactive Components**
   - [ ] Redesign `FileUpload` zones with better drag-and-drop animations and clear "Active" states.
   - [ ] Implement the `StatusDisplay` with a clean, professional aesthetic.
   - [ ] Ensure the PDF iframe preview is responsive and visually consistent.

## Phase 3: Functional Enhancements (Validation & Feedback)
**Goal:** Improve user feedback during the conversion process.

1. **Enhanced XML Error Reporting**
   - [ ] Modify `StatusDisplay` to render a detailed table for `xmlErrors`.
   - [ ] Table columns: File, Line, Column, Description, Severity.

2. **Progress & State Management**
   - [ ] Refine the upload progress bar.
   - [ ] Add a "Processing" state to the UI to handle the lag between upload completion and conversion finalization.

3. **Backend Integration Checks**
   - [ ] Ensure the backend's `ErrorResponse` properly maps to the frontend's expected error structure.

## Phase 4: Integration, Testing & Deployment
**Goal:** Ensure the system is robust and correctly deployed.

1. **End-to-End Testing**
   - [ ] Test with `file-example_PDF_1MB.pdf` and `ZugFerd_Gutschrift.xml`.
   - [ ] Verify the downloaded file is a valid PDF/A-3.

2. **Production Build & Verification**
   - [ ] Run `npm run build` and ensure the `dist` folder is correctly routed to `src/main/resources/static`.
   - [ ] Verify Spring Boot serves the index.html on port 8084.

3. **Final Polish**
   - [ ] Run `npm run lint` and fix all warnings/errors.
   - [ ] Perform a final responsive check on common screen sizes.
