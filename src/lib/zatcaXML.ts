/**
 * ZATCA UBL 2.1 XML Invoice Generator
 * توليد فواتير XML متوافقة مع هيئة الزكاة والضريبة والجمارك
 * المرحلة الأولى والثانية (Phase 1 & 2)
 * 
 * References:
 * - ZATCA E-invoicing XML Implementation Standard
 * - UBL 2.1 (Universal Business Language)
 * - ISO 8601 Date/Time formatting
 */

export interface ZatcaXMLInvoiceData {
  // Invoice identification
  uuid: string;
  invoiceNumber: string | number;
  invoiceDate: string;
  invoiceTime?: string;
  invoiceType: 'sale' | 'purchase';
  invoiceTypeCode: '388' | '381' | '383'; // 388=Tax Invoice, 381=Credit Note, 383=Debit Note
  
  // Seller info
  sellerName: string;
  sellerNameEn?: string;
  sellerTaxNumber: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerPostalCode?: string;
  sellerCountry?: string;
  sellerBuildingNumber?: string;
  sellerStreet?: string;
  sellerDistrict?: string;
  sellerCommercialRegister?: string;
  
  // Buyer info
  buyerName: string;
  buyerNameEn?: string;
  buyerTaxNumber?: string;
  buyerIdNumber?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerPostalCode?: string;
  buyerCountry?: string;
  
  // Line items
  items: ZatcaXMLItem[];
  
  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  
  // Currency
  currency?: string;
  
  // Payment
  paymentMethod?: string;
  
  // Notes
  notes?: string;
}

export interface ZatcaXMLItem {
  id?: string;
  description: string;
  descriptionEn?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  unitCode?: string; // PCE, KGM, LTR, etc.
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format amount to 2 decimal places
 */
function fmt(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date to ZATCA format (yyyy-MM-dd)
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to ZATCA format (HH:mm:ss)
 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Generate a ZATCA-compliant UBL 2.1 XML invoice string
 */
export function generateZatcaXML(data: ZatcaXMLInvoiceData): string {
  const currency = data.currency || 'SAR';
  const invoiceDate = formatDate(data.invoiceDate);
  const invoiceTime = data.invoiceTime || formatTime(data.invoiceDate);
  const countryCode = data.sellerCountry || 'SA';
  const buyerCountryCode = data.buyerCountry || 'SA';
  
  // Determine invoice type code and transaction type
  const typeCode = data.invoiceTypeCode || '388';
  // 0100000 = Standard tax invoice, 0200000 = Simplified tax invoice
  const invoiceSubType = data.buyerTaxNumber ? '0100000' : '0200000';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  <!-- UBL Extensions (for digital signature - Phase 2) -->
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <!-- Digital Signature placeholder for Phase 2 integration -->
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <!-- Profile ID -->
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  
  <!-- Invoice UUID (معرف فريد) -->
  <cbc:ID>${escapeXml(String(data.invoiceNumber))}</cbc:ID>
  <cbc:UUID>${escapeXml(data.uuid)}</cbc:UUID>
  
  <!-- Invoice Issue Date & Time -->
  <cbc:IssueDate>${invoiceDate}</cbc:IssueDate>
  <cbc:IssueTime>${invoiceTime}</cbc:IssueTime>
  
  <!-- Invoice Type Code -->
  <cbc:InvoiceTypeCode name="${invoiceSubType}">${typeCode}</cbc:InvoiceTypeCode>
  
  <!-- Document Currency -->
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>
  
  ${data.notes ? `<!-- Notes -->
  <cbc:Note>${escapeXml(data.notes)}</cbc:Note>` : ''}

  <!-- Additional Document Reference - Invoice Counter -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${escapeXml(String(data.invoiceNumber))}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  
  <!-- Additional Document Reference - Previous Invoice Hash (PIH) -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">
        <!-- Previous Invoice Hash - to be populated for chaining -->
        NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==
      </cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>

  <!-- Seller (AccountingSupplierParty) - البائع -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(data.sellerCommercialRegister || '')}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.sellerStreet || data.sellerAddress || '')}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(data.sellerBuildingNumber || '')}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(data.sellerDistrict || '')}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(data.sellerCity || '')}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.sellerPostalCode || '')}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${countryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.sellerTaxNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.sellerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Buyer (AccountingCustomerParty) - المشتري -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${data.buyerTaxNumber ? `<cac:PartyIdentification>
        <cbc:ID schemeID="VAT">${escapeXml(data.buyerTaxNumber)}</cbc:ID>
      </cac:PartyIdentification>` : data.buyerIdNumber ? `<cac:PartyIdentification>
        <cbc:ID schemeID="NAT">${escapeXml(data.buyerIdNumber)}</cbc:ID>
      </cac:PartyIdentification>` : ''}
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.buyerAddress || '')}</cbc:StreetName>
        <cbc:CityName>${escapeXml(data.buyerCity || '')}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.buyerPostalCode || '')}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${buyerCountryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${data.buyerTaxNumber ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.buyerTaxNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.buyerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  ${data.paymentMethod ? `<!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${data.paymentMethod === 'cash' ? '10' : data.paymentMethod === 'transfer' ? '42' : '30'}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>` : ''}

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${fmt(data.taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${fmt(data.subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${fmt(data.taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${fmt(data.taxRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Tax Total in Tax Currency -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${fmt(data.taxAmount)}</cbc:TaxAmount>
  </cac:TaxTotal>

  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${fmt(data.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${fmt(data.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${fmt(data.total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${fmt(data.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice Lines -->
${data.items.map((item, index) => `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${item.unitCode || 'PCE'}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${fmt(item.unitPrice * item.quantity)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${fmt(item.taxAmount)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="${currency}">${fmt(item.total)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${fmt(item.taxRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${fmt(item.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('\n')}

</Invoice>`;

  return xml;
}

/**
 * Generate invoice hash (SHA-256) for ZATCA Phase 2
 * Uses the XML content to create a cryptographic hash
 */
export async function generateInvoiceHash(xmlContent: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(xmlContent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate Base64-encoded hash for ZATCA QR code (Tag 8 - Phase 2)
 */
export async function generateInvoiceHashBase64(xmlContent: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(xmlContent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

/**
 * Download XML invoice as file
 */
export function downloadXMLInvoice(xmlContent: string, fileName: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate UUID v4 for invoice identification
 */
export function generateInvoiceUUID(): string {
  return crypto.randomUUID();
}
