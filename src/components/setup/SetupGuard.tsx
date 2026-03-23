import { useCompanyReadiness } from '@/hooks/useCompanyReadiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateDefaultAccounts } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivePage } from '@/types';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';

interface SetupGuardProps {
  children: React.ReactNode;
  setActivePage: (page: ActivePage) => void;
}

export function SetupGuard({ children, setActivePage }: SetupGuardProps) {
  const { data: readiness, isLoading } = useCompanyReadiness();
  const { language } = useLanguage();
  const createAccounts = useCreateDefaultAccounts();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isFixingMappings, setIsFixingMappings] = useState(false);
  const isAr = language === 'ar';
  const { companyId } = useCompany();

  if (isLoading) return null; // Don't block while checking
  if (!readiness || readiness.isReady) return <>{children}</>;

  const handleCreateAccounts = async () => {
    setIsCreating(true);
    try {
      await createAccounts.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ['company-readiness'] });
      toast.success(isAr ? '✅ تم إنشاء شجرة الحسابات بنجاح' : '✅ Chart of accounts created');
    } catch (e) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFixMappings = async () => {
    if (!companyId) return;
    setIsFixingMappings(true);
    try {
      await supabase.rpc('populate_account_mappings', { p_company_id: companyId });
      await queryClient.invalidateQueries({ queryKey: ['company-readiness'] });
      toast.success(isAr ? '✅ تم ربط الحسابات بنجاح' : '✅ Account mappings created');
    } catch (e) {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setIsFixingMappings(false);
    }
  };

  const steps = [
    {
      key: 'accounts',
      label: isAr ? 'شجرة الحسابات' : 'Chart of Accounts',
      done: readiness.hasAccounts,
      action: handleCreateAccounts,
      actionLabel: isAr ? 'إنشاء تلقائي' : 'Create Automatically',
      loading: isCreating,
    },
    {
      key: 'account_mappings',
      label: isAr ? 'ربط الحسابات بالعمليات' : 'Account Mappings',
      done: readiness.hasAccountMappings,
      action: handleFixMappings,
      actionLabel: isAr ? 'ربط تلقائي' : 'Auto-Map',
      loading: isFixingMappings,
    },
    {
      key: 'fiscal_year',
      label: isAr ? 'السنة المالية' : 'Fiscal Year',
      done: readiness.hasFiscalYear,
      action: () => setActivePage('fiscal-years'),
      actionLabel: isAr ? 'إنشاء سنة مالية' : 'Create Fiscal Year',
    },
    {
      key: 'tax_settings',
      label: isAr ? 'إعدادات الضريبة' : 'Tax Settings',
      done: readiness.hasTaxSettings,
      action: () => setActivePage('tax-settings'),
      actionLabel: isAr ? 'ضبط الإعدادات' : 'Configure',
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg border-warning/50">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
          <CardTitle className="text-xl">
            {isAr ? 'يجب إكمال تهيئة الشركة' : 'Company Setup Required'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? 'لتجنب الأخطاء في الفواتير والتقارير، يرجى إكمال الخطوات التالية:'
              : 'To avoid errors in invoices and reports, please complete:'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                step.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-warning/5 border-warning/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-warning" />
                )}
                <span className={step.done ? 'line-through text-muted-foreground' : 'font-medium'}>
                  {step.label}
                </span>
              </div>
              {!step.done && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={step.action}
                  disabled={step.loading}
                >
                  {step.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    step.actionLabel
                  )}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
