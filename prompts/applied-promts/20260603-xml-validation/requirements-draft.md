Add validation to the requirements

ZUGFeRD Format: Elements, Data Fields & Examples
A standard ZUGFeRD format invoice comprises a human-readable PDF with an embedded machine-readable XML (compliant with EN 16931 standards).

The XML includes the following data fields:

1. Invoice:

Invoice number.
Invoice issue date.
Invoice type code.
Invoice currency code.
2. Party Information (Supplier/Buyer):

Name, address, and VAT registration number.
Purchase order reference/sales order reference.
Delivery information.
3. Line Items:

Item description.
Quantity.
Unit price.
VAT rate.
4. Totals & VAT:

Document totals.
Discounts, if any,
VAT category.
VAT breakdown.
5. Payment Details:

Payment instructions and bank details.
For example, a manufacturing supplier sends an e-invoice to a German buyer. The buyer opens the PDF for view normally, while their accounting software extracts the embedded XML automatically and posts the invoice into accounts payable workflows without manual entry. For high invoice volumes, this removes hours of repetitive processing work.

If xml file is not valid, in Frontend show error message with all errors.
If pdf file is not valid, in Frontend show error message with all errors.
