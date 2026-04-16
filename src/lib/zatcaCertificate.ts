/**
 * ZATCA Phase 2 Certificate & DER Encoding Utilities
 * 
 * Tag 7: ECDSA signature in DER/ASN.1 format
 * Tag 8: Public key in SubjectPublicKeyInfo (SPKI) DER format
 * Tag 9: Certificate signature (self-signed stamp)
 */

// ─── ASN.1 DER Helpers ───

function encodeASN1Length(length: number): number[] {
  if (length < 128) return [length];
  if (length < 256) return [0x81, length];
  return [0x82, (length >> 8) & 0xFF, length & 0xFF];
}

function encodeASN1Integer(bytes: Uint8Array): number[] {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const trimmed = Array.from(bytes.slice(start));
  const needsPad = trimmed[0] >= 0x80;
  const content = needsPad ? [0x00, ...trimmed] : trimmed;
  return [0x02, ...encodeASN1Length(content.length), ...content];
}

function encodeASN1Sequence(content: number[]): number[] {
  return [0x30, ...encodeASN1Length(content.length), ...content];
}

// ─── Public API ───

/**
 * Convert raw ECDSA P1363 signature (64 bytes for P-256) to DER/ASN.1 format.
 * ZATCA requires DER-encoded ECDSA signatures for Tag 7.
 */
export function rawSignatureToDER(rawSignature: Uint8Array): Uint8Array {
  const r = rawSignature.slice(0, 32);
  const s = rawSignature.slice(32, 64);
  const rDer = encodeASN1Integer(r);
  const sDer = encodeASN1Integer(s);
  const seq = encodeASN1Sequence([...rDer, ...sDer]);
  return new Uint8Array(seq);
}

/**
 * Export public key as SubjectPublicKeyInfo (SPKI) DER format.
 * This is the correct format for ZATCA Tag 8.
 * ~91 bytes for ECDSA P-256.
 */
export async function exportPublicKeySPKI(publicKey: CryptoKey): Promise<Uint8Array> {
  const spkiBuffer = await crypto.subtle.exportKey('spki', publicKey);
  return new Uint8Array(spkiBuffer);
}

/**
 * Generate a certificate stamp signature for Tag 9.
 * Signs the SPKI public key bytes with the private key (self-signed stamp).
 * Returns DER-encoded ECDSA signature.
 */
export async function generateCertificateStamp(
  keyPair: CryptoKeyPair,
  spkiBytes: Uint8Array,
): Promise<Uint8Array> {
  const rawSigBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    spkiBytes.buffer as ArrayBuffer,
  );
  return rawSignatureToDER(new Uint8Array(rawSigBuffer));
}

// ─── Cache ───
let cachedSPKI: Uint8Array | null = null;
let cachedStamp: Uint8Array | null = null;

/**
 * Get cached SPKI + stamp or generate new ones.
 */
export async function getOrCreateStamp(
  keyPair: CryptoKeyPair,
): Promise<{ spkiBytes: Uint8Array; stampSignature: Uint8Array }> {
  if (cachedSPKI && cachedStamp) {
    return { spkiBytes: cachedSPKI, stampSignature: cachedStamp };
  }

  const spkiBytes = await exportPublicKeySPKI(keyPair.publicKey);
  const stampSignature = await generateCertificateStamp(keyPair, spkiBytes);

  cachedSPKI = spkiBytes;
  cachedStamp = stampSignature;

  return { spkiBytes, stampSignature };
}
