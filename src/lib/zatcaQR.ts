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
 * 7 - ECDSA Signature (P-256)
 * 8 - ECDSA Public Key (DER/uncompressed)
 * 9 - Certificate Signature (self-signed stamp)
 */

export interface ZatcaQRData {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string;
  invoiceTotal: number;
  vatAmount: number;
  invoiceHash?: string;
  ecdsaSignature?: string;
  ecdsaPublicKey?: string;
  certificateSignature?: string;
}

function encodeTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;
  if (length > 255) throw new Error(`TLV value too long for tag ${tag}: ${length} bytes`);
  const result = new Uint8Array(2 + length);
  result[0] = tag;
  result[1] = length;
  result.set(valueBytes, 2);
  return result;
}

function encodeTLVBinary(tag: number, valueBytes: Uint8Array): Uint8Array {
  const length = valueBytes.length;
  // ZATCA TLV supports multi-byte length: 1 byte if <256, 2 bytes if >=256
  if (length < 256) {
    const result = new Uint8Array(2 + length);
    result[0] = tag;
    result[1] = length;
    result.set(valueBytes, 2);
    return result;
  } else {
    // 2-byte length encoding for values >= 256 bytes (e.g. X.509 certificate)
    const result = new Uint8Array(4 + length);
    result[0] = tag;
    result[1] = 0x82; // indicates 2-byte length follows
    result[2] = (length >> 8) & 0xFF;
    result[3] = length & 0xFF;
    result.set(valueBytes, 4);
    return result;
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

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

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function formatDateTimeForZatca(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function validateVatNumber(vatNumber: string): boolean {
  if (!vatNumber) return false;
  const cleaned = vatNumber.replace(/\D/g, '');
  return cleaned.length === 15 && cleaned.startsWith('3');
}

export function generateZatcaQRData(data: ZatcaQRData): string {
  if (!data.sellerName || data.sellerName.trim() === '') {
    console.warn('ZATCA QR: Seller name is required');
  }
  if (!validateVatNumber(data.vatNumber)) {
    console.warn('ZATCA QR: VAT number must be 15 digits starting with 3');
  }

  const cleanVatNumber = data.vatNumber ? data.vatNumber.replace(/\D/g, '') : '';
  const formattedDateTime = formatDateTimeForZatca(data.invoiceDateTime);

  const fields = [
    encodeTLV(1, data.sellerName.trim()),
    encodeTLV(2, cleanVatNumber),
    encodeTLV(3, formattedDateTime),
    encodeTLV(4, formatAmount(data.invoiceTotal)),
    encodeTLV(5, formatAmount(data.vatAmount)),
  ];

  if (data.invoiceHash) {
    fields.push(encodeTLVBinary(6, base64ToUint8Array(data.invoiceHash)));
  }
  if (data.ecdsaSignature) {
    fields.push(encodeTLVBinary(7, base64ToUint8Array(data.ecdsaSignature)));
  }
  if (data.ecdsaPublicKey) {
    fields.push(encodeTLVBinary(8, base64ToUint8Array(data.ecdsaPublicKey)));
  }
  if (data.certificateSignature) {
    fields.push(encodeTLVBinary(9, base64ToUint8Array(data.certificateSignature)));
  }

  const combined = combineTLV(fields);
  return uint8ArrayToBase64(combined);
}

export async function generateInvoiceQRHash(invoiceData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(invoiceData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) binary += String.fromCharCode(hashArray[i]);
  return btoa(binary);
}

export function formatDateTimeISO(date: Date | string): string {
  return formatDateTimeForZatca(date);
}

// --- ECDSA P-256 Key Cache (per session) ---
let cachedKeyPair: CryptoKeyPair | null = null;
let cachedPublicKeyBytes: Uint8Array | null = null;

async function getOrCreateKeyPair(): Promise<{ keyPair: CryptoKeyPair; publicKeyBytes: Uint8Array }> {
  if (cachedKeyPair && cachedPublicKeyBytes) {
    return { keyPair: cachedKeyPair, publicKeyBytes: cachedPublicKeyBytes };
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify']
  );

  // Export public key as raw (uncompressed point: 04 || x || y = 65 bytes)
  const rawKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBytes = new Uint8Array(rawKey);

  cachedKeyPair = keyPair;
  cachedPublicKeyBytes = publicKeyBytes;

  return { keyPair, publicKeyBytes };
}

/**
 * Generate Phase 2 compliant ZATCA QR data with real ECDSA-P256 signatures.
 * Uses Web Crypto API for proper cryptographic signing.
 * 
 * Note: For full ZATCA production compliance, Tags 8-9 should contain
 * a certificate issued by ZATCA CA, not a self-generated key.
 * This implementation creates valid ECDSA signatures that satisfy
 * the TLV structure and cryptographic requirements.
 */
export async function generateZatcaQRDataPhase2(
  data: Omit<ZatcaQRData, 'invoiceHash' | 'ecdsaSignature' | 'ecdsaPublicKey' | 'certificateSignature'> & { invoiceNumber?: string }
): Promise<string> {
  const { rawSignatureToDER, getOrCreateCertificate } = await import('@/lib/zatcaCertificate');

  const cleanVat = data.vatNumber.replace(/\D/g, '');
  const formattedDate = formatDateTimeForZatca(data.invoiceDateTime);

  // Build canonical invoice string for hashing
  const canonicalData = [
    data.sellerName.trim(),
    cleanVat,
    formattedDate,
    formatAmount(data.invoiceTotal),
    formatAmount(data.vatAmount),
    data.invoiceNumber || '',
  ].join('|');

  // Tag 6: SHA-256 hash of invoice canonical data
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalData)
  );
  const hashBytes = new Uint8Array(hashBuffer);

  // Get or create ECDSA P-256 key pair
  const { keyPair, publicKeyBytes } = await getOrCreateKeyPair();

  // Tag 7: ECDSA-P256 signature in DER/ASN.1 format (ZATCA compliant)
  const rawSignatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    hashBytes
  );
  const derSignature = rawSignatureToDER(new Uint8Array(rawSignatureBuffer));

  // Tag 8 & 9: Self-signed X.509 certificate (DER) and its signature
  const { certificateDER, certificateSignature } = await getOrCreateCertificate(
    keyPair,
    publicKeyBytes,
    data.sellerName.trim(),
    cleanVat,
  );

  // Build TLV with proper binary tags
  const fields = [
    encodeTLV(1, data.sellerName.trim()),
    encodeTLV(2, cleanVat),
    encodeTLV(3, formattedDate),
    encodeTLV(4, formatAmount(data.invoiceTotal)),
    encodeTLV(5, formatAmount(data.vatAmount)),
    encodeTLVBinary(6, hashBytes),
    encodeTLVBinary(7, derSignature),
    encodeTLVBinary(8, certificateDER),
    encodeTLVBinary(9, certificateSignature),
  ];

  const combined = combineTLV(fields);
  return uint8ArrayToBase64(combined);
}

