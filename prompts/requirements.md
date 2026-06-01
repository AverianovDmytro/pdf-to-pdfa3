# Developer Guide: PDF to PDF/A-3 Conversion Service

This guide provides actionable steps for maintaining and extending the PDF to PDF/A-3 conversion service.

## Project Overview
A Spring Boot application with a React-based frontend that converts standard PDF files into the PDF/A-3 (Basic conformance) format using Apache PDFBox.

---

## 1. Backend Development (Spring Boot)

### Core Service Logic
- **File**: `src/main/java/com/vcapelcin/pdftopdfa3/service/PdfConversionService.java`
- **Actions**:
    - **Validation**: Ensure incoming files are valid PDFs by checking magic bytes (`%PDF`).
    - **Font Embedding**: PDF/A requires all fonts to be embedded. Currently, the service logs non-embedded fonts. Future improvement: Implement system font lookups for automatic embedding.
    - **Metadata Management**: Uses `XMPMetadata` to set PDF/A-3 identification (Part 3, Conformance B).
    - **Color Profiles**: Includes `sRGB.icc` as the output intent.
    - **Verification**: Uses `PreflightParser` to validate the resulting file against PDF/A standards.

### API Implementation
- **File**: `src/main/java/com/vcapelcin/pdftopdfa3/controller/PdfConversionController.java`
- **Endpoint**: `POST /api/v1/convert`
- **Request Type**: `multipart/form-data` with parameter `file`.
- **Rate Limiting**: Integrated with Bucket4j. Configured in `RateLimitConfig.java` (currently 10 requests per minute).

### Exception Handling
- **File**: `src/main/java/com/vcapelcin/pdftopdfa3/exception/GlobalExceptionHandler.java`
- **Approach**: Uses `ProblemDetail` (RFC 7807) for standardized error responses.

---

## 2. Frontend Development (React + Vite)

### Technology Stack
- **Framework**: React with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS 4, Radix UI, Shadcn/UI.

### Build and Integration
- **Directory**: `src/main/frontend`
- **Vite Configuration**: `vite.config.ts` is configured to output build artifacts directly to `src/main/resources/static`.
- **Backend Serving**: Spring Boot serves the built frontend from the static resources folder on port `8084`.

---

## 3. Operational Steps

### Local Development
1. **Frontend**:
   ```bash
   cd src/main/frontend
   npm install
   npm run dev
   ```
2. **Backend**:
   - Run `PdfToPdfA3Application` from your IDE or via `./mvnw spring-boot:run`.
   - The application will be accessible at `http://localhost:8084`.

### Building for Production
1. **Build Frontend**:
   ```bash
   cd src/main/frontend
   npm run build
   ```
   (This places files in `src/main/resources/static`)
2. **Build JAR**:
   ```bash
   ./mvnw clean package
   ```

### Testing
- **Backend Tests**: `src/test/java` (includes `PdfConversionServiceTest`). Run via `./mvnw test`.
- **Frontend Tests**: Run `npm test` in the `src/main/frontend` directory.
- **Linting**: Run `npm run lint` in the `src/main/frontend` directory.

---

## 4. Best Practices & Guidelines
- **API Versioning**: Always use the `/api/v1` prefix for controllers.
- **Asynchronous Processing**: Use `@Async` for long-running conversion tasks where appropriate (already supported in `PdfConversionService`).
- **Component Styling**: Use Shadcn/UI components for consistent UI/UX. Ensure Tailwind CSS 4 directives are respected.
- **Error Messages**: Provide clear, actionable error messages through the `GlobalExceptionHandler`.
