import { CheckCircle2, ArrowLeft, Receipt, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Step {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: typeof Calendar;
  page: ActivePage;
  done: boolean;
  statusBadge?: { ar: string; en: string; tone: 'success' | 'warning' | 'muted' };
}

interface GettingStartedDashboardProps {
  setActivePage: (page: ActivePage) => void;
  hasFiscalYear: boolean;
  hasTaxSettings: boolean;
  taxIsActive?: boolean;
  hasAccounts: boolean;
}

export function GettingStartedDashboard({
  setActivePage,
  hasFiscalYear,
  hasTaxSettings,
  taxIsActive = false,
  hasAccounts,
}: GettingStartedDashboardProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const steps: Step[] = [
    {
      id: 'fiscal',
      title: 'إنشاء سنة مالية',
      titleEn: 'Create Fiscal Year',
      description: 'حدد فترة السنة المالية الحالية',
      descriptionEn: 'Define the current fiscal year period',
      icon: Calendar,
      page: 'fiscal-years' as ActivePage,
      done: hasFiscalYear,
      statusBadge: hasFiscalYear
        ? { ar: 'تم الإنشاء', en: 'Created', tone: 'success' }
        : { ar: 'لم تُنشأ بعد', en: 'Not created', tone: 'muted' },
    },
    {
      id: 'tax',
      title: 'إعدادات الضريبة',
      titleEn: 'Tax Settings',
      description: 'تفعيل ضريبة القيمة المضافة وبيانات الشركة',
      descriptionEn: 'Configure VAT and company details',
      icon: Receipt,
      page: 'tax-settings' as ActivePage,
      done: hasTaxSettings,
      statusBadge: !hasTaxSettings
        ? { ar: 'لم تُحفظ بعد', en: 'Not saved', tone: 'muted' }
        : taxIsActive
          ? { ar: 'محفوظة ومفعّلة', en: 'Saved & active', tone: 'success' }
          : { ar: 'محفوظة - غير مفعّلة', en: 'Saved - inactive', tone: 'warning' },
    },
    {
      id: 'accounts',
      title: 'شجرة الحسابات',
      titleEn: 'Chart of Accounts',
      description: 'إنشاء دليل الحسابات المناسب لنشاطك',
      descriptionEn: 'Set up your chart of accounts',
      icon: BookOpen,
      page: 'chart-of-accounts' as ActivePage,
      done: hasAccounts,
      statusBadge: hasAccounts
        ? { ar: 'تم الإنشاء', en: 'Created', tone: 'success' }
        : { ar: 'لم تُنشأ بعد', en: 'Not created', tone: 'muted' },
    },
  ];

  // Effective completion: a step with a "warning" status (e.g. tax saved but inactive)
  // counts as done for navigation but is excluded from the progress count.
  const fullyCompletedCount = steps.filter(
    s => s.done && s.statusBadge?.tone !== 'warning'
  ).length;
  const progress = Math.round((fullyCompletedCount / steps.length) * 100);
  const allDone = fullyCompletedCount === steps.length;
  const hasWarning = steps.some(s => s.statusBadge?.tone === 'warning');

  // Find the first incomplete step (warning steps are revisitable)
  const nextStep = steps.find(s => !s.done || s.statusBadge?.tone === 'warning');

  const toneClasses = {
    success: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30',
    warning: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30',
    muted: 'text-muted-foreground border-border bg-muted/40',
  } as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {isAr ? '🚀 ابدأ إعداد نظامك' : '🚀 Get Started'}
        </h2>
        <p className="text-muted-foreground">
          {isAr
            ? 'أكمل الخطوات التالية لتجهيز نظامك المحاسبي بالكامل'
            : 'Complete the following steps to set up your accounting system'}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {isAr ? 'التقدم' : 'Progress'}
            </span>
            <Badge variant={allDone ? 'default' : 'secondary'}>
              {fullyCompletedCount} / {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2.5" />
          {allDone && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center">
              {isAr ? '🎉 تهانينا! نظامك جاهز للاستخدام' : '🎉 Congratulations! Your system is ready'}
            </p>
          )}
          {!allDone && hasWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              {isAr
                ? 'بعض الإعدادات محفوظة لكنها غير مفعّلة - راجع الحالة بجانب كل خطوة'
                : 'Some settings are saved but inactive — check the status next to each step'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isNext = nextStep?.id === step.id;
          const isWarning = step.statusBadge?.tone === 'warning';
          const fullyDone = step.done && !isWarning;
          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all duration-200 cursor-pointer hover:shadow-md",
                fullyDone && "opacity-60",
                isNext && "ring-2 ring-primary shadow-md",
                isWarning && "border-amber-300/60 dark:border-amber-900/50"
              )}
              onClick={() => setActivePage(step.page)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    fullyDone
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : isWarning
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : isNext
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                  )}
                >
                  {fullyDone ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", fullyDone && "line-through")}>
                    {isAr ? step.title : step.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? step.description : step.descriptionEn}
                  </p>
                  {step.statusBadge && (
                    <span
                      className={cn(
                        "inline-flex items-center mt-1 px-2 py-0.5 rounded-full border text-[10px] font-medium",
                        toneClasses[step.statusBadge.tone]
                      )}
                    >
                      {isAr ? step.statusBadge.ar : step.statusBadge.en}
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  {fullyDone ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-900/50">
                      {isAr ? 'تم' : 'Done'}
                    </Badge>
                  ) : isNext ? (
                    <Button size="sm" className="gap-1">
                      {isWarning ? (isAr ? 'مراجعة' : 'Review') : (isAr ? 'ابدأ' : 'Start')}
                      <ArrowLeft className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {i + 1}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

