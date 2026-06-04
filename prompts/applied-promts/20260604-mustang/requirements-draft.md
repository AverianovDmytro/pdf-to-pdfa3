### Mustangproject for Java

Yes, you can definitely use **Mustangproject** for your Java project. It is specifically designed to handle the ZUGFeRD/Factur-X requirements you outlined in `requirements-draft.md`.

### Is it Open Source?
*   **Yes.** It is a fully open-source project.
*   **License:** It is licensed under the **Apache License 2.0**.
*   **Usage:** This is a permissive license that allows for free use in both **commercial and non-commercial** applications.

### Why it fits your needs
Mustangproject directly addresses the failures mentioned in your draft:

*   **XML Embedding:** It automates the creation and embedding of the machine-readable `factur-x.xml` required for ZUGFeRD.
*   **PDF/A-3 Conversion:** It includes tools to convert standard PDFs into valid PDF/A-3 files with the correct XMP metadata.
*   **Validation:** It provides a validator component to ensure the resulting files pass the strict checks (like the Munich Enterprise validator you mentioned).

### Integration
You can add it to your Java project via Maven:

```xml
<dependency>
    <groupId>org.mustangproject</groupId>
    <artifactId>library</artifactId>
    <version>2.23.1</version>
</dependency>
```

It is a mature, actively maintained library (latest release was in April 2026) and is considered the standard open-source choice for Java-based e-invoicing in the EU.

Change a project to use a Mustangproject.
I need a project to convert PDFs into PDF/A-3 and add a XML file to it.
Now I use pdfbox, but I want to use Mustangproject.