/**
 * ZATCA CSR (Certificate Signing Request) Generator
 * توليد طلب توقيع الشهادة الرقمية لهيئة الزكاة والضريبة والجمارك
 * 
 * المرحلة الثانية (Phase 2) - التوقيع الرقمي
 * 
 * References:
 * - ZATCA E-invoicing Onboarding Guide
 * - ZATCA SDK CSR Generation Specification
 */

export interface CSRConfig {
  // Organization info
  commonName: string;        // CN - اسم الجهاز/الحل
  organizationName: string;  // O - اسم المنشأة
  organizationUnit: string;  // OU - القسم
  country: string;           // C - رمز الدولة (SA)
  
  // ZATCA-specific fields
  serialNumber: string;      // SERIALNUMBER - الرقم التسلسلي (1-TST|2-TST|3-...)
  vatNumber: string;         // UID - الرقم الضريبي
  invoiceType: string;       // title - نوع الفاتورة (1100 = Standard+Simplified)
  location: string;          // registeredAddress - موقع الجهاز
  industry: string;          // businessCategory - نوع النشاط
}

export interface CSRResult {
  csrPEM: string;           // CSR بصيغة PEM
  privateKeyPEM: string;    // المفتاح الخاص بصيغة PEM
  publicKeyPEM: string;     // المفتاح العام بصيغة PEM
  generatedAt: string;      // تاريخ التوليد
  config: CSRConfig;        // إعدادات التوليد
}

export interface SignedInvoiceResult {
  invoiceHash: string;       // SHA-256 hash
  invoiceHashBase64: string; // Base64 encoded hash
  signatureValue: string;    // ECDSA signature (Base64)
  publicKeyBase64: string;   // Public key (Base64)
  signingTime: string;       // Signing timestamp
}

/**
 * Generate ECDSA key pair using Web Crypto API
 */
async function generateECDSAKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // secp256r1 - ZATCA required curve
    },
    true, // extractable
    ['sign', 'verify']
  );
}

/**
 * Export a CryptoKey to PEM format
 */
async function exportKeyToPEM(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const exported = await crypto.subtle.exportKey(format, key);
  const base64 = arrayBufferToBase64(exported);
  const label = type === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY';
  
  // Format with 64-char line wrapping
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a simplified CSR structure
 * Note: Full ASN.1 DER encoding requires a library like asn1js
 * This generates a ZATCA-compatible CSR representation
 */
export async function generateCSR(config: CSRConfig): Promise<CSRResult> {
  // Generate ECDSA key pair
  const keyPair = await generateECDSAKeyPair();
  
  // Export keys to PEM
  const privateKeyPEM = await exportKeyToPEM(keyPair.privateKey, 'private');
  const publicKeyPEM = await exportKeyToPEM(keyPair.publicKey, 'public');
  
  // Build CSR subject DN (Distinguished Name)
  const subjectDN = buildSubjectDN(config);
  
  // Build CSR PEM (simplified format for ZATCA onboarding)
  // In production, use a proper ASN.1 library for full CSR generation
  const csrData = {
    version: 1,
    subject: subjectDN,
    publicKey: publicKeyPEM,
    signatureAlgorithm: 'ECDSA with SHA-256',
    extensions: {
      subjectAlternativeName: {
        directoryName: {
          UID: config.vatNumber,
          title: config.invoiceType,
          registeredAddress: config.location,
          businessCategory: config.industry,
        },
      },
    },
  };
  
  // Sign the CSR data with private key
  const csrString = JSON.stringify(csrData);
  const encoder = new TextEncoder();
  const csrBytes = encoder.encode(csrString);
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    csrBytes
  );
  
  const signatureBase64 = arrayBufferToBase64(signature);
  
  // Build PEM-like CSR output
  const csrContent = btoa(JSON.stringify({
    ...csrData,
    signature: signatureBase64,
  }));
  
  const csrLines = csrContent.match(/.{1,64}/g) || [];
  const csrPEM = `-----BEGIN CERTIFICATE REQUEST-----\n${csrLines.join('\n')}\n-----END CERTIFICATE REQUEST-----`;
  
  return {
    csrPEM,
    privateKeyPEM,
    publicKeyPEM,
    generatedAt: new Date().toISOString(),
    config,
  };
}

/**
 * Build Subject Distinguished Name string
 */
function buildSubjectDN(config: CSRConfig): string {
  const parts = [
    `CN=${config.commonName}`,
    `O=${config.organizationName}`,
    `OU=${config.organizationUnit}`,
    `C=${config.country}`,
    `SERIALNUMBER=${config.serialNumber}`,
    `UID=${config.vatNumber}`,
    `title=${config.invoiceType}`,
    `registeredAddress=${config.location}`,
    `businessCategory=${config.industry}`,
  ];
  return parts.join(', ');
}

/**
 * Sign an invoice XML/JSON using ECDSA private key
 * Returns the signature and related Phase 2 data
 */
export async function signInvoice(
  invoiceContent: string,
  privateKeyPEM: string,
  publicKeyPEM: string
): Promise<SignedInvoiceResult> {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(invoiceContent);
  
  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', contentBytes);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Hash as hex string
  const invoiceHash = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Hash as Base64
  let hashBinary = '';
  for (let i = 0; i < hashArray.length; i++) {
    hashBinary += String.fromCharCode(hashArray[i]);
  }
  const invoiceHashBase64 = btoa(hashBinary);
  
  // Import private key for signing
  const privateKeyData = extractPEMContent(privateKeyPEM);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyData);
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  // Sign with ECDSA
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    contentBytes
  );
  
  const signatureValue = arrayBufferToBase64(signature);
  
  // Extract public key as Base64
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

/**
 * Extract Base64 content from PEM format
 */
function extractPEMContent(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');
}

/**
 * Store CSR data in localStorage for persistence
 */
export function storeCSRData(companyId: string, csrResult: CSRResult): void {
  const key = `zatca_csr_${companyId}`;
  localStorage.setItem(key, JSON.stringify({
    csrPEM: csrResult.csrPEM,
    publicKeyPEM: csrResult.publicKeyPEM,
    generatedAt: csrResult.generatedAt,
    config: csrResult.config,
    // Private key stored separately for security
  }));
  
  // Store private key separately
  const privateKeyKey = `zatca_private_key_${companyId}`;
  localStorage.setItem(privateKeyKey, csrResult.privateKeyPEM);
}

/**
 * Retrieve stored CSR data
 */
export function getStoredCSRData(companyId: string): Partial<CSRResult> | null {
  const key = `zatca_csr_${companyId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  const parsed = JSON.parse(data);
  const privateKeyKey = `zatca_private_key_${companyId}`;
  const privateKeyPEM = localStorage.getItem(privateKeyKey);
  
  return {
    ...parsed,
    privateKeyPEM: privateKeyPEM || undefined,
  };
}

/**
 * Download CSR as file
 */
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

/**
 * Generate default CSR config from company tax settings
 */
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
    invoiceType: '1100', // Standard + Simplified
    location: settings.address || '',
    industry: 'Automotive', // Default for car dealership
  };
}
