### C/AL Example for Calling PDF to PDF/A-3 Service

In Microsoft Dynamics NAV (Navision), you can use the `Microsoft XML, v6.0` automation or `DotNet` variables (for NAV 2013 and later) to call a REST service. Since C/AL is often used in older environments, the following example uses **DotNet Interop** with `System.Net.Http` (available in NAV 2013 R2+) as it is more robust for `multipart/form-data` requests.

#### Prerequisites
- The service is running (e.g., at `http://your-server:8084/api/v1/convert`).
- You have the PDF file saved locally or in a stream.

#### C/AL Code Snippet

```cal
OBJECT Codeunit 50000 PDF Converter
{
  PROPERTIES
  {
    OnRun=BEGIN
            ConvertPdfToPdfA3('C:\Temp\Invoice.pdf', 'C:\Temp\Invoice_A3.pdf');
          END;
  }

  PROCEDURE ConvertPdfToPdfA3(InFile : Text; OutFile : Text);
  VAR
    HttpClient : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.HttpClient";
    MultipartContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.MultipartFormDataContent";
    FileStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
    StreamContent : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.StreamContent";
    HttpResponse : DotNet "'System.Net.Http, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a'.System.Net.Http.HttpResponseMessage";
    ResultStream : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileStream";
    FileMode : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.IO.FileMode";
    Task : DotNet "'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.System.Threading.Tasks.Task";
    ServiceUrl : Text;
  BEGIN
    ServiceUrl := 'http://your-server:8084/api/v1/convert';

    // 1. Initialize HttpClient and Content
    HttpClient := HttpClient.HttpClient();
    MultipartContent := MultipartContent.MultipartFormDataContent();

    // 2. Load the PDF file
    FileStream := FileStream.FileStream(InFile, FileMode.Open);
    StreamContent := StreamContent.StreamContent(FileStream);
    
    // 3. Add file to the multipart content (param name must be "file")
    MultipartContent.Add(StreamContent, 'file', 'source.pdf');

    // 4. Send Post Request (Synchronous wait for simplicity in C/AL)
    HttpResponse := HttpClient.PostAsync(ServiceUrl, MultipartContent).Result;

    IF HttpResponse.IsSuccessStatusCode THEN BEGIN
      // 5. Save the result to OutFile
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
}
```

#### Key Implementation Details
- **Endpoint**: Matches your `PdfConversionController` mapping `/api/v1/convert`.
- **Form Data**: The `MultipartContent.Add` uses the name `'file'`, which corresponds to `@RequestParam("file")` in your Java code.
- **Handling Result**: The service returns a `ResponseEntity<byte[]>`. In C/AL, we copy the response stream directly to a new file.
- **DotNet Variables**: Ensure `RunOnClient` is set to `No` if running on the Service Tier (NST), and that the server has access to the URL.

#### Notes for Older Navision Versions
If you are on a very old version (like NAV 5.0 or 2009 R2 without DotNet Interop), you would need to use `MSXML2.XMLHTTP` and manually construct the `multipart/form-data` body, which is significantly more complex due to the boundary requirements. It is highly recommended to use the DotNet approach shown above.