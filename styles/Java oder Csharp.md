### Vergleich: C# DLL (iText7) vs. Spring Boot REST-Dienst (Mustangproject)

Wenn Sie sich entscheiden, die Funktionalität von einem Spring Boot REST-Dienst auf eine native C# DLL umzustellen, ergeben sich signifikante Unterschiede in der Architektur, der Entwicklung und dem Betrieb.

Hier ist ein detaillierter Vergleich der beiden Ansätze:

### 1. Architektur und Integration
*   **C# DLL (In-Process):**
    *   **Integration:** Die DLL wird direkt in Navision als `DotNet`-Variable geladen. Der Code läuft im gleichen Speicherbereich wie der Navision-Client oder der Service-Tier (NST).
    *   **Performance:** Extrem schnell für einzelne Dateien, da kein Netzwerk-Overhead (Latenz) entsteht.
    *   **Abhängigkeiten:** Alle benötigten DLLs (`itext.kernel.dll`, `ZUGFeRD-csharp.dll`, etc.) müssen auf dem Rechner vorhanden sein, auf dem der Code ausgeführt wird (Client oder Server).

*   **Spring Boot REST (Out-of-Process):**
    *   **Integration:** Navision sendet die Dateien per HTTP-Post an den Server.
    *   **Entkopplung:** Das Java-Programm läuft unabhängig. Wenn der Dienst abstürzt, bleibt Navision stabil.
    *   **Zentralisierung:** Updates müssen nur an einer Stelle (auf dem Server) durchgeführt werden. Navision-Clients benötigen keine speziellen lokalen Dateien.

### 2. Funktionsumfang und Komplexität
*   **Mustangproject (Java):**
    *   **Spezialisierung:** Es ist eine "All-in-One"-Lösung für ZUGFeRD. Es kümmert sich automatisch um PDF/A-Konformität, XMP-Metadaten, Dateianhänge und die korrekte Struktur.
    *   **Validierung:** Es bringt einen integrierten Validator mit, der sicherstellt, dass die erzeugten Dateien dem Standard entsprechen.

*   **iText7 + ZUGFeRD-csharp (C#):**
    *   **Manueller Aufwand:** iText7 ist eine mächtige PDF-Bibliothek, aber kein spezialisiertes ZUGFeRD-Tool. Sie müssen den PDF/A-3-Container, das Einbetten der XML-Datei und die XMP-Metadaten händisch konfigurieren.
    *   **Ressourcen:** Sie müssen ein ICC-Farbprofil (z.B. `sRGB_CS_profile.icm`) manuell mitliefern und einbinden, da PDF/A-3 dies zwingend erfordert.

### 3. Wartung und Deployment
| Merkmal | C# DLL Lösung | Spring Boot REST Lösung |
| :--- | :--- | :--- |
| **Update-Aufwand** | Hoch (DLLs müssen auf allen Servern/Clients getauscht werden). | Gering (Nur Server-Update nötig). |
| **Fehlersuche** | Schwieriger, da Fehler direkt in Navision auftreten. | Einfacher durch zentrale Server-Logs. |
| **Lizensierung** | iText7 (AGPL oder kommerziell). | Mustangproject (Apache 2.0 - sehr liberal). |
| **Infrastruktur** | Keine zusätzliche Infrastruktur nötig. | Erfordert einen Server/Docker-Container für die JRE. |

### 4. Technischer Vergleich der Umsetzung

| Aufgabe | C# (iText7 + ZUGFeRD-csharp) | Java (Mustangproject) |
| :--- | :--- | :--- |
| **PDF/A-3 Erstellung** | Muss explizit über `PdfADocument` und ICC-Profil definiert werden. | Wird automatisch durch `ZUGFeRDExporter` erledigt. |
| **XML Einbettung** | Muss als `PdfFileSpec` mit AFRelationship `Alternative` angehängt werden. | Einfacher Befehl: `exporter.setXML(xmlBytes)`. |
| **Metadaten (XMP)** | Müssen manuell als XML-String in die Metadaten des PDFs injiziert werden. | Werden automatisch standardkonform generiert. |

### Fazit und Empfehlung

*   Wählen Sie die **C# DLL**, wenn Sie eine **maximale Integration ohne externe Abhängigkeiten** (kein zusätzlicher Server) wünschen und bereit sind, die PDF/A-3 Details (Metadaten, ICC-Profile) einmalig tiefer zu implementieren.
*   Bleiben Sie beim **REST-Dienst**, wenn Sie die **Einfachheit von Mustangproject** schätzen und eine zentrale Stelle für die Konvertierung bevorzugen, die leicht von verschiedenen Systemen (nicht nur Navision) genutzt werden kann.

**Hinweis zur Lizensierung:** Achten Sie bei iText7 darauf, dass die AGPL-Lizenz vorschreibt, dass Ihr eigener Code unter Umständen auch offengelegt werden muss, sofern Sie keine kommerzielle Lizenz erwerben. Mustangproject (Java) ist hier wesentlich flexibler.