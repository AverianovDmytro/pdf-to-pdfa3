export interface ZUGFeRDData {
  header: {
    id: string;
    date: string;
    totalAmount: number;
    currency: string;
    sellerName: string;
  };
  summary: {
    invoiceNumber: string | null;
    issueDate: string | null;
    currencyCode: string | null;
  };
  seller: {
    name: string | null;
    vatId: string | null;
    address: string | null;
  } | null;
  buyer: {
    name: string | null;
    vatId: string | null;
    address: string | null;
  } | null;
  lineItems: Array<{
    description: string | null;
    quantity: string | null;
    unitPrice: string | null;
  }>;
  totals: {
    totalAmount: string | null;
    taxAmount: string | null;
  };
}

export function parseZUGFeRD(xmlText: string): ZUGFeRDData {
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
      vatId: getText(party, "ram:ID") || getText(party, "ID"),
      address: getText(party, "ram:LineOne") || getText(party, "LineOne"),
    };
  };

  const seller = getPartyInfo("ram:SellerTradeParty") || getPartyInfo("SellerTradeParty");
  const buyer = getPartyInfo("ram:BuyerTradeParty") || getPartyInfo("BuyerTradeParty");

  // Extract Line Items
  const lineItems: ZUGFeRDData['lineItems'] = [];
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
  const totalAmountStr = getText(xmlDoc, "ram:GrandTotalAmount") || getText(xmlDoc, "GrandTotalAmount");
  const taxAmountStr = getText(xmlDoc, "ram:TaxTotalAmount") || getText(xmlDoc, "TaxTotalAmount");

  const totalAmount = parseFloat(totalAmountStr || "0");

  return {
    header: {
      id: invoiceNumber || 'N/A',
      date: issueDate || 'N/A',
      totalAmount: totalAmount,
      currency: currencyCode || 'EUR',
      sellerName: seller?.name || 'N/A'
    },
    summary: { invoiceNumber, issueDate, currencyCode },
    seller,
    buyer,
    lineItems,
    totals: { totalAmount: totalAmountStr, taxAmount: taxAmountStr }
  };
}
