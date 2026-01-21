import { supabase } from "@/integrations/supabase/client";

// Types
export interface FinancingCompany {
  id: string;
  company_id: string;
  name: string;
  bank_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  api_endpoint?: string;
  commission_rate: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancingContract {
  id: string;
  company_id: string;
  contract_number: string;
  financing_company_id: string;
  customer_id?: string;
  sale_id?: string;
  car_id?: string;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  profit_rate: number;
  number_of_months: number;
  monthly_payment: number;
  contract_date: string;
  first_payment_date: string;
  last_payment_date?: string;
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  amount_received_from_bank: number;
  bank_transfer_date?: string;
  bank_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  financing_company?: FinancingCompany;
  customer?: { id: string; name: string; phone: string };
  car?: { id: string; name: string; model: string; chassis_number: string };
  sale?: { id: string; sale_number: number };
  financing_payments?: FinancingPayment[];
}

export interface FinancingPayment {
  id: string;
  contract_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date?: string;
  payment_method?: string;
  bank_reference?: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type FinancingCompanyInsert = Omit<FinancingCompany, 'id' | 'created_at' | 'updated_at'>;
export type FinancingContractInsert = Omit<FinancingContract, 'id' | 'created_at' | 'updated_at' | 'financing_company' | 'customer' | 'car' | 'sale' | 'financing_payments'>;

// Financing Companies
export async function fetchFinancingCompanies(): Promise<FinancingCompany[]> {
  const { data, error } = await supabase
    .from('financing_companies')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return (data || []) as FinancingCompany[];
}

export async function addFinancingCompany(company: FinancingCompanyInsert): Promise<FinancingCompany> {
  const { data, error } = await supabase
    .from('financing_companies')
    .insert(company)
    .select()
    .single();
  
  if (error) throw error;
  return data as FinancingCompany;
}

export async function updateFinancingCompany(id: string, updates: Partial<FinancingCompanyInsert>): Promise<FinancingCompany> {
  const { data, error } = await supabase
    .from('financing_companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FinancingCompany;
}

export async function deleteFinancingCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from('financing_companies')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Financing Contracts
export async function fetchFinancingContracts(): Promise<FinancingContract[]> {
  const { data, error } = await supabase
    .from('financing_contracts')
    .select(`
      *,
      financing_company:financing_companies(*),
      customer:customers(id, name, phone),
      car:cars(id, name, model, chassis_number),
      sale:sales(id, sale_number),
      financing_payments(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as FinancingContract[];
}

export async function fetchFinancingContract(id: string): Promise<FinancingContract | null> {
  const { data, error } = await supabase
    .from('financing_contracts')
    .select(`
      *,
      financing_company:financing_companies(*),
      customer:customers(id, name, phone),
      car:cars(id, name, model, chassis_number),
      sale:sales(id, sale_number),
      financing_payments(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as FinancingContract;
}

export async function addFinancingContract(contract: FinancingContractInsert): Promise<FinancingContract> {
  const { data, error } = await supabase
    .from('financing_contracts')
    .insert(contract)
    .select()
    .single();
  
  if (error) throw error;
  
  // Generate payment schedule
  const payments = [];
  let paymentDate = new Date(contract.first_payment_date);
  
  for (let i = 1; i <= contract.number_of_months; i++) {
    payments.push({
      contract_id: data.id,
      payment_number: i,
      due_date: paymentDate.toISOString().split('T')[0],
      amount: contract.monthly_payment,
      status: 'pending' as const
    });
    paymentDate.setMonth(paymentDate.getMonth() + 1);
  }
  
  if (payments.length > 0) {
    const { error: paymentsError } = await supabase
      .from('financing_payments')
      .insert(payments);
    
    if (paymentsError) throw paymentsError;
  }
  
  return data as FinancingContract;
}

export async function updateFinancingContract(id: string, updates: Partial<FinancingContractInsert>): Promise<FinancingContract> {
  const { data, error } = await supabase
    .from('financing_contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FinancingContract;
}

export async function recordFinancingPayment(
  paymentId: string,
  paidAmount: number,
  paymentMethod: string,
  bankReference?: string,
  paidDate?: string
): Promise<FinancingPayment> {
  const { data: payment, error: fetchError } = await supabase
    .from('financing_payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const totalPaid = (payment.paid_amount || 0) + paidAmount;
  const newStatus = totalPaid >= payment.amount ? 'paid' : 'partial';
  
  const { data, error } = await supabase
    .from('financing_payments')
    .update({
      paid_amount: totalPaid,
      paid_date: paidDate || new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      bank_reference: bankReference,
      status: newStatus
    })
    .eq('id', paymentId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Check if all payments are completed
  const { data: allPayments } = await supabase
    .from('financing_payments')
    .select('status')
    .eq('contract_id', payment.contract_id);
  
  const allPaid = allPayments?.every(p => p.status === 'paid' || p.status === 'waived');
  
  if (allPaid) {
    await supabase
      .from('financing_contracts')
      .update({ status: 'completed' })
      .eq('id', payment.contract_id);
  }
  
  return data as FinancingPayment;
}

export async function getOverdueFinancingPayments(): Promise<(FinancingPayment & { contract: FinancingContract })[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('financing_payments')
    .select(`
      *,
      contract:financing_contracts(
        *,
        financing_company:financing_companies(name),
        customer:customers(id, name, phone)
      )
    `)
    .lt('due_date', today)
    .in('status', ['pending', 'partial'])
    .order('due_date');
  
  if (error) throw error;
  return (data || []) as any;
}
