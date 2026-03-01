import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { secp256k1 } from "npm:@noble/curves@1.4.0/secp256k1";
import { sha256 } from "npm:@noble/hashes@1.4.0/sha256";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ===== ASN.1 DER Encoding Helpers =====
function encodeLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len]);
  if (len < 0x100) return new Uint8Array([0x81, len]);
  return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function encodeTLV(tag: number, value: Uint8Array): Uint8Array {
  const lenBytes = encodeLength(value.length);
  const result = new Uint8Array(1 + lenBytes.length + value.length);
  result[0] = tag;
  result.set(lenBytes, 1);
  result.set(value, 1 + lenBytes.length);
  return result;
}

function encodeSequence(...items: Uint8Array[]): Uint8Array {
  const content = concatBytes(...items);
  return encodeTLV(0x30, content);
}

function encodeSet(...items: Uint8Array[]): Uint8Array {
  const content = concatBytes(...items);
  return encodeTLV(0x31, content);
}

function encodeInteger(value: number): Uint8Array {
  if (value === 0) return encodeTLV(0x02, new Uint8Array([0]));
  const bytes: number[] = [];
  let v = value;
  while (v > 0) { bytes.unshift(v & 0xff); v >>= 8; }
  if (bytes[0] & 0x80) bytes.unshift(0);
  return encodeTLV(0x02, new Uint8Array(bytes));
}

function encodeOID(oid: string): Uint8Array {
  const parts = oid.split('.').map(Number);
  const bytes: number[] = [40 * parts[0] + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i];
    if (v < 128) { bytes.push(v); }
    else {
      const enc: number[] = [];
      enc.push(v & 0x7f); v >>= 7;
      while (v > 0) { enc.push((v & 0x7f) | 0x80); v >>= 7; }
      bytes.push(...enc.reverse());
    }
  }
  return encodeTLV(0x06, new Uint8Array(bytes));
}

function encodeUTF8String(s: string): Uint8Array {
  return encodeTLV(0x0c, new TextEncoder().encode(s));
}

function encodePrintableString(s: string): Uint8Array {
  return encodeTLV(0x13, new TextEncoder().encode(s));
}

function encodeBitString(data: Uint8Array): Uint8Array {
  const content = new Uint8Array(1 + data.length);
  content[0] = 0; // unused bits
  content.set(data, 1);
  return encodeTLV(0x03, content);
}

function encodeOctetString(data: Uint8Array): Uint8Array {
  return encodeTLV(0x04, data);
}

