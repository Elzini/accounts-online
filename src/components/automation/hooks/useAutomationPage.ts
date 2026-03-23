/**
 * Automation Page - Logic Hook
 * Extracted from AutomationPage.tsx (691 lines)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  fetchRecurringInvoices, fetchCollectionReminders, fetchCollectionReminderRules,
  toggleRecurringInvoice, deleteRecurringInvoice as deleteRecurringInvoiceSvc, toggleReminderRule,
} from '@/services/automation';

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
    queryFn: () => fetchRecurringInvoices(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['collection-reminders', companyId],
    queryFn: () => fetchCollectionReminders(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reminderRules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['collection-reminder-rules', companyId],
    queryFn: () => fetchCollectionReminderRules(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const toggleRecurring = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => toggleRecurringInvoice(id, is_active),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] }); toast.success(isAr ? 'تم التحديث' : 'Updated'); },
  });

  const deleteRecurring = useMutation({
    mutationFn: (id: string) => deleteRecurringInvoiceSvc(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] }); toast.success(isAr ? 'تم الحذف' : 'Deleted'); },
  });

  const toggleRuleActive = async (ruleId: string, checked: boolean) => {
    await toggleReminderRule(ruleId, checked);
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
