import { supabase } from '@/integrations/supabase/client';

/**
 * Field-level encryption service for sensitive data
 * 
 * SECURITY NOTE: For highly sensitive data like API keys, use the dedicated
 * edge function services (e.g., financingKeyService.ts) which handle
 * encryption/decryption entirely server-side.
 * 
 * This service is intended for less sensitive data like customer ID numbers
 * where the data needs to be displayed to authorized users.
 */

// Encryption key derivation for general field encryption
// Note: For API keys and other high-value secrets, use server-side encryption
const getEncryptionKey = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session for encryption');
  }
  
  // Session-derived key for field encryption
  // Higher-value secrets should use server-side encryption via edge functions
  return `${session.user.id}-field-encrypt-v1`;
};

/**
 * Encrypt field data using database function.
 * For API keys and high-value secrets, use server-side edge functions instead.
 * @deprecated for API keys - use financingKeyService.storeFinancingApiKey instead
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
 * Decrypt field data.
 * For API keys and high-value secrets, the decrypted value is NEVER sent to client.
 * @deprecated for API keys - use financingKeyService.getMaskedFinancingApiKey instead
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
