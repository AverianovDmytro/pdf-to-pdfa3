# Detailed Task List: PDF to PDF/A-3 Project Improvements

Based on the `prompts/plan.md` file.

## Phase 1: Infrastructure, Cleanup & Refactoring

1. **Environment Verification**
    - [x] 1.1. Verify Node.js version is >= 22.16.0.
    - [x] 1.2. Verify NPM version is >= 11.4.0.
    - [x] 1.3. Verify Java version is 21.
    - [x] 1.4. Run `npm install` in `src/main/frontend` and check for errors.

2. **Frontend Architecture Refactoring**
    - [x] 2.1. Extract `FileUpload` component from `App.tsx` (handle both PDF and XML drops).
    - [x] 2.2. Extract `PDFPreview` component from `App.tsx`.
    - [x] 2.3. Extract `StatusDisplay` component from `App.tsx` for messages and error reporting.
    - [x] 2.4. Create a `layout` directory and implement global UI wrappers (Header/Hero, Footer).

3. **Dependency Updates**
    - [x] 3.1. Add `@iconify/react` to frontend dependencies.
    - [ ] 3.2. (Optional) Install Radix UI primitives (`@radix-ui/react-*`) if needed for enhanced accessibility.

## Phase 2: Design & UI Implementation ("Finance-Tech" Style)

4. **Tailwind Configuration**
    - [x] 4.1. Update `tailwind.config.js` with the Finance-Tech color palette (Deep Blue/Navy, Accent Green/Gold).
    - [x] 4.2. Configure custom border-radius and shadow utilities to achieve the "layered" look.
    - [x] 4.3. Set up font families (Inter, Roboto, or Poppins) in Tailwind config.

5. **Hero Section Development**
    - [x] 5.1. Implement the "Pixel-Hero" landing section layout.
    - [x] 5.2. Integrate professional financial-themed placeholder images from Unsplash.
    - [x] 5.3. Add brand and technology logos using Iconify (Simple Icons).

6. **Interactive Components Styling**
    - [x] 6.1. Redesign `FileUpload` drop zones with drag-and-drop animations and visual "Active" states.
    - [x] 6.2. Style the `StatusDisplay` component with a professional, clean aesthetic.
    - [x] 6.3. Optimize the `PDFPreview` iframe container for responsiveness and visual consistency.

## Phase 3: Functional Enhancements (Validation & Feedback)

7. **Enhanced XML Error Reporting**
    - [x] 7.1. Implement a detailed table in `StatusDisplay` for rendering `xmlErrors`.
    - [x] 7.2. Ensure the table includes columns: File, Line, Column, Description, and Severity.

8. **Progress & State Management**
    - [x] 8.1. Refine the UI for the upload progress bar.
    - [x] 8.2. Implement a "Processing" state to provide feedback during backend conversion.

9. **Backend Integration Checks**
    - [x] 9.1. Verify that the backend `ErrorResponse` model matches the frontend's expected schema for error reporting.

## Phase 4: Integration, Testing & Deployment

10. **End-to-End Testing**
    - [x] 10.1. Perform full conversion test using `file-example_PDF_1MB.pdf` and `ZugFerd_Gutschrift.xml`.
    - [x] 10.2. Validate that the output file is a compliant PDF/A-3 document.

11. **Production Build & Verification**
    - [x] 11.1. Execute `npm run build` in the frontend directory.
    - [x] 11.2. Verify that build artifacts are correctly placed in `src/main/resources/static`.
    - [x] 11.3. Confirm Spring Boot correctly serves the application on `http://localhost:8084`.

12. **Final Polish**
    - [x] 12.1. Run `npm run lint` and resolve all remaining warnings or errors.
    - [x] 12.2. Conduct a final responsive design audit across mobile, tablet, and desktop views.
