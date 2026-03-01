/**
 * ZATCA CSR (Certificate Signing Request) Generator
 * توليد طلب توقيع الشهادة الرقمية لهيئة الزكاة والضريبة والجمارك
 * 
 * Uses pkijs for proper PKCS#10 ASN.1 DER-encoded CSR generation
 * compliant with ZATCA Phase 2 requirements.
 */

import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';

export interface CSRConfig {
  commonName: string;        // CN
  organizationName: string;  // O
  organizationUnit: string;  // OU
  country: string;           // C (SA)
  serialNumber: string;      // SERIALNUMBER
  vatNumber: string;         // UID
  invoiceType: string;       // title (1100)
  location: string;          // registeredAddress
  industry: string;          // businessCategory
}

export interface CSRResult {
  csrPEM: string;
  privateKeyPEM: string;
  publicKeyPEM: string;
  generatedAt: string;
  config: CSRConfig;
}

export interface SignedInvoiceResult {
  invoiceHash: string;
  invoiceHashBase64: string;
  signatureValue: string;
  publicKeyBase64: string;
  signingTime: string;
}

// OID constants
const OID_COMMON_NAME = '2.5.4.3';
const OID_COUNTRY = '2.5.4.6';
const OID_ORGANIZATION = '2.5.4.10';
const OID_ORG_UNIT = '2.5.4.11';
const OID_SERIAL_NUMBER = '2.5.4.5';
const OID_UID = '0.9.2342.19200300.100.1.1';
const OID_TITLE = '2.5.4.12';
const OID_REGISTERED_ADDRESS = '2.5.4.26';
const OID_BUSINESS_CATEGORY = '2.5.4.15';
const OID_SAN = '2.5.29.17';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function exportKeyToPEM(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const exported = await crypto.subtle.exportKey(format, key);
  const base64 = arrayBufferToBase64(exported);
  const label = type === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY';
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

/**
 * Generate a real PKCS#10 CSR using pkijs with ZATCA-required fields
 */
export async function generateCSR(config: CSRConfig): Promise<CSRResult> {
  // Set crypto engine for pkijs
  const cryptoEngine = new pkijs.CryptoEngine({
    name: 'webcrypto',
    crypto: crypto,
  });
  pkijs.setEngine('webcrypto', cryptoEngine as any);

  // Generate ECDSA P-256 key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  // Create PKCS#10 CSR
  const pkcs10 = new pkijs.CertificationRequest();
  pkcs10.version = 0;

  // Add subject DN attributes
  const subjectAttrs: Array<{ oid: string; value: string }> = [
    { oid: OID_COUNTRY, value: config.country },
    { oid: OID_ORGANIZATION, value: config.organizationName },
    { oid: OID_ORG_UNIT, value: config.organizationUnit },
    { oid: OID_COMMON_NAME, value: config.commonName },
    { oid: OID_SERIAL_NUMBER, value: config.serialNumber },
    { oid: OID_UID, value: config.vatNumber },
    { oid: OID_TITLE, value: config.invoiceType },
    { oid: OID_REGISTERED_ADDRESS, value: config.location },
    { oid: OID_BUSINESS_CATEGORY, value: config.industry },
  ];

  for (const attr of subjectAttrs) {
    if (!attr.value) continue;
    pkcs10.subject.typesAndValues.push(new pkijs.AttributeTypeAndValue({
      type: attr.oid,
      value: new asn1js.Utf8String({ value: attr.value }),
    }));
  }

  // Build SAN (Subject Alternative Name) extension with DirectoryName
  const sanDirName = new pkijs.GeneralName({
    type: 4, // directoryName
    value: new pkijs.RelativeDistinguishedNames({
      typesAndValues: [
        new pkijs.AttributeTypeAndValue({
          type: OID_UID,
          value: new asn1js.Utf8String({ value: config.vatNumber }),
        }),
        new pkijs.AttributeTypeAndValue({
          type: OID_TITLE,
          value: new asn1js.Utf8String({ value: config.invoiceType }),
        }),
        new pkijs.AttributeTypeAndValue({
          type: OID_REGISTERED_ADDRESS,
          value: new asn1js.Utf8String({ value: config.location }),
        }),
        new pkijs.AttributeTypeAndValue({
          type: OID_BUSINESS_CATEGORY,
          value: new asn1js.Utf8String({ value: config.industry }),
        }),
      ],
    }),
  });

  const sanExtension = new pkijs.Extension({
    extnID: OID_SAN,
    critical: false,
    extnValue: new pkijs.GeneralNames({
      names: [sanDirName],
    }).toSchema().toBER(false),
  });

  // Add extensions as CSR attribute
  pkcs10.attributes = [];
  pkcs10.attributes.push(new pkijs.Attribute({
    type: '1.2.840.113549.1.9.14', // extensionRequest OID
    values: [
      new pkijs.Extensions({
        extensions: [sanExtension],
      }).toSchema(),
    ],
  }));

  // Import public key into CSR
  await pkcs10.subjectPublicKeyInfo.importKey(keyPair.publicKey);

  // Sign the CSR with ECDSA SHA-256
  await pkcs10.sign(keyPair.privateKey, 'SHA-256');

  // Export CSR to DER then to PEM
  const csrDER = pkcs10.toSchema(true).toBER(false);
  const csrBase64 = arrayBufferToBase64(csrDER);
  const csrLines = csrBase64.match(/.{1,64}/g) || [];
  const csrPEM = `-----BEGIN CERTIFICATE REQUEST-----\n${csrLines.join('\n')}\n-----END CERTIFICATE REQUEST-----`;

  // Export keys
  const privateKeyPEM = await exportKeyToPEM(keyPair.privateKey, 'private');
  const publicKeyPEM = await exportKeyToPEM(keyPair.publicKey, 'public');

  return {
    csrPEM,
    privateKeyPEM,
    publicKeyPEM,
    generatedAt: new Date().toISOString(),
    config,
  };
}

/**
 * Sign an invoice using ECDSA private key
 */
export async function signInvoice(
  invoiceContent: string,
  privateKeyPEM: string,
  publicKeyPEM: string
): Promise<SignedInvoiceResult> {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(invoiceContent);

  const hashBuffer = await crypto.subtle.digest('SHA-256', contentBytes);
  const hashArray = new Uint8Array(hashBuffer);

  const invoiceHash = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  let hashBinary = '';
  for (let i = 0; i < hashArray.length; i++) {
    hashBinary += String.fromCharCode(hashArray[i]);
  }
  const invoiceHashBase64 = btoa(hashBinary);

  const privateKeyData = extractPEMContent(privateKeyPEM);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyData);

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    contentBytes
  );

  const signatureValue = arrayBufferToBase64(signature);
  const publicKeyData = extractPEMContent(publicKeyPEM);

  return {
    invoiceHash,
    invoiceHashBase64,
    signatureValue,
    publicKeyBase64: publicKeyData,
    signingTime: new Date().toISOString(),
  };
}

