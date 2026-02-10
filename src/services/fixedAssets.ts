import { supabase } from '@/integrations/supabase/client';
import { getCompanyOverride } from '@/lib/companyOverride';

export interface FixedAsset {
  id: string;
  company_id: string;
  asset_number: number;
  name: string;
  description?: string;
  category?: string;
  purchase_date: string;
  purchase_price: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'units_of_production';
  depreciation_rate?: number;
  accumulated_depreciation: number;
  current_value?: number;
  location?: string;
  serial_number?: string;
  status: 'active' | 'disposed' | 'fully_depreciated' | 'under_maintenance';
  disposal_date?: string;
  disposal_value?: number;
  disposal_notes?: string;
  account_category_id?: string;
  depreciation_account_id?: string;
  accumulated_depreciation_account_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DepreciationEntry {
  id: string;
  company_id: string;
  asset_id: string;
  entry_date: string;
  period_start: string;
  period_end: string;
  depreciation_amount: number;
  accumulated_after: number;
  book_value_after: number;
  journal_entry_id?: string;
  notes?: string;
  created_at: string;
}

export interface AssetCategory {
  id: string;
  company_id: string;
  name: string;
  default_useful_life?: number;
  default_depreciation_method: string;
  default_depreciation_rate?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  category?: string;
  purchase_date: string;
  purchase_price: number;
  salvage_value?: number;
  useful_life_years: number;
  depreciation_method?: string;
  depreciation_rate?: number;
  location?: string;
  serial_number?: string;
  account_category_id?: string;
  depreciation_account_id?: string;
  accumulated_depreciation_account_id?: string;
  notes?: string;
}

// Helper function to get current user's company_id
async function getCurrentCompanyId(): Promise<string | null> {
  const override = getCompanyOverride();
  if (override) return override;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  
  return profile?.company_id || null;
}

// Fixed Assets CRUD
export async function fetchFixedAssets(): Promise<FixedAsset[]> {
  const { data, error } = await supabase
    .from('fixed_assets')
    .select('*')
    .order('asset_number', { ascending: true });
  
  if (error) throw error;
  return data as FixedAsset[];
}

export async function fetchAssetById(id: string): Promise<FixedAsset | null> {
  const { data, error } = await supabase
    .from('fixed_assets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as FixedAsset;
}

export async function createFixedAsset(input: CreateAssetInput): Promise<FixedAsset> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('لا يمكن العثور على الشركة الحالية');

  const currentValue = input.purchase_price;
  
  const { data, error } = await supabase
    .from('fixed_assets')
    .insert({
      company_id: companyId,
      name: input.name,
      description: input.description,
      category: input.category,
      purchase_date: input.purchase_date,
      purchase_price: input.purchase_price,
      salvage_value: input.salvage_value || 0,
      useful_life_years: input.useful_life_years,
      depreciation_method: input.depreciation_method || 'straight_line',
      depreciation_rate: input.depreciation_rate,
      current_value: currentValue,
      location: input.location,
      serial_number: input.serial_number,
      account_category_id: input.account_category_id,
      depreciation_account_id: input.depreciation_account_id,
      accumulated_depreciation_account_id: input.accumulated_depreciation_account_id,
      notes: input.notes,
      status: 'active',
      accumulated_depreciation: 0,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as FixedAsset;
}

export async function updateFixedAsset(id: string, updates: Partial<CreateAssetInput>): Promise<FixedAsset> {
  const { data, error } = await supabase
    .from('fixed_assets')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FixedAsset;
}

export async function deleteFixedAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('fixed_assets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function disposeAsset(id: string, disposalDate: string, disposalValue: number, notes?: string): Promise<FixedAsset> {
  const { data, error } = await supabase
    .from('fixed_assets')
    .update({
      status: 'disposed',
      disposal_date: disposalDate,
      disposal_value: disposalValue,
      disposal_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FixedAsset;
}

// Depreciation Entries
export async function fetchDepreciationEntries(assetId?: string): Promise<DepreciationEntry[]> {
  let query = supabase
    .from('depreciation_entries')
    .select('*')
    .order('entry_date', { ascending: false });
  
  if (assetId) {
    query = query.eq('asset_id', assetId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as DepreciationEntry[];
}

export async function calculateAndRecordDepreciation(
  assetId: string,
  periodStart: string,
  periodEnd: string
): Promise<DepreciationEntry> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('لا يمكن العثور على الشركة الحالية');

  // Fetch the asset
  const asset = await fetchAssetById(assetId);
  if (!asset) throw new Error('الأصل غير موجود');
  
  if (asset.status !== 'active') {
    throw new Error('لا يمكن حساب الإهلاك لأصل غير نشط');
  }

  // Calculate depreciation
  const depreciableBase = asset.purchase_price - asset.salvage_value;
  let annualDepreciation: number;
  
  if (asset.depreciation_method === 'straight_line') {
    annualDepreciation = depreciableBase / asset.useful_life_years;
  } else if (asset.depreciation_method === 'declining_balance') {
    const rate = asset.depreciation_rate || (2 / asset.useful_life_years) * 100;
    const bookValue = asset.purchase_price - asset.accumulated_depreciation;
    annualDepreciation = bookValue * (rate / 100);
    
    // Don't depreciate below salvage value
    if ((bookValue - annualDepreciation) < asset.salvage_value) {
      annualDepreciation = bookValue - asset.salvage_value;
    }
  } else {
    annualDepreciation = depreciableBase / asset.useful_life_years;
  }

  // Calculate period depreciation (monthly)
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const periodDepreciation = (annualDepreciation / 12) * monthsDiff;

  // Check if already fully depreciated
  const maxDepreciation = asset.purchase_price - asset.salvage_value - asset.accumulated_depreciation;
  const actualDepreciation = Math.min(periodDepreciation, maxDepreciation);
  
  if (actualDepreciation <= 0) {
    throw new Error('الأصل تم إهلاكه بالكامل');
  }

  const newAccumulated = asset.accumulated_depreciation + actualDepreciation;
  const newBookValue = asset.purchase_price - newAccumulated;

  // Create depreciation entry
  const { data: entry, error: entryError } = await supabase
    .from('depreciation_entries')
    .insert({
      company_id: companyId,
      asset_id: assetId,
      entry_date: new Date().toISOString().split('T')[0],
      period_start: periodStart,
      period_end: periodEnd,
      depreciation_amount: Math.round(actualDepreciation * 100) / 100,
      accumulated_after: Math.round(newAccumulated * 100) / 100,
      book_value_after: Math.round(newBookValue * 100) / 100,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // Update asset
  const updateData: Record<string, unknown> = {
    accumulated_depreciation: Math.round(newAccumulated * 100) / 100,
    current_value: Math.round(newBookValue * 100) / 100,
    updated_at: new Date().toISOString(),
  };
  
  // Mark as fully depreciated if applicable
  if (newBookValue <= asset.salvage_value) {
    updateData.status = 'fully_depreciated';
  }

  await supabase
    .from('fixed_assets')
    .update(updateData)
    .eq('id', assetId);

  return entry as DepreciationEntry;
}

// Asset Categories
export async function fetchAssetCategories(): Promise<AssetCategory[]> {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data as AssetCategory[];
}

export async function createAssetCategory(input: {
  name: string;
  default_useful_life?: number;
  default_depreciation_method?: string;
  default_depreciation_rate?: number;
  description?: string;
}): Promise<AssetCategory> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('لا يمكن العثور على الشركة الحالية');

  const { data, error } = await supabase
    .from('asset_categories')
    .insert({
      company_id: companyId,
      name: input.name,
      default_useful_life: input.default_useful_life,
      default_depreciation_method: input.default_depreciation_method || 'straight_line',
      default_depreciation_rate: input.default_depreciation_rate,
      description: input.description,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as AssetCategory;
}

// Summary functions
export async function getAssetsSummary(): Promise<{
  totalAssets: number;
  totalValue: number;
  totalAccumulatedDepreciation: number;
  totalBookValue: number;
  activeAssets: number;
  disposedAssets: number;
  fullyDepreciatedAssets: number;
}> {
  const assets = await fetchFixedAssets();
  
  return {
    totalAssets: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.purchase_price, 0),
    totalAccumulatedDepreciation: assets.reduce((sum, a) => sum + a.accumulated_depreciation, 0),
    totalBookValue: assets.reduce((sum, a) => sum + (a.current_value || (a.purchase_price - a.accumulated_depreciation)), 0),
    activeAssets: assets.filter(a => a.status === 'active').length,
    disposedAssets: assets.filter(a => a.status === 'disposed').length,
    fullyDepreciatedAssets: assets.filter(a => a.status === 'fully_depreciated').length,
  };
}
