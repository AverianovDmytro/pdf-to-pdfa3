# PDF to PDF/A-3 Conversion Service

A robust Spring Boot service designed to convert standard PDF documents into the PDF/A-3 format, commonly used for long-term archiving and electronic invoicing (e.g., ZUGFeRD).

## Features

- **High-Quality Conversion**: Transform standard PDFs to PDF/A-3 compliant documents.
- **RESTful API**: Simple multipart/form-data endpoint for easy integration.
- **Rate Limiting**: Built-in protection using Bucket4j to prevent service abuse.
- **Persistent Storage**: Tracks conversions using PostgreSQL.
- **Modern Web Interface**: Includes a React-based frontend for manual conversions.
- **Containerized**: Ready to deploy with Docker and Docker Compose.

## Tech Stack

- **Backend**: Java 21, Spring Boot 4.x
- **Frontend**: React, TypeScript
- **Database**: PostgreSQL
- **Security/Optimization**: Bucket4j (Rate Limiting), Lombok
- **DevOps**: Docker, Maven

## Getting Started

### Prerequisites

- Docker and Docker Compose (Recommended)
- **OR** JDK 21+ and Maven 3.9+
- **Node.js**: The project uses Maven to manage the Node.js runtime for the frontend. However, for IDE support (e.g., in IntelliJ IDEA), it's recommended to have Node.js v22.16.0 installed on your system or configured in your IDE.

### Configuring Node.js in IntelliJ IDEA

If you see an error like "Specify a Node.js runtime correctly" in IntelliJ IDEA:

1. Open **Settings** (`Ctrl+Alt+S` or `Cmd+,` on macOS).
2. Go to **Languages & Frameworks** > **Node.js**.
3. In the **Node interpreter** field:
   - If you have Node.js installed globally, select it from the dropdown.
   - Alternatively, you can point it to the Node binary downloaded by Maven after running `./mvnw generate-resources`: `target/node/node` (macOS/Linux) or `target/node/node.exe` (Windows).
4. Click **OK**.

### Using Docker Compose (Quickest)

1. Clone the repository.
2. Run the following command in the project root:
   ```bash
   docker compose up --build
   ```
3. The application will be available at `http://localhost:8084`.

### Manual Build

1. **Install Node.js and dependencies** via Maven:
   ```bash
   ./mvnw generate-resources
   ```
   *Note: This will download Node.js and npm locally to the `target/` directory and run `npm install`.*

2. **Build and run** the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Note: The frontend will be automatically built and bundled during the Maven build process.*

## API Documentation

### Convert PDF to PDF/A-3 (ZUGFeRD)

**Endpoint**: `POST /api/v1/convert`  
**Content-Type**: `multipart/form-data`

#### Request Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `file`    | File   | Yes      | Source PDF to convert |
| `xmlFile` | File   | No       | ZUGFeRD / Factur-X XML to embed |
| `profile` | String | No       | ZUGFeRD profile name (default: `BASIC`) |

#### Response — 200 OK

The response body is the converted **PDF/A-3 binary** (`application/pdf`).  
Validation results are returned as **response headers** — the body always contains the file.

| Header | Present when | Content |
|--------|-------------|---------|
| `X-XML-Validation-Errors` | XML file has XSD validation issues | JSON array of `ValidationError` |
| `X-PDF-Validation-Errors` | Converted PDF has PDF/A-3 compliance issues | JSON array of `ValidationError` |

`ValidationError` object structure:
```json
{
  "line":     1,
  "column":   42,
  "location": "/rsm:CrossIndustryInvoice/...",
  "message":  "cvc-complex-type.2.4.a: ...",
  "type":     "ERROR"
}
```
`type` is one of `ERROR`, `FATAL`, or `WARNING`.

#### Error Responses

| Status | Reason |
|--------|--------|
| `400 Bad Request` | File is not a valid PDF, or XML fails XSD validation |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Conversion failed |

---

### Postman Example

#### Step 1 — Send the request and save the PDF

1. Create a new **POST** request.
2. URL: `http://localhost:8084/api/v1/convert`
3. **Body** tab → select **form-data**.
4. Add key `file`, change type to **File**, select your PDF.
5. (Optional) Add key `xmlFile`, change type to **File**, select your ZUGFeRD XML.
6. Click **Send**.
7. In the response pane, click **Save Response → Save to a file** to download the converted PDF.

#### Step 2 — Read the validation results

After the response arrives, click the **Headers** tab in the Postman response pane.  
Look for the two validation headers:

- `X-XML-Validation-Results`
- `X-PDF-Validation-Results`

Each header value is a **plain JSON array** — no encoding needed. You can read it directly in Postman, Navision, or any HTTP client.

To log and assert the results in Postman, add the following to the **Tests** tab of your request before sending:

```javascript
// Read and log XML validation errors
const xmlHeader = pm.response.headers.get("X-XML-Validation-Errors");
if (xmlHeader) {
    const xmlErrors = JSON.parse(xmlHeader);
    console.log("=== XML Validation Errors ===");
    xmlErrors.forEach(e =>
        console.log(`[${e.type}] Line ${e.line}:${e.column} — ${e.message}`)
    );
    pm.test(`XML validation: ${xmlErrors.length} error(s)`, () => {
        const fatal = xmlErrors.filter(e => e.type === "ERROR" || e.type === "FATAL");
        pm.expect(fatal.length, "XML has errors").to.equal(0);
    });
} else {
    console.log("XML Validation: OK (no issues)");
}

// Read and log PDF/A-3 validation errors
const pdfHeader = pm.response.headers.get("X-PDF-Validation-Errors");
if (pdfHeader) {
    const pdfErrors = JSON.parse(pdfHeader);
    console.log("=== PDF/A-3 Validation Errors ===");
    pdfErrors.forEach(e =>
        console.log(`[${e.type}] ${e.location || ""} — ${e.message}`)
    );
    pm.test(`PDF validation: ${pdfErrors.length} error(s)`, () => {
        const fatal = pdfErrors.filter(e => e.type === "ERROR" || e.type === "FATAL");
        pm.expect(fatal.length, "PDF has errors").to.equal(0);
    });
} else {
    console.log("PDF/A-3 Validation: OK (no issues)");
}
```