/**
 * Verify an invoice signature
 */
export async function verifyInvoiceSignature(
  invoiceContent: string,
  signatureBase64: string,
  publicKeyPEM: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(invoiceContent);

    const publicKeyData = extractPEMContent(publicKeyPEM);
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyData);

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    const signatureBuffer = base64ToArrayBuffer(signatureBase64);

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBuffer,
      contentBytes
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

function extractPEMContent(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');
}

export function storeCSRData(companyId: string, csrResult: CSRResult): void {
  const key = `zatca_csr_${companyId}`;
  localStorage.setItem(key, JSON.stringify({
    csrPEM: csrResult.csrPEM,
    publicKeyPEM: csrResult.publicKeyPEM,
    generatedAt: csrResult.generatedAt,
    config: csrResult.config,
  }));
  const privateKeyKey = `zatca_private_key_${companyId}`;
  localStorage.setItem(privateKeyKey, csrResult.privateKeyPEM);
}

export function getStoredCSRData(companyId: string): Partial<CSRResult> | null {
  const key = `zatca_csr_${companyId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;

  const parsed = JSON.parse(data);
  const privateKeyKey = `zatca_private_key_${companyId}`;
  const privateKeyPEM = localStorage.getItem(privateKeyKey);

  return { ...parsed, privateKeyPEM: privateKeyPEM || undefined };
}

export function downloadCSR(csrPEM: string, fileName: string): void {
  const blob = new Blob([csrPEM], { type: 'application/x-pem-file' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.pem') ? fileName : `${fileName}.pem`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildCSRConfigFromSettings(settings: {
  companyName?: string;
  vatNumber?: string;
  commercialRegister?: string;
  address?: string;
  solutionName?: string;
}): CSRConfig {
  return {
    commonName: settings.solutionName || 'ERP-Solution',
    organizationName: settings.companyName || '',
    organizationUnit: settings.commercialRegister || '',
    country: 'SA',
    serialNumber: `1-${settings.solutionName || 'ERP'}|2-${settings.solutionName || 'ERP'}|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f`,
    vatNumber: settings.vatNumber || '',
    invoiceType: '1100',
    location: settings.address || '',
    industry: 'Automotive',
  };
}
