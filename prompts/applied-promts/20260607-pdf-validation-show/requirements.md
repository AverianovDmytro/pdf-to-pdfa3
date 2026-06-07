# Developer Guide: Improving ZUGFeRD Validation Feedback

This guide outlines the steps to improve the user experience when ZUGFeRD validation fails during the PDF to PDF/A-3 conversion process. Currently, users see a generic error message. We need to provide detailed feedback by displaying specific validation errors (e.g., `FailedAssert` from the Mustang project report).

## Core Problem
When a PDF is converted successfully but the embedded ZUGFeRD XML fails validation, the UI displays: 
> "PDF converted, but ZUGFeRD validation failed with errors."

This is insufficient for developers and business users who need to know *why* it failed to correct the source XML.

## Actionable Steps

### 1. Backend: Enhance Error Extraction
The `PdfConversionService` currently uses a basic regex to extract errors from the Mustang project's XML report.

*   **Location**: `src/main/java/com/vcapelcin/pdf2zugferd/service/PdfConversionService.java`
*   **Action**: Update the `validatePdfA3` method to more robustly parse the Mustang validation report. 
    *   Ensure all `<error>`, `<notice>`, and specifically `<failedAssert>` elements are captured.
    *   Extract the `test`, `location`, and the human-readable message within these elements.
    *   Map these to the `ValidationError` model.

### 2. Frontend: Improve Error Visibility
The frontend should allow users to view the details of validation errors by clicking on the error status.

*   **Location**: `src/main/frontend/src/App.tsx`
*   **Action**:
    *   **Interactive Error Message**: Modify the status message so that it is clickable when errors are present.
    *   **Detailed View**: Implement a modal or an expanded section that lists all `xmlErrors` captured from the response headers.
    *   **Recent Activity Integration**: Ensure that clicking on an error in the "Recent Activity" block also opens the detailed error view.
    *   **Display Format**: For each error, show the type (ERROR/WARNING), the message, and if available, the location/line number.

### 3. API & Data Handling
*   **Headers**: Continue using the `x-xml-validation-errors` header to pass encoded JSON validation results for successful conversions with validation issues.
*   **Error Responses**: Ensure that for 400/500 errors where conversion itself fails, any available validation context is also included in the JSON body.

### 4. Testing & Verification
*   **Unit Tests**: Update `PdfConversionServiceTest` (or create one) to verify that various Mustang report formats are correctly parsed.
*   **Manual Verification**: 
    1. Upload a valid PDF with an intentionally malformed ZUGFeRD XML.
    2. Verify the UI shows the "Validation failed" message.
    3. Click the message and verify that specific `FailedAssert` messages are displayed.

## Best Practices
*   **Clarity**: Error messages should be user-friendly where possible, but technical details (like Schematron paths) should be available for developers.
*   **Performance**: Keep the regex-based parsing efficient or switch to a proper XML parser if the Mustang report structure becomes complex.
*   **Consistency**: Use the existing `ValidationError` structure throughout the stack to ensure compatibility between the backend and frontend.
