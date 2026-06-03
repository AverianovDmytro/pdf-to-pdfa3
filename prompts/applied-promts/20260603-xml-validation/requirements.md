# PDF to PDF/A-3 Conversion & ZUGFeRD Integration Guide

This guide provides actionable steps for developers to maintain and improve the PDF to PDF/A-3 conversion service, with a focus on ZUGFeRD-compliant e-invoicing.

## 1. ZUGFeRD XML Requirements
A standard ZUGFeRD format invoice comprises a human-readable PDF with an embedded machine-readable XML compliant with EN 16931 standards.

### Mandatory Data Fields for XML
Ensure the generated/received XML includes:
*   **Invoice Details:** Invoice number, issue date, type code, and currency code.
*   **Party Information:** Supplier and Buyer name, address, VAT registration number, and order references.
*   **Line Items:** Description, quantity, unit price, and VAT rate per item.
*   **Totals & VAT:** Document totals, discounts, VAT categories, and VAT breakdown.
*   **Payment Details:** Payment instructions and bank account details (IBAN/BIC).

## 2. Validation Implementation
Robust validation ensures that only compliant documents are processed and clear feedback is provided to the user.

### Backend Validation (Spring Boot)
*   **PDF/A-3 Compliance:** Use the `PreflightParser` in `PdfConversionService.validatePdfA3()` to check for compliance.
*   **Font Embedding:** Ensure all fonts are embedded during conversion. Check `embedFonts()` in `PdfConversionService`.
*   **XML Schema Validation:** (Future) Implement XSD validation for incoming ZUGFeRD XML files to ensure EN 16931 compliance before embedding.

### Frontend Error Handling (React)
*   If the PDF or XML file is invalid, display a clear error message in the UI.
*   The `App.tsx` component should catch errors from the `/api/v1/convert` endpoint and display the `message` returned by the backend.
*   **Action:** Ensure the backend returns a JSON error body even when the response type is `application/pdf` (the frontend already handles Blob-to-JSON conversion for errors).

## 3. PDF/A-3 Conversion Workflow
Follow these steps to ensure a successful conversion process in `PdfConversionService.java`:

1.  **Load Document:** Load the source PDF using `Loader.loadPDF()`.
2.  **Embed XML:** Call `embedZugferdXml()` to attach the machine-readable XML as an embedded file with `AFRelationship` set to `Data`.
3.  **Set PDF/A Metadata:** Use `makePdfA3()` to:
    *   Add the `PDFAIdentificationSchema` (Part 3, Conformance B).
    *   Add ZUGFeRD extension schemas to XMP metadata.
    *   Set creation/modification dates and basic XMP properties.
4.  **Embed Fonts:** Iterate through pages and ensure all fonts used are embedded in the document.
5.  **Output Intent:** Set the color profile (e.g., sRGB) to satisfy PDF/A requirements.
6.  **Final Validation:** Run the `validatePdfA3()` method on the resulting byte array.

## 4. Building and Testing
### Frontend
*   **Build:** `cd src/main/frontend && npm install && npm run build`.
*   **Test:** `npm test` to run unit tests.
*   **Lint:** `npm run lint` to check for code style issues.

### Backend
*   **Build:** `./mvnw clean install`.
*   **Run:** `./mvnw spring-boot:run` (accessible at `http://localhost:8084`).
*   **Tests:** Run `PdfConversionServiceTest` and `BulkConversionTest` to verify conversion logic.

## 5. Integration Best Practices
*   **Rate Limiting:** The service uses Bucket4j. Ensure the frontend handles `429 Too Many Requests` gracefully.
*   **Async Processing:** For large volumes, use `convertToPdfA3Async()` to avoid blocking threads.
*   **Navision Integration:** Use the provided C/AL snippet in `navision/` for connecting older ERP systems to this modern REST service.
