import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  logo_url: string;
  welcome_message: string;
  app_name: string;
  app_subtitle: string;
}

export const defaultCompanySettings: CompanySettings = {
  logo_url: '',
  welcome_message: '',
  app_name: '',
  app_subtitle: '',
};

export async function fetchCompanySettings(companyId: string): Promise<CompanySettings> {
  // Fetch company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('logo_url, name')
    .eq('id', companyId)
    .single();
  
  if (companyError) throw companyError;

  // Fetch company-specific app settings
  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('key, value')
    .eq('company_id', companyId);
  
  if (settingsError) throw settingsError;

  const result: CompanySettings = {
    logo_url: company?.logo_url || '',
    welcome_message: '',
    app_name: company?.name || '',
    app_subtitle: '',
  };

  // Override with company-specific settings
  settings?.forEach(row => {
    if (row.key === 'welcome_message' && row.value) {
      result.welcome_message = row.value;
    }
    if (row.key === 'app_name' && row.value) {
      result.app_name = row.value;
    }
    if (row.key === 'app_subtitle' && row.value) {
      result.app_subtitle = row.value;
    }
  });

  return result;
}

export async function updateCompanySettings(
  companyId: string, 
  settings: Partial<CompanySettings>
): Promise<void> {
  // Update company logo if provided
  if (settings.logo_url !== undefined) {
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: settings.logo_url })
      .eq('id', companyId);
    
    if (error) throw error;
  }

  // Update company name if app_name is provided
  if (settings.app_name !== undefined) {
    const { error } = await supabase
      .from('companies')
      .update({ name: settings.app_name })
      .eq('id', companyId);
    
    if (error) throw error;
  }

  // Update app_settings for this company using upsert
  const settingsToUpdate: { key: string; value: string }[] = [];
  
  if (settings.welcome_message !== undefined) {
    settingsToUpdate.push({ key: 'welcome_message', value: settings.welcome_message });
  }
  if (settings.app_name !== undefined) {
    settingsToUpdate.push({ key: 'app_name', value: settings.app_name });
  }
  if (settings.app_subtitle !== undefined) {
    settingsToUpdate.push({ key: 'app_subtitle', value: settings.app_subtitle });
  }

  for (const setting of settingsToUpdate) {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        {
          company_id: companyId,
          key: setting.key,
          value: setting.value,
        },
        { onConflict: 'company_id,key' }
      );
    
    if (error) throw error;
  }
}

export async function uploadCompanyLogo(file: File, companyId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `company-${companyId}-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('app-logos')
    .upload(fileName, file, { upsert: true });
  
  if (uploadError) throw uploadError;
  
  const { data } = supabase.storage
    .from('app-logos')
    .getPublicUrl(fileName);
  
  // Update company logo_url
  await supabase
    .from('companies')
    .update({ logo_url: data.publicUrl })
    .eq('id', companyId);
  
  return data.publicUrl;
}
