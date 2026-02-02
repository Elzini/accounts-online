import { supabase } from '@/integrations/supabase/client';

/**
 * Field-level encryption service for sensitive data
 * Uses AES-256 encryption via Supabase database functions
 */

// Encryption key should be stored securely and managed per company
// In production, this would be fetched from a secure key management service
const getEncryptionKey = async (): Promise<string> => {
  // For now, we use a derived key from the user's session
  // In production, use a proper key management system
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session for encryption');
  }
  
  // Use a combination of company ID and a secret to derive the key
  // This is a simplified approach - use proper KMS in production
  return `${session.user.id}-secure-key-v1`;
};

/**
 * Encrypt sensitive data using AES-256
 */
export async function encryptData(plainText: string): Promise<string | null> {
  if (!plainText || plainText.trim() === '') {
    return null;
  }

  try {
    const encryptionKey = await getEncryptionKey();
    
    const { data, error } = await supabase.rpc('encrypt_sensitive_data', {
      plain_text: plainText,
      encryption_key: encryptionKey,
    });

    if (error) {
      console.error('Encryption error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    throw error;
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encryptedText: string): Promise<string | null> {
  if (!encryptedText || encryptedText.trim() === '') {
    return null;
  }

  try {
    const encryptionKey = await getEncryptionKey();
    
    const { data, error } = await supabase.rpc('decrypt_sensitive_data', {
      encrypted_text: encryptedText,
      encryption_key: encryptionKey,
    });

    if (error) {
      console.error('Decryption error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): Promise<T> {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    const value = data[field];
    if (typeof value === 'string' && value.trim() !== '') {
      const encrypted = await encryptData(value);
      if (encrypted) {
        (result as Record<string, unknown>)[`${String(field)}_encrypted`] = encrypted;
      }
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: string[]
): Promise<T> {
  const result = { ...data };
  
  for (const field of encryptedFields) {
    const encryptedValue = data[field];
    if (typeof encryptedValue === 'string' && encryptedValue.trim() !== '') {
      const decrypted = await decryptData(encryptedValue);
      const originalFieldName = field.replace('_encrypted', '');
      (result as Record<string, unknown>)[originalFieldName] = decrypted;
    }
  }
  
  return result;
}

/**
 * Verify audit log integrity for a company
 */
export async function verifyAuditLogIntegrity(companyId: string): Promise<{
  isValid: boolean;
  brokenAtId?: string;
  brokenAtSequence?: number;
  message: string;
}> {
  try {
    const { data, error } = await supabase.rpc('verify_audit_log_integrity', {
      _company_id: companyId,
    });

    if (error) {
      console.error('Audit verification error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        isValid: result.is_valid,
        brokenAtId: result.broken_at_id,
        brokenAtSequence: result.broken_at_sequence,
        message: result.message,
      };
    }

    return {
      isValid: false,
      message: 'No verification result returned',
    };
  } catch (error) {
    console.error('Failed to verify audit log integrity:', error);
    return {
      isValid: false,
      message: 'Verification failed: ' + String(error),
    };
  }
}
