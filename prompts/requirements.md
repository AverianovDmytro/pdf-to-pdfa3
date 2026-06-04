# Developer Guide: PDF to PDF/A-3 Conversion Service

This guide outlines the requirements and implementation steps for the PDF to PDF/A-3 Conversion Service, including the ZUGFeRD-compliant frontend and backend integration.

## Project Overview
The application converts standard PDF documents into ISO 19005-3 compliant PDF/A-3 files, specifically supporting the embedding of ZUGFeRD XML for electronic invoicing.

---

## Actionable Development Steps

### 1. Frontend Development & UI/UX
The frontend is built with React, TypeScript, and Tailwind CSS 4.0, utilizing Radix UI components for accessibility.

- **Design Fidelity**: 
    - Refer to `styles/design.png` for layout and color scheme.
    - Match components exactly as shown in `styles/zugferd_converter_ui.html`.
- **Core Components**:
    - **FileUpload**: Implement a drag-and-drop zone using `react-dropzone` for both PDF and XML files.
    - **Previewers**: 
        - `PDFPreview`: Display the source PDF.
        - `XMLPreview`: Parse and display ZUGFeRD XML data (using `zugferdParser.ts`).
    - **StatusDisplay**: Show conversion progress, success messages, or validation errors.
- **State Management**:
    - Handle file states (`file`, `xmlFile`), loading status, and conversion results in `App.tsx`.
    - Persist recent conversions in `localStorage`.
- **Styling**:
    - Use Tailwind CSS 4.0 utilities.
    - Ensure Radix UI components are correctly themed and functional.

### 2. Backend Integration
The backend is a Spring Boot application providing RESTful endpoints.

- **API Endpoint**: `POST /api/v1/convert`
    - **Input**: `multipart/form-data` with keys `file` (PDF) and `xmlFile` (Optional XML).
    - **Output**: Returns the converted `application/pdf` file.
- **Error Handling**:
    - Handle `400 Bad Request` (invalid input).
    - Handle `429 Too Many Requests` (rate limiting via Bucket4j).
    - Handle `500 Internal Server Error` (conversion failure).

### 3. Build and Deployment
The project uses Maven to orchestrate both backend and frontend builds.

- **Frontend Build**:
    - Run `npm install` (or `./mvnw generate-resources`) to fetch dependencies.
    - Build using `npm run build`. The output is configured to go into `src/main/resources/static` for Spring Boot to serve.
- **Backend Build**:
    - Run `./mvnw clean install` to build the entire project.
- **Docker**:
    - Use `docker compose up --build` for a complete environment (Java + PostgreSQL).

### 4. Testing & Quality Assurance
- **Frontend**:
    - Run `npm test` to execute unit tests.
    - Run `npm run lint` to check for code style issues.
- **Backend**:
    - Execute JUnit tests located in `src/test/java`.
- **Validation**:
    - Verify that the output PDF is a valid PDF/A-3 file using external validators (e.g., VeraPDF).

---

## Best Practices
- **TypeScript**: Maintain strict typing across the frontend.
- **Components**: Keep components modular and reusable under `src/main/frontend/src/components/`.
- **Accessibility**: Use Radix UI primitives to ensure high accessibility standards.
- **Performance**: Optimize PDF rendering and XML parsing for large documents.
