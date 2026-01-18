/**
 * ZATCA TLV Encoding for QR Code
 * According to ZATCA e-invoicing requirements
 * 
 * Tags:
 * 1 - Seller Name
 * 2 - VAT Registration Number
 * 3 - Invoice Date/Time (ISO 8601)
 * 4 - Invoice Total (with VAT)
 * 5 - VAT Amount
 */

interface ZatcaQRData {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string; // ISO 8601 format
  invoiceTotal: number;
  vatAmount: number;
}

/**
 * Encode a single TLV field
 * Tag (1 byte) + Length (1 byte) + Value (n bytes)
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;
  
  const result = new Uint8Array(2 + length);
  result[0] = tag;
  result[1] = length;
  result.set(valueBytes, 2);
  
  return result;
}

/**
 * Combine multiple TLV fields into a single byte array
 */
function combineTLV(fields: Uint8Array[]): Uint8Array {
  const totalLength = fields.reduce((acc, field) => acc + field.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const field of fields) {
    result.set(field, offset);
    offset += field.length;
  }
  
  return result;
}

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generate ZATCA-compliant QR code data (Base64 encoded TLV)
 */
export function generateZatcaQRData(data: ZatcaQRData): string {
  const fields = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatNumber),
    encodeTLV(3, data.invoiceDateTime),
    encodeTLV(4, data.invoiceTotal.toFixed(2)),
    encodeTLV(5, data.vatAmount.toFixed(2)),
  ];
  
  const combined = combineTLV(fields);
  return uint8ArrayToBase64(combined);
}

/**
 * Format date to ISO 8601 format for ZATCA
 */
export function formatDateTimeISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}
