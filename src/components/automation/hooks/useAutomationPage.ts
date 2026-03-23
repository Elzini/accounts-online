/**
 * Automation Page - Logic Hook
 * Extracted from AutomationPage.tsx (691 lines)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function useAutomationPage() {
  const { companyId } = useCompany();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('recurring');
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const { data: recurringInvoices = [], isLoading: loadingRecurring } = useQuery({
    queryKey: ['recurring-invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('recurring_invoices').select('*, customers(name), suppliers(name)').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: reminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['collection-reminders', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('collection_reminders').select('*, customers(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: reminderRules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['collection-reminder-rules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('collection_reminder_rules').select('*').eq('company_id', companyId).order('escalation_level');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const toggleRecurring = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('recurring_invoices').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] }); toast.success(isAr ? 'تم التحديث' : 'Updated'); },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] }); toast.success(isAr ? 'تم الحذف' : 'Deleted'); },
  });

  const toggleRuleActive = async (ruleId: string, checked: boolean) => {
    await supabase.from('collection_reminder_rules').update({ is_active: checked }).eq('id', ruleId);
    queryClient.invalidateQueries({ queryKey: ['collection-reminder-rules'] });
  };

  const activeRecurring = recurringInvoices.filter((r: any) => r.is_active).length;
  const pendingReminders = reminders.filter((r: any) => r.status === 'pending').length;
  const sentReminders = reminders.filter((r: any) => r.status === 'sent').length;

  const frequencyLabels: Record<string, string> = {
    weekly: isAr ? 'أسبوعي' : 'Weekly', monthly: isAr ? 'شهري' : 'Monthly',
    quarterly: isAr ? 'ربع سنوي' : 'Quarterly', semi_annual: isAr ? 'نصف سنوي' : 'Semi-Annual',
    annual: isAr ? 'سنوي' : 'Annual',
  };

  const reminderTypeLabels: Record<string, string> = {
    before_due: isAr ? 'قبل الاستحقاق' : 'Before Due', on_due: isAr ? 'يوم الاستحقاق' : 'On Due Date',
    overdue: isAr ? 'متأخر' : 'Overdue', escalation: isAr ? 'تصعيد' : 'Escalation',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    acknowledged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return {
    companyId, isAr, queryClient, activeTab, setActiveTab,
    showRecurringForm, setShowRecurringForm, showRuleForm, setShowRuleForm,
    recurringInvoices, reminders, reminderRules,
    loadingRecurring, loadingReminders, loadingRules,
    toggleRecurring, deleteRecurring, toggleRuleActive,
    activeRecurring, pendingReminders, sentReminders,
    frequencyLabels, reminderTypeLabels, statusColors,
  };
}