Open **View → Show Postman Console** (`Ctrl+Alt+C` / `Cmd+Alt+C`) to see the output.

---

### cURL Example

```bash
# Convert and capture response headers alongside the PDF
curl -X POST http://localhost:8084/api/v1/convert \
  -F "file=@/path/to/invoice.pdf" \
  -F "xmlFile=@/path/to/zugferd.xml" \
  --dump-header headers.txt \
  --output converted_invoice.pdf

# Pretty-print XML validation errors (if header is present)
grep "X-XML-Validation-Errors" headers.txt \
  | awk -F': ' '{print $2}' \
  | tr -d '\r' \
  | python3 -m json.tool

# Pretty-print PDF/A-3 validation errors (if header is present)
grep "X-PDF-Validation-Errors" headers.txt \
  | awk -F': ' '{print $2}' \
  | tr -d '\r' \
  | python3 -m json.tool
```

If neither header is present, both the XML and the converted PDF passed validation without issues.

---

### Navision / Business Central (AL) Example

The headers contain plain JSON, so no Base64 decoding is needed. Read the header value and parse it directly:

```al
procedure ReadValidationResults(Response: HttpResponseMessage)
var
    XmlHeader: Text;
    PdfHeader: Text;
    XmlErrors: JsonArray;
    PdfErrors: JsonArray;
    ErrorToken: JsonToken;
    ErrorObj: JsonObject;
    MsgToken: JsonToken;
    TypeToken: JsonToken;
begin
    if Response.Headers.Contains('X-XML-Validation-Errors') then begin
        Response.Headers.GetValues('X-XML-Validation-Errors', XmlHeader);
        XmlErrors.ReadFrom(XmlHeader);
        foreach ErrorToken in XmlErrors do begin
            ErrorObj := ErrorToken.AsObject();
            ErrorObj.Get('message', MsgToken);
            ErrorObj.Get('type', TypeToken);
            Message('XML [%1] %2', TypeToken.AsValue().AsText(), MsgToken.AsValue().AsText());
        end;
    end;

    if Response.Headers.Contains('X-PDF-Validation-Errors') then begin
        Response.Headers.GetValues('X-PDF-Validation-Errors', PdfHeader);
        PdfErrors.ReadFrom(PdfHeader);
        foreach ErrorToken in PdfErrors do begin
            ErrorObj := ErrorToken.AsObject();
            ErrorObj.Get('message', MsgToken);
            ErrorObj.Get('type', TypeToken);
            Message('PDF [%1] %2', TypeToken.AsValue().AsText(), MsgToken.AsValue().AsText());
        end;
    end;
end;
```

---

## Microsoft Dynamics Navision (NAV) Integration

In Microsoft Dynamics NAV (Navision), you can use the `Microsoft XML, v6.0` automation or `DotNet` variables (for NAV 2013 and later) to call a REST service. Since C/AL is often used in older environments, the following example uses **DotNet Interop** with `System.Net.Http` (available in NAV 2013 R2+) as it is more robust for `multipart/form-data` requests.

### C/AL Code Snippet

```cal
PROCEDURE ConvertPdfToPdfA3(InFile : Text; XmlFile : Text; OutFile : Text);
VAR
  HttpClient : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.HttpClient";
  MultipartContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.MultipartFormDataContent";
  FileStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
  XmlFileStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
  StreamContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.StreamContent";
  XmlStreamContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.StreamContent";
  HttpResponse : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.HttpResponseMessage";
  ResultStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
  FileMode : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileMode";
  ServiceUrl : Text;
BEGIN
  // Replace with your actual service URL (default: http://localhost:8084)
  ServiceUrl := 'http://your-server:8084/api/v1/convert';

  HttpClient := HttpClient.HttpClient();
  MultipartContent := MultipartContent.MultipartFormDataContent();

  FileStream := FileStream.FileStream(InFile, FileMode.Open);
  StreamContent := StreamContent.StreamContent(FileStream);
  
  // Param name must be "file"
  MultipartContent.Add(StreamContent, 'file', 'source.pdf');

  // Add the XML file (optional)
  IF XmlFile <> '' THEN BEGIN
    XmlFileStream := XmlFileStream.FileStream(XmlFile, FileMode.Open);
    XmlStreamContent := XmlStreamContent.StreamContent(XmlFileStream);
    MultipartContent.Add(XmlStreamContent, 'xmlFile', 'factur-x.xml');
  END;

  HttpResponse := HttpClient.PostAsync(ServiceUrl, MultipartContent).Result;

  IF HttpResponse.IsSuccessStatusCode THEN BEGIN
    ResultStream := ResultStream.FileStream(OutFile, FileMode.Create);
    HttpResponse.Content.CopyToAsync(ResultStream).Wait();
    ResultStream.Close();
    MESSAGE('Conversion successful! Saved to: %1', OutFile);
  END ELSE BEGIN
    ERROR('Service Error: %1 %2', 
      FORMAT(HttpResponse.StatusCode), 
      HttpResponse.ReasonPhrase);
  END;

  FileStream.Close();
  IF XmlFile <> '' THEN
    XmlFileStream.Close();
  HttpClient.Dispose();
END;
```

For more details on Navision implementation and prerequisites, see [navision/code snippet.md](./navision/code%20snippet.md).
