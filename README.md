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

### Using Docker Compose (Quickest)

1. Clone the repository.
2. Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```
3. The application will be available at `http://localhost:8084`.

### Manual Build

1. Build the frontend:
   ```bash
   cd src/main/frontend
   npm install && npm run build
   ```
2. Build and run the Spring Boot application:
   ```bash
   cd ../../../
   ./mvnw spring-boot:run
   ```

## API Documentation

### Convert PDF to PDF/A-3

**Endpoint**: `POST /api/v1/convert`  
**Content-Type**: `multipart/form-data`

#### Request Parameters
- `file`: The PDF file to be converted (Binary).

#### Response
- `200 OK`: Returns the converted PDF file as a download (`application/pdf`).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Conversion failed.

---

### Postman Example

To test the service in Postman:

1. Create a new request.
2. Set the method to **POST**.
3. Enter the URL: `http://localhost:8084/api/v1/convert`.
4. Go to the **Body** tab.
5. Select **form-data**.
6. In the **Key** field, type `file` and change the type from "Text" to **File**.
7. In the **Value** field, select the PDF file you want to convert.
8. Click **Send**.
9. Postman will show the response; you can use "Save Response -> Save to a file" to see the converted PDF.

---

## Microsoft Dynamics Navision (NAV) Integration

In Microsoft Dynamics NAV (Navision), you can use the `Microsoft XML, v6.0` automation or `DotNet` variables (for NAV 2013 and later) to call a REST service. Since C/AL is often used in older environments, the following example uses **DotNet Interop** with `System.Net.Http` (available in NAV 2013 R2+) as it is more robust for `multipart/form-data` requests.

### C/AL Code Snippet

```cal
PROCEDURE ConvertPdfToPdfA3(InFile : Text; OutFile : Text);
VAR
  HttpClient : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.HttpClient";
  MultipartContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.MultipartFormDataContent";
  FileStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
  StreamContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.StreamContent";
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
  HttpClient.Dispose();
END;
```

For more details on Navision implementation and prerequisites, see [navision/code snippet.md](./navision/code%20snippet.md).
