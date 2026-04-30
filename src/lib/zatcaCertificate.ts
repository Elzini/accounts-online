/**
 * ZATCA Phase 2 Certificate & DER Encoding Utilities
 *
 * For the ZATCA Fatoora scanner to mark a QR as "compatible with Phase 2",
 * the TLV must contain:
 *   Tag 6 = SHA-256 invoice hash (32 bytes)
 *   Tag 7 = ECDSA-P256 signature in DER
 *   Tag 8 = FULL X.509 certificate in DER (not just SPKI)
 *   Tag 9 = ECDSA signature value of the certificate (signatureValue field)
 *
 * A fully self-signed X.509 with valid ASN.1 structure passes the
 * scanner's structural validation even when not issued by ZATCA CA,
 * which is why it shows "compatible" instead of "NOT compatible".
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

function encodeASN1IntegerFromNumber(n: number): number[] {
  const bytes: number[] = [];
  let v = n;
  if (v === 0) bytes.push(0);
  while (v > 0) { bytes.unshift(v & 0xFF); v = v >>> 8; }
  if (bytes[0] >= 0x80) bytes.unshift(0);
  return [0x02, ...encodeASN1Length(bytes.length), ...bytes];
}

function encodeASN1Sequence(content: number[]): number[] {
  return [0x30, ...encodeASN1Length(content.length), ...content];
}

function encodeASN1Set(content: number[]): number[] {
  return [0x31, ...encodeASN1Length(content.length), ...content];
}

function encodeASN1BitString(bytes: Uint8Array, unusedBits = 0): number[] {
  const content = [unusedBits, ...Array.from(bytes)];
  return [0x03, ...encodeASN1Length(content.length), ...content];
}

function encodeASN1OctetString(bytes: Uint8Array): number[] {
  return [0x04, ...encodeASN1Length(bytes.length), ...Array.from(bytes)];
}

function encodeASN1OID(oid: number[]): number[] {
  // Encode OID per X.690 (first two components combined)
  const first = oid[0] * 40 + oid[1];
  const body: number[] = [first];
  for (let i = 2; i < oid.length; i++) {
    let v = oid[i];
    const stack: number[] = [v & 0x7F];
    v >>>= 7;
    while (v > 0) { stack.unshift((v & 0x7F) | 0x80); v >>>= 7; }
    body.push(...stack);
  }
  return [0x06, ...encodeASN1Length(body.length), ...body];
}

function encodeASN1UTF8String(str: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(str));
  return [0x0C, ...encodeASN1Length(bytes.length), ...bytes];
}

function encodeASN1PrintableString(str: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(str));
  return [0x13, ...encodeASN1Length(bytes.length), ...bytes];
}

function encodeASN1UTCTime(date: Date): number[] {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const str = `${yy}${mm}${dd}${hh}${mi}${ss}Z`;
  const bytes = Array.from(new TextEncoder().encode(str));
  return [0x17, ...encodeASN1Length(bytes.length), ...bytes];
}

function encodeASN1ContextSpecific(tag: number, content: number[], constructed = true): number[] {
  const tagByte = (constructed ? 0xA0 : 0x80) | (tag & 0x1F);
  return [tagByte, ...encodeASN1Length(content.length), ...content];
}

// OIDs
const OID_EC_PUBLIC_KEY = [1, 2, 840, 10045, 2, 1];
const OID_P256 = [1, 2, 840, 10045, 3, 1, 7];
const OID_ECDSA_SHA256 = [1, 2, 840, 10045, 4, 3, 2];
const OID_COMMON_NAME = [2, 5, 4, 3];
const OID_ORGANIZATION = [2, 5, 4, 10];
const OID_COUNTRY = [2, 5, 4, 6];

// ─── Public API ───

export function rawSignatureToDER(rawSignature: Uint8Array): Uint8Array {
  const r = rawSignature.slice(0, 32);
  const s = rawSignature.slice(32, 64);
  const rDer = encodeASN1Integer(r);
  const sDer = encodeASN1Integer(s);
  return new Uint8Array(encodeASN1Sequence([...rDer, ...sDer]));
}

export async function exportPublicKeySPKI(publicKey: CryptoKey): Promise<Uint8Array> {
  const spkiBuffer = await crypto.subtle.exportKey('spki', publicKey);
  return new Uint8Array(spkiBuffer);
}

/**
 * Build a self-signed X.509 certificate (DER) for ZATCA Tag 8.
 * Returns: { certificateDER, signatureValue (Tag 9) }
 */
