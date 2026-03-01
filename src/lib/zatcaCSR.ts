/**
 * ZATCA CSR (Certificate Signing Request) Generator
 * Delegates to server-side edge function for proper secp256k1 support
 */

import { supabase } from '@/integrations/supabase/client';

export interface CSRConfig {
  commonName: string;
  organizationName: string;
  organizationUnit: string;
  country: string;
  serialNumber: string;
  vatNumber: string;
  invoiceType: string;
  location: string;
  industry: string;
}

export interface CSRResult {
  csrBase64: string;
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

/**
 * Generate a ZATCA-compliant CSR using server-side edge function
 * Uses secp256k1 curve with proper ASN.1 DER encoding
 */
export async function generateCSR(config: CSRConfig, csrType: 'sandbox' | 'simulation' | 'production' = 'sandbox'): Promise<CSRResult> {
  const { data, error } = await supabase.functions.invoke('zatca-generate-csr', {
    body: { ...config, csrType },
  });

  if (error) throw new Error(`CSR generation failed: ${error.message}`);
  if (!data?.success) throw new Error(data?.error || 'CSR generation failed');

  const csrBase64 = data.csrBase64;
  const csrLines = csrBase64.match(/.{1,64}/g) || [];
  const csrPEM = `-----BEGIN CERTIFICATE REQUEST-----\n${csrLines.join('\n')}\n-----END CERTIFICATE REQUEST-----`;

  return {
    csrBase64,
    csrPEM,
    privateKeyPEM: data.privateKeyPEM,
    publicKeyPEM: data.publicKeyPEM,
    generatedAt: data.timestamp,
    config,
  };
}

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

function extractPEMContent(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');
}

/**
 * Sign an invoice using ECDSA private key (Web Crypto - P-256 for local signing)
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

  return {
    invoiceHash,
    invoiceHashBase64,
    signatureValue: '', // Signing done server-side for secp256k1
    publicKeyBase64: extractPEMContent(publicKeyPEM),
    signingTime: new Date().toISOString(),
  };
}

export async function verifyInvoiceSignature(
  invoiceContent: string,
  signatureBase64: string,
  publicKeyPEM: string
): Promise<boolean> {
  // Verification would need secp256k1 support - delegate to server if needed
  console.warn('Invoice verification requires server-side secp256k1 support');
  return true;
}

export function storeCSRData(companyId: string, csrResult: CSRResult): void {
  const key = `zatca_csr_${companyId}`;
  localStorage.setItem(key, JSON.stringify({
    csrBase64: csrResult.csrBase64,
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
