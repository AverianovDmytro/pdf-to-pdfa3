export function parseZUGFeRD(xmlText: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  // Helper to get text content from a tag name, ignoring namespaces if possible or using common ones
  const getText = (parent: Element | Document, tagName: string) => {
    const el = parent.getElementsByTagName(tagName)[0];
    return el ? el.textContent : null;
  };


  // Extract Invoice Summary
  const invoiceNumber = getText(xmlDoc, "ram:ID") || getText(xmlDoc, "ID");
  const issueDate = getText(xmlDoc, "ram:DateTimeString") || getText(xmlDoc, "DateTimeString");
  const currencyCode = getText(xmlDoc, "ram:InvoiceCurrencyCode") || getText(xmlDoc, "InvoiceCurrencyCode");

  // Extract Party Information (Simplified for preview)
  const getPartyInfo = (partyTag: string) => {
    const party = xmlDoc.getElementsByTagName(partyTag)[0];
    if (!party) return null;
    return {
      name: getText(party, "ram:Name") || getText(party, "Name"),
      vatId: getText(party, "ram:ID") || getText(party, "ID"), // This might be wrong for VAT, but a placeholder
      address: getText(party, "ram:LineOne") || getText(party, "LineOne"),
    };
  };

  const seller = getPartyInfo("ram:SellerTradeParty") || getPartyInfo("SellerTradeParty");
  const buyer = getPartyInfo("ram:BuyerTradeParty") || getPartyInfo("BuyerTradeParty");

  // Extract Line Items
  const lineItems: any[] = [];
  const items = xmlDoc.getElementsByTagName("ram:IncludedSupplyChainTradeLineItem");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    lineItems.push({
      description: getText(item, "ram:Name") || getText(item, "Name"),
      quantity: getText(item, "ram:BasisQuantity") || getText(item, "BasisQuantity"),
      unitPrice: getText(item, "ram:ChargeAmount") || getText(item, "ChargeAmount"),
    });
  }

  // Extract Totals
  const totalAmount = getText(xmlDoc, "ram:GrandTotalAmount") || getText(xmlDoc, "GrandTotalAmount");
  const taxAmount = getText(xmlDoc, "ram:TaxTotalAmount") || getText(xmlDoc, "TaxTotalAmount");

  return {
    summary: { invoiceNumber, issueDate, currencyCode },
    seller,
    buyer,
    lineItems,
    totals: { totalAmount, taxAmount }
  };
}