export function decodeZatcaQRData(base64Data: string): ZatcaQRData | null {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const decoder = new TextDecoder();
    const result: Partial<ZatcaQRData> = {};

    let offset = 0;
    while (offset < bytes.length) {
      const tag = bytes[offset];
      const length = bytes[offset + 1];
      const rawValue = bytes.slice(offset + 2, offset + 2 + length);

      if (tag >= 1 && tag <= 5) {
        const value = decoder.decode(rawValue);
        switch (tag) {
          case 1: result.sellerName = value; break;
          case 2: result.vatNumber = value; break;
          case 3: result.invoiceDateTime = value; break;
          case 4: result.invoiceTotal = parseFloat(value); break;
          case 5: result.vatAmount = parseFloat(value); break;
        }
      } else {
        let binStr = '';
        for (let i = 0; i < rawValue.length; i++) binStr += String.fromCharCode(rawValue[i]);
        const b64Value = btoa(binStr);
        switch (tag) {
          case 6: result.invoiceHash = b64Value; break;
          case 7: result.ecdsaSignature = b64Value; break;
          case 8: result.ecdsaPublicKey = b64Value; break;
          case 9: result.certificateSignature = b64Value; break;
        }
      }

      offset += 2 + length;
    }

    return result as ZatcaQRData;
  } catch (error) {
    console.error('Failed to decode ZATCA QR data:', error);
    return null;
  }
}
