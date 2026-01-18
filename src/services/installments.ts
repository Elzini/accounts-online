import { supabase } from '@/integrations/supabase/client';

export interface InstallmentSale {
  id: string;
  company_id: string;
  sale_id: string;
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  number_of_installments: number;
  installment_amount: number;
  start_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sale?: {
    id: string;
    sale_number: number;
    sale_date: string;
    customer: {
      id: string;
      name: string;
      phone: string;
    };
    car: {
      id: string;
      name: string;
      model: string | null;
      chassis_number: string;
    };
  };
  payments?: InstallmentPayment[];
}

export interface InstallmentPayment {
  id: string;
  installment_sale_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InstallmentSaleInsert = Omit<InstallmentSale, 'id' | 'created_at' | 'updated_at' | 'sale' | 'payments'>;
export type InstallmentPaymentInsert = Omit<InstallmentPayment, 'id' | 'created_at' | 'updated_at'>;

export async function fetchInstallmentSales(): Promise<InstallmentSale[]> {
  const { data, error } = await supabase
    .from('installment_sales')
    .select(`
      *,
      sale:sales(
        id, sale_number, sale_date,
        customer:customers(id, name, phone),
        car:cars(id, name, model, chassis_number)
      ),
      payments:installment_payments(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as InstallmentSale[];
}

export async function fetchInstallmentSale(id: string): Promise<InstallmentSale | null> {
  const { data, error } = await supabase
    .from('installment_sales')
    .select(`
      *,
      sale:sales(
        id, sale_number, sale_date,
        customer:customers(id, name, phone),
        car:cars(id, name, model, chassis_number)
      ),
      payments:installment_payments(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as InstallmentSale;
}

export async function addInstallmentSale(installmentSale: InstallmentSaleInsert): Promise<InstallmentSale> {
  const { data, error } = await supabase
    .from('installment_sales')
    .insert(installmentSale)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create payment schedule
  const payments: Omit<InstallmentPaymentInsert, 'installment_sale_id'>[] = [];
  const startDate = new Date(installmentSale.start_date);
  
  for (let i = 0; i < installmentSale.number_of_installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    payments.push({
      payment_number: i + 1,
      due_date: dueDate.toISOString().split('T')[0],
      amount: installmentSale.installment_amount,
      paid_amount: 0,
      paid_date: null,
      status: 'pending',
      payment_method: null,
      notes: null
    });
  }
  
  const paymentsWithSaleId = payments.map(p => ({
    ...p,
    installment_sale_id: data.id
  }));
  
  const { error: paymentsError } = await supabase
    .from('installment_payments')
    .insert(paymentsWithSaleId);
  
  if (paymentsError) throw paymentsError;
  
  return data as InstallmentSale;
}

export async function updateInstallmentSale(id: string, updates: Partial<InstallmentSaleInsert>): Promise<InstallmentSale> {
  const { data, error } = await supabase
    .from('installment_sales')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as InstallmentSale;
}

export async function recordPayment(
  paymentId: string, 
  paidAmount: number, 
  paymentMethod: string,
  paidDate: string = new Date().toISOString().split('T')[0]
): Promise<InstallmentPayment> {
  const { data: payment, error: fetchError } = await supabase
    .from('installment_payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const newPaidAmount = (payment.paid_amount || 0) + paidAmount;
  const newStatus = newPaidAmount >= payment.amount ? 'paid' : 'partial';
  
  const { data, error } = await supabase
    .from('installment_payments')
    .update({
      paid_amount: newPaidAmount,
      paid_date: paidDate,
      status: newStatus,
      payment_method: paymentMethod
    })
    .eq('id', paymentId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Check if all payments are complete
  const { data: allPayments } = await supabase
    .from('installment_payments')
    .select('*')
    .eq('installment_sale_id', payment.installment_sale_id);
  
  if (allPayments?.every(p => p.status === 'paid')) {
    await supabase
      .from('installment_sales')
      .update({ status: 'completed' })
      .eq('id', payment.installment_sale_id);
  }
  
  return data as InstallmentPayment;
}

export async function getOverduePayments(): Promise<InstallmentPayment[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('installment_payments')
    .select(`
      *,
      installment_sale:installment_sales(
        *,
        sale:sales(
          customer:customers(name, phone)
        )
      )
    `)
    .lt('due_date', today)
    .neq('status', 'paid')
    .order('due_date');
  
  if (error) throw error;
  return data as InstallmentPayment[];
}
