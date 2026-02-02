import { supabase } from '@/integrations/supabase/client';

/**
 * Secure service for managing financing company API keys.
 * All encryption/decryption happens server-side in the edge function.
 * The client NEVER sees the plaintext key after initial submission.
 */

interface FinancingKeyResponse {
  success: boolean;
  masked_key?: string;
  has_key?: boolean;
  message?: string;
  error?: string;
}

/**
 * Store a new API key for a financing company.
 * The key is encrypted server-side and stored securely.
 * Only a masked version is returned.
 */
export async function storeFinancingApiKey(
  financingCompanyId: string,
  apiKey: string
): Promise<{ success: boolean; maskedKey?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke<FinancingKeyResponse>(
      'manage-financing-key',
      {
        body: {
          action: 'encrypt',
          financingCompanyId,
          apiKey,
        },
      }
    );

    if (error) {
      console.error('Failed to store API key:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    return { success: true, maskedKey: data.masked_key };
  } catch (err) {
    console.error('Error storing API key:', err);
    return { success: false, error: 'Failed to store API key' };
  }
}

/**
 * Get the masked version of an API key for display purposes.
 * The actual key is NEVER returned to the client.
 */
export async function getMaskedFinancingApiKey(
  financingCompanyId: string
): Promise<{ success: boolean; maskedKey?: string | null; hasKey?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke<FinancingKeyResponse>(
      'manage-financing-key',
      {
        body: {
          action: 'get_masked',
          financingCompanyId,
        },
      }
    );

    if (error) {
      console.error('Failed to get masked key:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    return { 
      success: true, 
      maskedKey: data.masked_key,
      hasKey: data.has_key 
    };
  } catch (err) {
    console.error('Error getting masked key:', err);
    return { success: false, error: 'Failed to get API key status' };
  }
}

/**
 * Delete an API key from a financing company.
 */
export async function deleteFinancingApiKey(
  financingCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke<FinancingKeyResponse>(
      'manage-financing-key',
      {
        body: {
          action: 'delete',
          financingCompanyId,
        },
      }
    );

    if (error) {
      console.error('Failed to delete API key:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error deleting API key:', err);
    return { success: false, error: 'Failed to delete API key' };
  }
}

/**
 * Trigger a server-side API call using the stored key.
 * The key is decrypted server-side and NEVER sent to the client.
 * This function would be called by other edge functions that need
 * to make authenticated requests to financing partners.
 */
export async function useFinancingApiKey(
  financingCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke<FinancingKeyResponse>(
      'manage-financing-key',
      {
        body: {
          action: 'use_for_api_call',
          financingCompanyId,
        },
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error using API key:', err);
    return { success: false, error: 'Failed to use API key' };
  }
}
