/**
 * ZATCA Phase 2 Certificate & DER Encoding Utilities
 * 
 * Builds a self-signed X.509 v3 certificate using Web Crypto ECDSA P-256
 * for proper ZATCA QR Tag 8 compliance.
 * 
 * Tag 7: ECDSA signature in DER/ASN.1 format
 * Tag 8: X.509 Certificate (DER encoded)
 * Tag 9: Certificate signature extracted from X.509
 */

// ─── ASN.1 DER Encoding Helpers ───

function encodeLength(length: number): number[] {
  if (length < 128) return [length];
  if (length < 256) return [0x81, length];
  return [0x82, (length >> 8) & 0xFF, length & 0xFF];
}

function encodeSequence(content: number[]): number[] {
  return [0x30, ...encodeLength(content.length), ...content];
}

function encodeSet(content: number[]): number[] {
  return [0x31, ...encodeLength(content.length), ...content];
}

function encodeOID(oid: number[]): number[] {
  // Encode OID value bytes (already pre-encoded)
  return [0x06, ...encodeLength(oid.length), ...oid];
}

function encodeInteger(value: Uint8Array | number[]): number[] {
  const bytes = value instanceof Uint8Array ? Array.from(value) : value;
  // Remove leading zeros but keep at least one byte
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const trimmed = bytes.slice(start);
  // Add padding if high bit is set (to keep positive)
  const needsPad = trimmed[0] >= 0x80;
  const content = needsPad ? [0x00, ...trimmed] : trimmed;
  return [0x02, ...encodeLength(content.length), ...content];
}

