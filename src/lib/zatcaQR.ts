/**
 * ZATCA TLV Encoding for QR Code
 * According to ZATCA e-invoicing requirements (Phase 1 & 2)
 * 
 * Phase 1 Tags (1-5):
 * 1 - Seller Name (UTF-8)
 * 2 - VAT Registration Number (15 digits starting with 3)
 * 3 - Invoice Date/Time (format: yyyy-MM-ddTHH:mm:ssZ)
 * 4 - Invoice Total with VAT (decimal with 2 places)
 * 5 - VAT Amount (decimal with 2 places)
 * 
 * Phase 2 Tags (6-9):
 * 6 - Invoice Hash (SHA-256)
 * 7 - ECDSA Signature
 * 8 - ECDSA Public Key
 * 9 - Certificate Signature
 */

export interface ZatcaQRData {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string; // ISO 8601 format or Date string
  invoiceTotal: number;
  vatAmount: number;
  // Phase 2 fields (optional)
  invoiceHash?: string;       // Tag 6: SHA-256 hash of the invoice
  ecdsaSignature?: string;    // Tag 7: ECDSA digital signature
  ecdsaPublicKey?: string;    // Tag 8: ECDSA public key
  certificateSignature?: string; // Tag 9: Certificate signature
}

/**
 * Encode a single TLV field
 * Tag (1 byte) + Length (1 byte) + Value (n bytes)
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;
  
  // Check if length fits in 1 byte (max 255)
  if (length > 255) {
    throw new Error(`TLV value too long for tag ${tag}: ${length} bytes`);
  }
  
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
 * Format number to ZATCA-compliant decimal string (2 decimal places)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date to ZATCA-compliant format: yyyy-MM-ddTHH:mm:ssZ
 */
export function formatDateTimeForZatca(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Format as: 2024-01-15T14:30:00Z
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

/**
 * Validate VAT number format (Saudi: 15 digits starting with 3)
 */
function validateVatNumber(vatNumber: string): boolean {
  if (!vatNumber) return false;
  // Saudi VAT number: 15 digits, starts with 3
  const cleaned = vatNumber.replace(/\D/g, '');
  return cleaned.length === 15 && cleaned.startsWith('3');
}

/**
 * Generate ZATCA-compliant QR code data (Base64 encoded TLV)
 * Phase 1: Contains Tags 1-5
 * Phase 2: Contains Tags 1-9 (when hash/signature data is provided)
 */
export function generateZatcaQRData(data: ZatcaQRData): string {
  // Validate required fields
  if (!data.sellerName || data.sellerName.trim() === '') {
    console.warn('ZATCA QR: Seller name is required');
  }
  
  if (!validateVatNumber(data.vatNumber)) {
    console.warn('ZATCA QR: VAT number must be 15 digits starting with 3');
  }
  
  // Clean and format VAT number (remove any non-digits)
  const cleanVatNumber = data.vatNumber ? data.vatNumber.replace(/\D/g, '') : '';
  
  // Format date/time
  const formattedDateTime = formatDateTimeForZatca(data.invoiceDateTime);
  
  // Build TLV fields in order (Tags 1-5, mandatory)
  const fields = [
    encodeTLV(1, data.sellerName.trim()),
    encodeTLV(2, cleanVatNumber),
    encodeTLV(3, formattedDateTime),
    encodeTLV(4, formatAmount(data.invoiceTotal)),
    encodeTLV(5, formatAmount(data.vatAmount)),
  ];
  
  // Phase 2 Tags (6-9, optional)
  if (data.invoiceHash) {
    fields.push(encodeTLV(6, data.invoiceHash));
  }
  if (data.ecdsaSignature) {
    fields.push(encodeTLV(7, data.ecdsaSignature));
  }
  if (data.ecdsaPublicKey) {
    fields.push(encodeTLV(8, data.ecdsaPublicKey));
  }
  if (data.certificateSignature) {
    fields.push(encodeTLV(9, data.certificateSignature));
  }
  
  const combined = combineTLV(fields);
  return uint8ArrayToBase64(combined);
}

/**
 * Generate SHA-256 hash of invoice data for QR code Tag 6
 */
export async function generateInvoiceQRHash(invoiceData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(invoiceData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

/**
 * @deprecated Use formatDateTimeForZatca instead
 */
export function formatDateTimeISO(date: Date | string): string {
  return formatDateTimeForZatca(date);
}

/**
 * Decode ZATCA QR data for verification (utility function)
 */
export function decodeZatcaQRData(base64Data: string): ZatcaQRData | null {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const decoder = new TextDecoder();
    const result: Partial<ZatcaQRData> = {};
    
    let offset = 0;
    while (offset < bytes.length) {
      const tag = bytes[offset];
      const length = bytes[offset + 1];
      const value = decoder.decode(bytes.slice(offset + 2, offset + 2 + length));
      
      switch (tag) {
        case 1:
          result.sellerName = value;
          break;
        case 2:
          result.vatNumber = value;
          break;
        case 3:
          result.invoiceDateTime = value;
          break;
        case 4:
          result.invoiceTotal = parseFloat(value);
          break;
        case 5:
          result.vatAmount = parseFloat(value);
          break;
      }
      
      offset += 2 + length;
    }
    
    return result as ZatcaQRData;
  } catch (error) {
    console.error('Failed to decode ZATCA QR data:', error);
    return null;
  }
}