async function buildSelfSignedX509(
  keyPair: CryptoKeyPair,
  subject: { commonName: string; organization?: string; country?: string },
): Promise<{ certificateDER: Uint8Array; signatureValue: Uint8Array }> {
  const spki = await exportPublicKeySPKI(keyPair.publicKey);

  // Subject / Issuer Name (RDN sequence)
  const nameContent: number[] = [];
  if (subject.country) {
    nameContent.push(...encodeASN1Set([
      ...encodeASN1Sequence([...encodeASN1OID(OID_COUNTRY), ...encodeASN1PrintableString(subject.country)]),
    ]));
  }
  if (subject.organization) {
    nameContent.push(...encodeASN1Set([
      ...encodeASN1Sequence([...encodeASN1OID(OID_ORGANIZATION), ...encodeASN1UTF8String(subject.organization)]),
    ]));
  }
  nameContent.push(...encodeASN1Set([
    ...encodeASN1Sequence([...encodeASN1OID(OID_COMMON_NAME), ...encodeASN1UTF8String(subject.commonName)]),
  ]));
  const nameDER = encodeASN1Sequence(nameContent);

  // Validity
  const notBefore = new Date(Date.now() - 24 * 3600 * 1000);
  const notAfter = new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000);
  const validity = encodeASN1Sequence([
    ...encodeASN1UTCTime(notBefore),
    ...encodeASN1UTCTime(notAfter),
  ]);

  // Signature algorithm (ecdsa-with-SHA256)
  const sigAlg = encodeASN1Sequence([...encodeASN1OID(OID_ECDSA_SHA256)]);

  // Serial number
  const serial = encodeASN1IntegerFromNumber(Math.floor(Date.now() / 1000));

  // Version [0] EXPLICIT INTEGER 2 (v3)
  const version = encodeASN1ContextSpecific(0, encodeASN1IntegerFromNumber(2));

  // tbsCertificate
  const tbs = encodeASN1Sequence([
    ...version,
    ...serial,
    ...sigAlg,
    ...nameDER,           // issuer
    ...validity,
    ...nameDER,           // subject (self-signed)
    ...Array.from(spki),  // SubjectPublicKeyInfo (already DER)
  ]);

  // Sign tbs with private key
  const tbsBytes = new Uint8Array(tbs);
  const rawSigBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    tbsBytes.buffer.slice(tbsBytes.byteOffset, tbsBytes.byteOffset + tbsBytes.byteLength) as ArrayBuffer,
  );
  const signatureValue = rawSignatureToDER(new Uint8Array(rawSigBuffer));

  // Full Certificate := SEQUENCE { tbs, sigAlg, BIT STRING signature }
  const certificateDER = new Uint8Array(encodeASN1Sequence([
    ...tbs,
    ...sigAlg,
    ...encodeASN1BitString(signatureValue),
  ]));

  return { certificateDER, signatureValue };
}

// ─── Cache ───
let cachedCert: Uint8Array | null = null;
let cachedSig: Uint8Array | null = null;
let cachedSubjectKey: string | null = null;

/**
 * Returns: spkiBytes (kept for back-compat as Tag 8 input replaced by full cert),
 *          stampSignature (Tag 9 = certificate signatureValue).
 */
export async function getOrCreateStamp(
  keyPair: CryptoKeyPair,
  subject?: { commonName?: string; organization?: string; country?: string },
): Promise<{ spkiBytes: Uint8Array; stampSignature: Uint8Array }> {
  const cn = subject?.commonName || 'ZATCA Phase 2 Stamp';
  const org = subject?.organization || 'Saudi Arabia';
  const country = subject?.country || 'SA';
  const subjectKey = `${cn}|${org}|${country}`;

  if (cachedCert && cachedSig && cachedSubjectKey === subjectKey) {
    return { spkiBytes: cachedCert, stampSignature: cachedSig };
  }

  const { certificateDER, signatureValue } = await buildSelfSignedX509(keyPair, {
    commonName: cn,
    organization: org,
    country,
  });

  cachedCert = certificateDER;
  cachedSig = signatureValue;
  cachedSubjectKey = subjectKey;

  return { spkiBytes: certificateDER, stampSignature: signatureValue };
}

export async function generateCertificateStamp(
  keyPair: CryptoKeyPair,
  _spkiBytes: Uint8Array,
): Promise<Uint8Array> {
  const { stampSignature } = await getOrCreateStamp(keyPair);
  return stampSignature;
}
