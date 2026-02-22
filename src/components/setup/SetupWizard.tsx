import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowLeft, ArrowRight, Calendar, Building2, Receipt, Users, Loader2, Sparkles } from 'lucide-react';
import { useCreateFiscalYear } from '@/hooks/useFiscalYears';
import { useUpsertTaxSettings } from '@/hooks/useAccounting';
import { useCreateDefaultAccounts, useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'fiscal_year' | 'tax' | 'accounts' | 'done';

const STEPS: Step[] = ['welcome', 'fiscal_year', 'tax', 'accounts', 'done'];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { company } = useCompany();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [fiscalYearData, setFiscalYearData] = useState({
    name: `السنة المالية ${new Date().getFullYear()}`,
    start_date: `${new Date().getFullYear()}-01-01`,
    end_date: `${new Date().getFullYear()}-12-31`,
  });
  const [taxData, setTaxData] = useState({
    enabled: true,
    rate: 15,
    apply_to_sales: true,
    apply_to_purchases: true,
    company_name_ar: company?.name || '',
    tax_number: '',
    national_address: '',
    city: '',
    postal_code: '',
    building_number: '',
    commercial_register: '',
  });
  
  const createFiscalYear = useCreateFiscalYear();
  const upsertTaxSettings = useUpsertTaxSettings();
  const createDefaultAccounts = useCreateDefaultAccounts();
  const { data: accounts = [] } = useAccounts();
  
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const goNext = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1]);
  };

  const goPrev = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
  };

  const handleCreateFiscalYear = async () => {
    setIsProcessing(true);
    try {
      await createFiscalYear.mutateAsync({
        name: fiscalYearData.name,
        start_date: fiscalYearData.start_date,
        end_date: fiscalYearData.end_date,
        is_current: true,
      });
      setCompletedSteps(prev => new Set([...prev, 'fiscal_year']));
      toast.success('✅ تم إنشاء السنة المالية بنجاح');
      goNext();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في إنشاء السنة المالية');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTax = async () => {
    setIsProcessing(true);
    try {
      await upsertTaxSettings.mutateAsync({
        tax_name: 'ضريبة القيمة المضافة',
        tax_rate: taxData.rate,
        is_active: taxData.enabled,
        apply_to_sales: taxData.apply_to_sales,
        apply_to_purchases: taxData.apply_to_purchases,
        company_name_ar: taxData.company_name_ar,
        tax_number: taxData.tax_number,
        national_address: taxData.national_address,
        city: taxData.city,
        postal_code: taxData.postal_code,
        building_number: taxData.building_number,
        commercial_register: taxData.commercial_register,
      });
      setCompletedSteps(prev => new Set([...prev, 'tax']));
      toast.success('✅ تم حفظ إعدادات الضريبة');
      goNext();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في حفظ إعدادات الضريبة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccounts = async () => {
    if (accounts.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 'accounts']));
      toast.success('✅ شجرة الحسابات موجودة بالفعل');
      goNext();
      return;
    }
    setIsProcessing(true);
    try {
      await createDefaultAccounts.mutateAsync();
      setCompletedSteps(prev => new Set([...prev, 'accounts']));
      toast.success('✅ تم إنشاء شجرة الحسابات');
      goNext();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في إنشاء شجرة الحسابات');
    } finally {
      setIsProcessing(false);
    }
  };

  const stepIcons: Record<Step, typeof Calendar> = {
    welcome: Sparkles,
    fiscal_year: Calendar,
    tax: Receipt,
    accounts: Building2,
    done: CheckCircle2,
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>إعداد النظام</span>
            <span>{stepIndex + 1} / {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step, i) => {
              const Icon = stepIcons[step];
              const isDone = completedSteps.has(step);
              const isCurrent = currentStep === step;
              return (
                <div key={step} className={`flex flex-col items-center gap-1 ${isCurrent ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCurrent ? 'border-primary bg-primary/10' : isDone ? 'border-green-600 bg-green-50' : 'border-muted'}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-2">
          {currentStep === 'welcome' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">مرحباً بك في {company?.name || 'النظام'} 🎉</CardTitle>
                <CardDescription className="text-base mt-2">
                  سنقوم بإعداد نظامك المحاسبي في 3 خطوات بسيطة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {[
                    { icon: Calendar, title: 'السنة المالية', desc: 'تحديد فترة السنة المالية الحالية' },
                    { icon: Receipt, title: 'إعدادات الضريبة', desc: 'ضريبة القيمة المضافة (VAT 15%)' },
                    { icon: Building2, title: 'شجرة الحسابات', desc: 'إنشاء دليل الحسابات المناسب لنشاطك' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Badge variant="outline" className="mr-auto">{i + 1}</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" size="lg" onClick={goNext}>
                  ابدأ الإعداد <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 'fiscal_year' && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  الخطوة 1: السنة المالية
                </CardTitle>
                <CardDescription>حدد فترة السنة المالية الحالية لشركتك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم السنة المالية</Label>
                  <Input
                    value={fiscalYearData.name}
                    onChange={e => setFiscalYearData(d => ({ ...d, name: e.target.value }))}
                    placeholder="السنة المالية 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البداية</Label>
                    <Input
                      type="date"
                      value={fiscalYearData.start_date}
                      onChange={e => setFiscalYearData(d => ({ ...d, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ النهاية</Label>
                    <Input
                      type="date"
                      value={fiscalYearData.end_date}
                      onChange={e => setFiscalYearData(d => ({ ...d, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowRight className="w-4 h-4 ml-2" /> السابق
                  </Button>
                  <Button className="flex-1" onClick={handleCreateFiscalYear} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    إنشاء السنة المالية
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'tax' && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  الخطوة 2: إعدادات الضريبة
                </CardTitle>
                <CardDescription>تفعيل ضريبة القيمة المضافة حسب نظام هيئة الزكاة والضريبة والجمارك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Info for E-Invoice */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                    بيانات الشركة للفوترة الإلكترونية (ZATCA)
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">اسم الشركة (عربي)</Label>
                      <Input
                        value={taxData.company_name_ar}
                        onChange={e => setTaxData(d => ({ ...d, company_name_ar: e.target.value }))}
                        placeholder="اسم المنشأة كما في السجل التجاري"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">الرقم الضريبي (VAT Number)</Label>
                        <Input
                          value={taxData.tax_number}
                          onChange={e => setTaxData(d => ({ ...d, tax_number: e.target.value }))}
                          placeholder="3XXXXXXXXXX003"
                          maxLength={15}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">السجل التجاري</Label>
                        <Input
                          value={taxData.commercial_register}
                          onChange={e => setTaxData(d => ({ ...d, commercial_register: e.target.value }))}
                          placeholder="XXXXXXXXXX"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنوان الوطني</Label>
                      <Input
                        value={taxData.national_address}
                        onChange={e => setTaxData(d => ({ ...d, national_address: e.target.value }))}
                        placeholder="الحي، الشارع"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">المدينة</Label>
                        <Input
                          value={taxData.city}
                          onChange={e => setTaxData(d => ({ ...d, city: e.target.value }))}
                          placeholder="الرياض"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">الرمز البريدي</Label>
                        <Input
                          value={taxData.postal_code}
                          onChange={e => setTaxData(d => ({ ...d, postal_code: e.target.value }))}
                          placeholder="XXXXX"
                          maxLength={5}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">رقم المبنى</Label>
                        <Input
                          value={taxData.building_number}
                          onChange={e => setTaxData(d => ({ ...d, building_number: e.target.value }))}
                          placeholder="XXXX"
                          maxLength={4}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* VAT Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">تفعيل ضريبة القيمة المضافة (VAT)</p>
                    <p className="text-sm text-muted-foreground">النسبة الأساسية 15%</p>
                  </div>
                  <Switch
                    checked={taxData.enabled}
                    onCheckedChange={checked => setTaxData(d => ({ ...d, enabled: checked }))}
                  />
                </div>
                {taxData.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>نسبة الضريبة (%)</Label>
                      <Input
                        type="number"
                        value={taxData.rate}
                        onChange={e => setTaxData(d => ({ ...d, rate: Number(e.target.value) }))}
                        min={0} max={100}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">تطبيق على المبيعات</span>
                        <Switch
                          checked={taxData.apply_to_sales}
                          onCheckedChange={checked => setTaxData(d => ({ ...d, apply_to_sales: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">تطبيق على المشتريات</span>
                        <Switch
                          checked={taxData.apply_to_purchases}
                          onCheckedChange={checked => setTaxData(d => ({ ...d, apply_to_purchases: checked }))}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowRight className="w-4 h-4 ml-2" /> السابق
                  </Button>
                  <Button className="flex-1" onClick={handleSaveTax} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    حفظ إعدادات الضريبة
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'accounts' && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  الخطوة 3: شجرة الحسابات
                </CardTitle>
                <CardDescription>
                  {accounts.length > 0 
                    ? `لديك بالفعل ${accounts.length} حساب - يمكنك المتابعة`
                    : 'سيتم إنشاء شجرة حسابات مناسبة لنوع نشاطك'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="font-medium">نوع النشاط: <Badge>{company?.company_type || 'عام'}</Badge></p>
                  <p className="text-sm text-muted-foreground">
                    سيتم إنشاء الحسابات الأساسية: الأصول، الخصوم، حقوق الملكية، الإيرادات، والمصروفات
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowRight className="w-4 h-4 ml-2" /> السابق
                  </Button>
                  <Button className="flex-1" onClick={handleCreateAccounts} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    {accounts.length > 0 ? 'متابعة' : 'إنشاء شجرة الحسابات'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'done' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">تم إعداد النظام بنجاح! 🎉</CardTitle>
                <CardDescription className="text-base mt-2">
                  نظامك المحاسبي جاهز للاستخدام الآن
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  {[
                    { label: 'السنة المالية', done: completedSteps.has('fiscal_year') },
                    { label: 'إعدادات الضريبة', done: completedSteps.has('tax') },
                    { label: 'شجرة الحسابات', done: completedSteps.has('accounts') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <CheckCircle2 className={`w-5 h-5 ${item.done ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                      {item.done && <Badge variant="outline" className="mr-auto text-green-600">تم</Badge>}
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="lg" onClick={onComplete}>
                  ابدأ استخدام النظام <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
