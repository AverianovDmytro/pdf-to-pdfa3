# Implementation Plan: Improving ZUGFeRD Validation Feedback

This document outlines the detailed steps to improve validation error reporting in the PDF2ZUGFeRD project, as required by the `prompts/requirements.md` developer guide.

## Overview
The goal is to transition from generic error messages to detailed, actionable validation feedback in both the backend and frontend.

## 1. Backend: Robust Validation Reporting
Currently, `PdfConversionService.java` uses a simple regex to parse the Mustang project's XML validation report. This needs to be enhanced to capture all relevant issues, including Schematron `failedAssert` elements.

### 1.1 Update `ValidationError` Model
*   Ensure `XmlValidationService.ValidationError` can accommodate additional fields if necessary (though the current `line`, `column`, `message`, `type` are a good start).
*   Consider adding a `location` field (String) to store Schematron paths or XPath locations often found in `failedAssert`.

### 1.2 Enhance Mustang Report Parsing in `PdfConversionService.java`
*   Replace or augment the current regex-based parsing in `validatePdfA3` with a more robust XML-aware approach or a better regex.
*   **Target Tags**:
    *   `<error>`
    *   `<notice>` / `<warning>`
    *   `<failedAssert>` (CRITICAL: this contains specific business rule violations).
*   **Extraction Logic**:
    *   Capture the content of the message.
    *   If it's a `failedAssert`, extract the `test` attribute and the `location` if possible.
    *   Normalize the `type`: `ERROR`, `WARNING`, `FATAL`.

### 1.3 Error Response Enrichment
*   Ensure that when the conversion fails entirely (not just validation), the error response JSON includes the `errors` list.

## 2. Frontend: Interactive and Detailed Feedback
The frontend should make it easier for users to see exactly what went wrong.

### 2.1 Enhance `StatusDisplay.tsx`
*   The current `StatusDisplay` already shows a list of issues.
*   **Improvement**: Add a toggle or "View Details" button to show/hide the validation issues section if it gets too large.
*   **Improvement**: Better styling for different error types (Fatal vs. Error vs. Warning).

### 2.2 Enhance `App.tsx`
*   **State Management**: Ensure `xmlErrors` state is correctly populated from both headers (for successful conversions with warnings) and error bodies (for failed conversions).
*   **Navigation**: When a user clicks on a "Recent Activity" item that has an error status, the app should show the validation errors for that specific conversion (this might require storing errors in `localStorage` along with the history).

## 3. Integration & Testing

### 3.1 Integration Testing
*   Create a test case with a malformed ZUGFeRD XML to trigger `failedAssert`.
*   Verify the API returns these asserts in the `x-xml-validation-errors` header or the response body.

### 3.2 Manual Verification
*   Verify that clicking an error message in the UI provides the full list of `failedAssert` messages.

## 4. Documentation Update
*   Update `prompts/requirements.md` if any new best practices or implementation details emerge during the process.
