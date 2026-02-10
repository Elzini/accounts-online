import { supabase } from '@/integrations/supabase/client';
import { getCompanyOverride } from '@/lib/companyOverride';

export interface PartnerDealership {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarTransfer {
  id: string;
  car_id: string;
  partner_dealership_id: string;
  transfer_type: 'outgoing' | 'incoming';
  transfer_date: string;
  return_date: string | null;
  agreed_commission: number;
  commission_percentage: number;
  status: 'pending' | 'sold' | 'returned';
  notes: string | null;
  sale_id: string | null;
  actual_commission: number;
  sale_price: number;
  created_at: string;
  updated_at: string;
  car?: {
    id: string;
    name: string;
    model: string | null;
    color: string | null;
    chassis_number: string;
    inventory_number: number;
    purchase_price: number;
    status: string;
  };
  partner_dealership?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface PartnerDealershipInsert {
  name: string;
  phone: string;
  address?: string | null;
  contact_person?: string | null;
  notes?: string | null;
}

export interface CarTransferInsert {
  car_id: string;
  partner_dealership_id: string;
  transfer_type: 'outgoing' | 'incoming';
  transfer_date: string;
  return_date?: string | null;
  agreed_commission?: number;
  commission_percentage?: number;
  status?: 'pending' | 'sold' | 'returned';
  notes?: string | null;
  sale_id?: string | null;
  actual_commission?: number;
  sale_price?: number;
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

// Function to get pending transfer for a car
export async function getPendingTransferForCar(carId: string): Promise<CarTransfer | null> {
  const { data, error } = await supabase
    .from('car_transfers')
    .select(`
      *,
      car:cars(id, name, model, color, chassis_number, inventory_number, purchase_price, status),
      partner_dealership:partner_dealerships(id, name, phone)
    `)
    .eq('car_id', carId)
    .eq('status', 'pending')
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// Function to link transfer to sale and update status
export async function linkTransferToSale(
  transferId: string, 
  saleId: string, 
  salePrice: number,
  agreedCommission: number,
  commissionPercentage: number
): Promise<CarTransfer> {
  // Calculate actual commission
  const actualCommission = agreedCommission > 0 
    ? agreedCommission 
    : (salePrice * commissionPercentage / 100);

  const { data, error } = await supabase
    .from('car_transfers')
    .update({
      sale_id: saleId,
      status: 'sold',
      sale_price: salePrice,
      actual_commission: actualCommission,
    })
    .eq('id', transferId)
    .select(`
      *,
      car:cars(id, name, model, color, chassis_number, inventory_number, purchase_price, status),
      partner_dealership:partner_dealerships(id, name, phone)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Partner Dealerships
export async function fetchPartnerDealerships(): Promise<PartnerDealership[]> {
  const { data, error } = await supabase
    .from('partner_dealerships')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addPartnerDealership(dealership: PartnerDealershipInsert): Promise<PartnerDealership> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('partner_dealerships')
    .insert({ ...dealership, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePartnerDealership(id: string, dealership: Partial<PartnerDealershipInsert>): Promise<PartnerDealership> {
  const { data, error } = await supabase
    .from('partner_dealerships')
    .update(dealership)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePartnerDealership(id: string): Promise<void> {
  const { error } = await supabase
    .from('partner_dealerships')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Car Transfers
export async function fetchCarTransfers(): Promise<CarTransfer[]> {
  const { data, error } = await supabase
    .from('car_transfers')
    .select(`
      *,
      car:cars(id, name, model, color, chassis_number, inventory_number, purchase_price, status),
      partner_dealership:partner_dealerships(id, name, phone)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addCarTransfer(transfer: CarTransferInsert): Promise<CarTransfer> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('car_transfers')
    .insert({ ...transfer, company_id: companyId })
    .select(`
      *,
      car:cars(id, name, model, color, chassis_number, inventory_number, purchase_price, status),
      partner_dealership:partner_dealerships(id, name, phone)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCarTransfer(id: string, transfer: Partial<CarTransferInsert>): Promise<CarTransfer> {
  const { data, error } = await supabase
    .from('car_transfers')
    .update(transfer)
    .eq('id', id)
    .select(`
      *,
      car:cars(id, name, model, color, chassis_number, inventory_number, purchase_price, status),
      partner_dealership:partner_dealerships(id, name, phone)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCarTransfer(id: string): Promise<void> {
  const { error } = await supabase
    .from('car_transfers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
