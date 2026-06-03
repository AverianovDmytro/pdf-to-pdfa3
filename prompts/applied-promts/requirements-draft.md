I need a Service to create a ZUGFeRD invoice.
Ab Version 2.0 erfüllt ZUGFeRD vollständig die europäische Norm EN 16931 und ist somit für den inländischen und EU-weiten Geschäftsverkehr (B2B) sowie für Behörden (B2G) zugelassen.
Service have two parameters:
- pdf file
- xml file
Service should return a response with the one file pdf as a ZUGFeRD invoice.
Service should 
- convert pdf to pdf a/3 format;
- add to pdf xml file
- return pdf file.