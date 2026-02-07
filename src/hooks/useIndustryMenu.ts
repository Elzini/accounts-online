import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';

export interface IndustryMenuItem {
  id: string;
  menu_key: string;
  label_ar: string;
  label_en: string;
  icon: string;
  route: string;
  parent_key: string | null;
  sort_order: number;
  is_visible: boolean;
}

export function useIndustryMenu() {
  const { company } = useCompany();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';

  return useQuery({
    queryKey: ['industry-menu', companyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_menu_config')
        .select('*')
        .eq('company_type', companyType)
        .eq('is_visible', true)
        .order('sort_order');

      if (error) throw error;
      return data as IndustryMenuItem[];
    },
    enabled: !!companyType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get localized menu labels based on company type
export function getIndustryLabels(companyType: CompanyActivityType) {
  const labels: Record<CompanyActivityType, any> = {
    car_dealership: {
      purchases: 'المشتريات',
      sales: 'المبيعات',
      inventory: 'المخزون',
      purchasesDescription: 'إضافة سيارة جديدة',
      salesDescription: 'بيع سيارة',
      itemName: 'السيارة',
      itemsName: 'السيارات',
    },
    construction: {
      purchases: 'المشاريع',
      sales: 'العقود',
      inventory: 'المواد',
      purchasesDescription: 'إضافة مشروع جديد',
      salesDescription: 'إضافة عقد',
      itemName: 'المشروع',
      itemsName: 'المشاريع',
    },
    general_trading: {
      purchases: 'المشتريات',
      sales: 'المبيعات',
      inventory: 'المخزون',
      purchasesDescription: 'إضافة فاتورة مشتريات',
      salesDescription: 'إضافة فاتورة مبيعات',
      itemName: 'المنتج',
      itemsName: 'المنتجات',
    },
    restaurant: {
      purchases: 'المشتريات',
      sales: 'المبيعات',
      inventory: 'المخزون',
      purchasesDescription: 'إضافة طلب توريد',
      salesDescription: 'إضافة فاتورة مبيعات',
      itemName: 'الصنف',
      itemsName: 'الأصناف',
    },
    export_import: {
      purchases: 'الواردات',
      sales: 'الصادرات',
      inventory: 'المخزون',
      purchasesDescription: 'إضافة شحنة واردة',
      salesDescription: 'إضافة شحنة صادرة',
      itemName: 'الشحنة',
      itemsName: 'الشحنات',
    },
  };

  return labels[companyType] || labels.car_dealership;
}
