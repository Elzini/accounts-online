/**
 * Companies Page - Data & State Hook
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading' | 'restaurant' | 'export_import' | 'medical' | 'real_estate';

export const ACTIVITY_TYPE_LABELS: Record<CompanyActivityType, string> = {
  car_dealership: 'معرض سيارات',
  construction: 'نظام المقاولات',
  general_trading: 'التجارة العامة',
  restaurant: 'مطاعم وكافيهات',
  export_import: 'الاستيراد والتصدير',
  medical: 'تجارة أدوية وأدوات طبية',
  real_estate: 'تطوير عقاري',
};

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  company_type?: CompanyActivityType;
  created_at: string;
  updated_at: string;
}

export interface CompanyStats {
  company_id: string;
  users_count: number;
  cars_count: number;
  sales_count: number;
  customers_count: number;
}

export interface CompanyFormData {
  name: string;
  phone: string;
  address: string;
  is_active: boolean;
  company_type: CompanyActivityType;
}

const defaultFormData: CompanyFormData = {
  name: '', phone: '', address: '', is_active: true, company_type: 'car_dealership',
};

export function useCompaniesData() {
  const queryClient = useQueryClient();

  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [headerLogoLoaded, setHeaderLogoLoaded] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [accountingSettingsOpen, setAccountingSettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);

  useEffect(() => {
    document.title = 'إدارة الشركات';
    let mounted = true;
    const fetchHeaderLogo = async () => {
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'login_logo_url').is('company_id', null).maybeSingle();
      if (!mounted) return;
      if (error) { console.error('Error fetching global logo:', error); setHeaderLogoUrl(''); setHeaderLogoLoaded(true); return; }
      setHeaderLogoUrl(data?.value || ''); setHeaderLogoLoaded(true);
    };
    fetchHeaderLogo();
    return () => { mounted = false; };
  }, []);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: companyStats = [] } = useQuery({
    queryKey: ['company-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_company_stats');
      if (error) throw error;
      return (data || []).map((s: any) => ({
        company_id: s.company_id,
        users_count: Number(s.users_count) || 0,
        cars_count: Number(s.cars_count) || 0,
        sales_count: Number(s.sales_count) || 0,
        customers_count: Number(s.customers_count) || 0,
      })) as CompanyStats[];
    },
    enabled: companies.length > 0,
  });

  const addCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: newCompany, error } = await supabase.from('companies').insert({ name: data.name, phone: data.phone || null, address: data.address || null, is_active: data.is_active, company_type: data.company_type }).select().single();
      if (error) throw error;
      return newCompany;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); toast.success('تم إضافة الشركة بنجاح'); setAddDialogOpen(false); resetForm(); },
    onError: () => { toast.error('حدث خطأ أثناء إضافة الشركة'); },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const { data: updated, error } = await supabase.from('companies').update({ name: data.name, phone: data.phone || null, address: data.address || null, is_active: data.is_active }).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); toast.success('تم تحديث الشركة بنجاح'); setEditDialogOpen(false); setSelectedCompany(null); resetForm(); },
    onError: () => { toast.error('حدث خطأ أثناء تحديث الشركة'); },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('companies').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); toast.success('تم حذف الشركة بنجاح'); setDeleteDialogOpen(false); setSelectedCompany(null); },
    onError: () => { toast.error('لا يمكن حذف الشركة - قد تحتوي على بيانات'); },
  });

  const resetForm = () => setFormData(defaultFormData);

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({ name: company.name, phone: company.phone || '', address: company.address || '', is_active: company.is_active, company_type: (company.company_type || 'general_trading') as CompanyActivityType });
    setEditDialogOpen(true);
  };

  const openDetailsDialog = (company: Company) => { setSelectedCompany(company); setDetailsDialogOpen(true); };

  const getCompanyStats = (companyId: string) => companyStats.find(s => s.company_id === companyId) || { users_count: 0, cars_count: 0, sales_count: 0, customers_count: 0 };

  const formatDate = (date: string) => new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));

  return {
    headerLogoUrl, headerLogoLoaded, companies, companyStats, isLoading,
    formData, setFormData, selectedCompany, setSelectedCompany,
    addDialogOpen, setAddDialogOpen, editDialogOpen, setEditDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen, detailsDialogOpen, setDetailsDialogOpen,
    accountingSettingsOpen, setAccountingSettingsOpen,
    addCompany, updateCompany, deleteCompany,
    openEditDialog, openDetailsDialog, getCompanyStats, formatDate, resetForm,
  };
}