function encodeContextExplicit(tag: number, data: Uint8Array): Uint8Array {
  return encodeTLV(0xa0 | tag, data);
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

// OIDs
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const OID_SECP256K1 = '1.3.132.0.10';
const OID_ECDSA_SHA256 = '1.2.840.10045.4.3.2';
const OID_EXTENSION_REQUEST = '1.2.840.113549.1.9.14';
const OID_CERT_TEMPLATE_NAME = '1.3.6.1.4.1.311.20.2';
const OID_SAN = '2.5.29.17';

const OID_CN = '2.5.4.3';
const OID_C = '2.5.4.6';
const OID_O = '2.5.4.10';
const OID_OU = '2.5.4.11';
const OID_SN = '2.5.4.5';
const OID_UID = '0.9.2342.19200300.100.1.1';
const OID_TITLE = '2.5.4.12';
const OID_REG_ADDR = '2.5.4.26';
const OID_BIZ_CAT = '2.5.4.15';

function encodeRDN(oid: string, value: string): Uint8Array {
  return encodeSet(encodeSequence(encodeOID(oid), encodeUTF8String(value)));
}

interface CSRInput {
  commonName: string;
  organizationName: string;
  organizationUnit: string;
  country: string;
  serialNumber: string;
  vatNumber: string;
  invoiceType: string;
  location: string;
  industry: string;
  csrType: 'sandbox' | 'simulation' | 'production';
}

function buildCSR(input: CSRInput): { csrBase64: string; privateKeyPEM: string; publicKeyPEM: string } {
  // Generate secp256k1 key pair
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed

  // Build Subject DN
  const subject = encodeSequence(
    encodeRDN(OID_C, input.country),
    encodeRDN(OID_OU, input.organizationUnit || input.commonName),
    encodeRDN(OID_O, input.organizationName || input.commonName),
    encodeRDN(OID_CN, input.commonName),
  );

  // Build SubjectPublicKeyInfo
  const spki = encodeSequence(
    encodeSequence(encodeOID(OID_EC_PUBLIC_KEY), encodeOID(OID_SECP256K1)),
    encodeBitString(publicKey),
  );

  // Build SAN extension with directoryName
  const sanDirName = encodeSequence(
    encodeRDN(OID_SN, input.serialNumber),
    encodeRDN(OID_UID, input.vatNumber),
    encodeRDN(OID_TITLE, input.invoiceType),
    encodeRDN(OID_REG_ADDR, input.location || 'Riyadh'),
    encodeRDN(OID_BIZ_CAT, input.industry || 'Industry'),
  );

  // Wrap in [4] EXPLICIT (directoryName)
  const sanValue = encodeSequence(encodeContextExplicit(4, sanDirName));

  // CertificateTemplateName extension
  const certTemplateExt = encodeSequence(
    encodeOID(OID_CERT_TEMPLATE_NAME),
    encodeOctetString(encodePrintableString('ZATCA-Code-Signing')),
  );

  // SAN extension
  const sanExt = encodeSequence(
    encodeOID(OID_SAN),
    encodeOctetString(sanValue),
  );

  // Extensions
  const extensions = encodeSequence(certTemplateExt, sanExt);

  // Extension request attribute
  const extensionRequest = encodeSequence(
    encodeOID(OID_EXTENSION_REQUEST),
    encodeSet(extensions),
  );

  // Attributes [0] EXPLICIT
  const attributes = encodeContextExplicit(0, extensionRequest);

  // CertificationRequestInfo
  const certReqInfo = encodeSequence(
    encodeInteger(0), // version
    subject,
    spki,
    attributes,
  );

  // Sign the CertificationRequestInfo with SHA-256
  const hash = sha256(certReqInfo);
  const signature = secp256k1.sign(hash, privateKey);
  const sigDER = signature.toDERRawBytes();

  // Build full CSR
  const signatureAlgorithm = encodeSequence(encodeOID(OID_ECDSA_SHA256));
  const csr = encodeSequence(certReqInfo, signatureAlgorithm, encodeBitString(sigDER));

  // Encode to Base64
  const csrBase64 = btoa(String.fromCharCode(...csr));

  // Export private key as PEM (SEC1/DER format wrapped in PKCS#8)
  const privKeyBytes = privateKey;
  const privKeyBase64 = btoa(String.fromCharCode(...privKeyBytes));
  const privKeyPEMLines = privKeyBase64.match(/.{1,64}/g) || [];
  const privateKeyPEM = `-----BEGIN EC PRIVATE KEY-----\n${privKeyPEMLines.join('\n')}\n-----END EC PRIVATE KEY-----`;

  // Export public key 
  const pubKeyBase64 = btoa(String.fromCharCode(...publicKey));
  const pubKeyPEMLines = pubKeyBase64.match(/.{1,64}/g) || [];
  const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${pubKeyPEMLines.join('\n')}\n-----END PUBLIC KEY-----`;

  return { csrBase64, privateKeyPEM, publicKeyPEM };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CSRInput = await req.json();

    console.log('Generating CSR for:', body.commonName, 'env:', body.csrType);

    const result = buildCSR(body);

    console.log('CSR generated successfully, base64 length:', result.csrBase64.length);

    return new Response(JSON.stringify({
      success: true,
      csrBase64: result.csrBase64,
      privateKeyPEM: result.privateKeyPEM,
      publicKeyPEM: result.publicKeyPEM,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('CSR generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
