# Task List: ZUGFeRD Validation Improvements

According to the plan in `prompts/plan.md`.

## Backend Improvements
1. [x] Add `location` field to `XmlValidationService.ValidationError` class.
2. [x] Refactor `PdfConversionService.validatePdfA3` to use a more robust XML parsing or improved regex for Mustang reports.
3. [x] Capture `<failedAssert>` elements and extract `test`, `location`, and message content.
4. [x] Capture `<error>`, `<warning>`, and `<notice>` elements from the Mustang report.
5. [x] Ensure `convertToPdfA3` method includes validation errors in the response body when an exception occurs.

## Frontend Improvements
6. [x] Update `ValidationError` interface in `App.tsx` to include the `location` field.
7. [x] Modify `StatusDisplay.tsx` to display the `location` field if present.
8. [x] Implement a toggle or scrollable area in `StatusDisplay.tsx` for large numbers of validation errors.
9. [x] Update `App.tsx` to handle validation errors from both successful (headers) and failed (body) responses consistently.
10. [x] Enhance "Recent Activity" items to store and display validation errors when clicked.

## Verification
11. [x] Create a unit/integration test that validates the new error extraction logic with a sample Mustang report containing `failedAssert`.
12. [x] Manually verify the UI shows detailed errors when uploading an invalid ZUGFeRD XML.
