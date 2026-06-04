# Project Requirements & Developer Guide: PDF to PDF/A-3 (ZUGFeRD) Converter

This document serves as the primary developer guide and requirements specification for the PDF to PDF/A-3 conversion application. It outlines the project objectives, technical architecture, and implementation steps.

## 1. Project Overview & Objectives
The goal of this project is to provide a professional, secure, and user-friendly web application for converting standard PDF documents into PDF/A-3 compliant files with embedded ZUGFeRD (Factur-X) XML data.

### Core Objectives:
- **Compliance**: Generate PDF/A-3 files that meet ISO 19005-3 standards.
- **ZUGFeRD Integration**: Embed valid ZUGFeRD 2.2 XML into the PDF as an attached file.
- **Validation**: Provide real-time validation of the provided XML against official XSD schemas.
- **Professional UI**: Offer a modern, high-end finance-oriented interface (inspired by `e-rechnungs-checker.de`).
- **Performance**: Ensure fast conversion with clear progress feedback.

---

## 2. Technical Architecture

### Backend (Java / Spring Boot)
- **Framework**: Spring Boot 3.x
- **PDF Processing**: Apache PDFBox (for PDF manipulation and PDF/A-3 generation).
- **XML Validation**: JAXP (Java API for XML Processing) with XSD schemas.
- **Rate Limiting**: Bucket4j for protecting the conversion endpoint.
- **Persistence**: Spring Data JPA with H2/PostgreSQL (for tracking conversion history).

### Frontend (TypeScript / React)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.x with custom branding.
- **Components**: Radix UI primitives & Shadcn/UI for accessible, high-quality components.
- **Icons**: Solar Icons (duotone style) for a modern look.
- **API Client**: Axios for multipart file uploads and error handling.

---

## 3. Implementation Steps (Actionable Guide)

### Phase 1: Environment & Build Pipeline
1.  **Maven Integration**: Ensure the `frontend-maven-plugin` is configured to handle `npm install`, `npm run lint`, and `npm run build`.
2.  **Static Resource Mapping**: Configure Vite to output production builds directly to `src/main/resources/static`.
3.  **Linting & Type Safety**: Integrate `npm run lint` into the Maven `generate-resources` phase to enforce code quality before packaging.

### Phase 2: Backend Core Logic
1.  **Service Layer**: Implement `PdfConversionService` using PDFBox to:
    - Load original PDF.
    - Embed ZUGFeRD XML with correct relationship (`/AFRelationship /Data`).
    - Add XMP Metadata (Dublin Core, PDF/A Identification).
    - Embed necessary fonts to ensure PDF/A compliance.
2.  **Validation Service**: Implement `XmlValidationService` to validate incoming XML against `factur-x.xsd`.
3.  **Controller**: Create a REST endpoint `/api/v1/convert` that accepts `multipart/form-data`.

### Phase 3: Frontend UI/UX (The "Finance" Look)
1.  **Branding**: Use a sophisticated color palette:
    - `brand-navy`: Primary background/text.
    - `primary`: Highlight/Action color (e.g., Amber/Gold).
    - `brand-blue`: Secondary accents.
2.  **Layout**: Implement a clean, two-column layout:
    - **Left Column**: "Document Processing" actions (File uploads, Profile selection).
    - **Right Column**: "Live Preview" (PDF viewer and XML data extraction).
3.  **Visual Feedback**:
    - Use `solar:spinner-bold` for processing states.
    - Implement a detailed `StatusDisplay` that shows validation errors in a clear, tabular format.
    - Show file metadata (Name, Size) immediately after selection.

### Phase 4: Validation & Error Handling
1.  **Header-based Communication**: Pass XML validation errors from backend to frontend via the `X-XML-Validation-Errors` Base64-encoded header.
2.  **Tabular Error Reporting**: Render errors with `Type`, `Location` (Line/Col), and `Description`.
3.  **Resilience**: Allow the conversion to proceed even with XML warnings, but clearly flag them to the user.

---

## 4. Best Practices & Design Patterns

### Frontend
- **Type Safety**: Define interfaces for all API responses and parsed XML data (e.g., `ZUGFeRDData`).
- **Component Composition**: Use Radix UI primitives to ensure accessibility and consistent behavior.
- **Conditional Rendering**: Handle "Empty", "Loading", and "Result" states gracefully to avoid layout shifts.
- **Utility-First CSS**: Leverage Tailwind's `cn` utility for dynamic class merging.

### Backend
- **Streaming**: Process files using input streams where possible to minimize memory footprint.
- **Async Processing**: Use `@Async` for long-running conversion tasks if necessary.
- **Logging**: Maintain detailed SLF4J logs for debugging conversion and validation failures.
- **Security**: Sanitize file names and limit upload sizes.

---

## 5. Testing Strategy
- **Unit Tests**: Test XML parsing and validation logic independently.
- **Integration Tests**: Verify the full `/api/v1/convert` flow using `MockMvc` and sample PDF/XML files.
- **Frontend Tests**: Use Vitest/React Testing Library for critical UI components (e.g., `FileUpload`, `zugferdParser`).
- **Compliance Checks**: Periodically verify generated files against official PDF/A-3 validators (like VeraPDF).
