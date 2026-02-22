import { CheckCircle2, ArrowLeft, Users, Truck, DollarSign, ShoppingCart, Receipt, Calendar, BookOpen, FileText } from 'lucide-react';
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
}

interface GettingStartedDashboardProps {
  setActivePage: (page: ActivePage) => void;
  hasFiscalYear: boolean;
  hasTaxSettings: boolean;
  hasAccounts: boolean;
  hasCustomers: boolean;
  hasSuppliers: boolean;
  hasSales: boolean;
  hasPurchases: boolean;
}

export function GettingStartedDashboard({
  setActivePage,
  hasFiscalYear,
  hasTaxSettings,
  hasAccounts,
  hasCustomers,
  hasSuppliers,
  hasSales,
  hasPurchases,
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
    },
    {
      id: 'customer',
      title: 'إضافة أول عميل',
      titleEn: 'Add First Customer',
      description: 'سجّل بيانات أول عميل لبدء البيع',
      descriptionEn: 'Register your first customer to start selling',
      icon: Users,
      page: 'customers' as ActivePage,
      done: hasCustomers,
    },
    {
      id: 'supplier',
      title: 'إضافة أول مورد',
      titleEn: 'Add First Supplier',
      description: 'سجّل بيانات أول مورد لبدء المشتريات',
      descriptionEn: 'Register your first supplier to start purchasing',
      icon: Truck,
      page: 'suppliers' as ActivePage,
      done: hasSuppliers,
    },
    {
      id: 'purchase',
      title: 'أول عملية شراء',
      titleEn: 'First Purchase',
      description: 'أنشئ أول فاتورة مشتريات',
      descriptionEn: 'Create your first purchase invoice',
      icon: ShoppingCart,
      page: 'purchases' as ActivePage,
      done: hasPurchases,
    },
    {
      id: 'sale',
      title: 'أول عملية بيع',
      titleEn: 'First Sale',
      description: 'أنشئ أول فاتورة مبيعات',
      descriptionEn: 'Create your first sales invoice',
      icon: DollarSign,
      page: 'sales' as ActivePage,
      done: hasSales,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  // Find the first incomplete step
  const nextStep = steps.find(s => !s.done);

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
              {completedCount} / {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2.5" />
          {allDone && (
            <p className="text-sm text-green-600 font-medium text-center">
              {isAr ? '🎉 تهانينا! نظامك جاهز للاستخدام' : '🎉 Congratulations! Your system is ready'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isNext = nextStep?.id === step.id;
          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all duration-200 cursor-pointer hover:shadow-md",
                step.done && "opacity-60",
                isNext && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => setActivePage(step.page)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    step.done
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                      : isNext
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", step.done && "line-through")}>
                    {isAr ? step.title : step.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? step.description : step.descriptionEn}
                  </p>
                </div>
                <div className="shrink-0">
                  {step.done ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {isAr ? 'تم' : 'Done'}
                    </Badge>
                  ) : isNext ? (
                    <Button size="sm" className="gap-1">
                      {isAr ? 'ابدأ' : 'Start'}
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