function encodeIntegerFromNumber(n: number): number[] {
  if (n < 128) return [0x02, 0x01, n];
  if (n < 32768) return [0x02, 0x02, (n >> 8) & 0xFF, n & 0xFF];
  return [0x02, 0x04, (n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

function encodeUTF8String(str: string): number[] {
  const encoded = new TextEncoder().encode(str);
  return [0x0C, ...encodeLength(encoded.length), ...Array.from(encoded)];
}

function encodePrintableString(str: string): number[] {
  const bytes = Array.from(str).map(c => c.charCodeAt(0));
  return [0x13, ...encodeLength(bytes.length), ...bytes];
}

function encodeUTCTime(date: Date): number[] {
  const y = date.getUTCFullYear() % 100;
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  const timeStr = `${String(y).padStart(2, '0')}${m}${d}${h}${min}${s}Z`;
  const bytes = Array.from(timeStr).map(c => c.charCodeAt(0));
  return [0x17, ...encodeLength(bytes.length), ...bytes];
}

function encodeBitString(content: number[]): number[] {
  // Bit string with 0 unused bits
  return [0x03, ...encodeLength(content.length + 1), 0x00, ...content];
}

function encodeExplicit(tag: number, content: number[]): number[] {
  return [0xA0 | tag, ...encodeLength(content.length), ...content];
}

function encodeOctetString(content: number[]): number[] {
  return [0x04, ...encodeLength(content.length), ...content];
}

// ─── OID Constants ───

// ecdsaWithSHA256 (1.2.840.10045.4.3.2)
const OID_ECDSA_SHA256 = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x04, 0x03, 0x02];
// id-ecPublicKey (1.2.840.10045.2.1)
const OID_EC_PUBLIC_KEY = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01];
// prime256v1 / P-256 (1.2.840.10045.3.1.7)
const OID_PRIME256V1 = [0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07];
// commonName (2.5.4.3)
const OID_COMMON_NAME = [0x55, 0x04, 0x03];
// organizationName (2.5.4.10)
const OID_ORG_NAME = [0x55, 0x04, 0x0A];
// countryName (2.5.4.6)
const OID_COUNTRY = [0x55, 0x04, 0x06];
// serialNumber (2.5.4.5) - used for VAT number in ZATCA
const OID_SERIAL_NUMBER = [0x55, 0x04, 0x05];

// ─── Public API ───

/**
 * Convert raw ECDSA P1363 signature (64 bytes) to DER/ASN.1 format
 */
export function rawSignatureToDER(rawSignature: Uint8Array): Uint8Array {
  const r = rawSignature.slice(0, 32);
  const s = rawSignature.slice(32, 64);
  const rDer = encodeInteger(r);
  const sDer = encodeInteger(s);
  const seq = encodeSequence([...rDer, ...sDer]);
  return new Uint8Array(seq);
}

/**
 * Build a self-signed X.509 v3 certificate for ZATCA Phase 2 QR.
 * Uses the provided ECDSA P-256 key pair.
 * 
 * Returns { certificateDER, certificateSignature }
 */
export async function buildSelfSignedCertificate(
  keyPair: CryptoKeyPair,
  publicKeyRaw: Uint8Array,
  sellerName: string,
  vatNumber: string,
): Promise<{ certificateDER: Uint8Array; certificateSignature: Uint8Array }> {

  // Export public key as SPKI for proper SubjectPublicKeyInfo
  const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const spkiBytes = Array.from(new Uint8Array(spkiBuffer));

  // Build TBSCertificate
  const now = new Date();
  const notAfter = new Date(now);
  notAfter.setFullYear(notAfter.getFullYear() + 5);

  // Serial number (random 8 bytes)
  const serialBytes = crypto.getRandomValues(new Uint8Array(8));
  // Ensure positive
  serialBytes[0] &= 0x7F;
  if (serialBytes[0] === 0) serialBytes[0] = 0x01;

  // Signature algorithm: ecdsaWithSHA256
  const signatureAlgorithm = encodeSequence([
    ...encodeOID(OID_ECDSA_SHA256),
  ]);

  // Issuer/Subject: CN=sellerName, O=sellerName, C=SA, SERIALNUMBER=vatNumber
  const rdnCN = encodeSet(encodeSequence([
    ...encodeOID(OID_COMMON_NAME),
    ...encodeUTF8String(sellerName),
  ]));
  const rdnOrg = encodeSet(encodeSequence([
    ...encodeOID(OID_ORG_NAME),
    ...encodeUTF8String(sellerName),
  ]));
  const rdnCountry = encodeSet(encodeSequence([
    ...encodeOID(OID_COUNTRY),
    ...encodePrintableString('SA'),
  ]));
  const rdnSerial = encodeSet(encodeSequence([
    ...encodeOID(OID_SERIAL_NUMBER),
    ...encodePrintableString(vatNumber),
  ]));

  const distinguishedName = encodeSequence([
    ...rdnCountry,
    ...rdnOrg,
    ...rdnCN,
    ...rdnSerial,
  ]);

  // Validity
  const validity = encodeSequence([
    ...encodeUTCTime(now),
    ...encodeUTCTime(notAfter),
  ]);

  // TBSCertificate
  const tbsCertificate = encodeSequence([
    // Version: v3 (2)
    ...encodeExplicit(0, encodeIntegerFromNumber(2)),
    // Serial Number
    ...encodeInteger(serialBytes),
    // Signature Algorithm
    ...signatureAlgorithm,
    // Issuer
    ...distinguishedName,
    // Validity
    ...validity,
    // Subject (same as issuer for self-signed)
    ...distinguishedName,
    // SubjectPublicKeyInfo (from SPKI export)
    ...spkiBytes,
  ]);

  const tbsBytes = new Uint8Array(tbsCertificate);

  // Sign the TBSCertificate
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    tbsBytes,
  );
  const rawSig = new Uint8Array(signatureBuffer);

  // Convert signature to DER format
  const derSignature = rawSignatureToDER(rawSig);

  // Build full Certificate
  const certificate = encodeSequence([
    ...tbsCertificate,
    // Signature Algorithm
    ...signatureAlgorithm,
    // Signature Value (BIT STRING)
    ...encodeBitString(Array.from(derSignature)),
  ]);

  const certificateDER = new Uint8Array(certificate);

  return {
    certificateDER,
    certificateSignature: derSignature,
  };
}

// ─── Cache ───
let cachedCertDER: Uint8Array | null = null;
let cachedCertSig: Uint8Array | null = null;
let cachedForKey: string | null = null;

/**
 * Get or create a cached self-signed certificate for the session.
 */
export async function getOrCreateCertificate(
  keyPair: CryptoKeyPair,
  publicKeyRaw: Uint8Array,
  sellerName: string,
  vatNumber: string,
): Promise<{ certificateDER: Uint8Array; certificateSignature: Uint8Array }> {
  const cacheKey = `${sellerName}|${vatNumber}`;
  if (cachedCertDER && cachedCertSig && cachedForKey === cacheKey) {
    return { certificateDER: cachedCertDER, certificateSignature: cachedCertSig };
  }

  const result = await buildSelfSignedCertificate(keyPair, publicKeyRaw, sellerName, vatNumber);
  cachedCertDER = result.certificateDER;
  cachedCertSig = result.certificateSignature;
  cachedForKey = cacheKey;
  return result;
}
