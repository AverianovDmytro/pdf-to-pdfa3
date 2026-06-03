Create a Controller to convert pdf to pdfa3
POST /convert/pdfa3
Content-Type: multipart/form-data
Is it possible?
Or create a Controller to convert Base64 coded pdf to pdfa3 und return Base64 coded pdfa3
What Variant is better
{
"fileName": "rechnung.pdf",
"content": "JVBERi0xLjQKJ..."
}
byte[] pdfBytes = Base64.getDecoder().decode(content);