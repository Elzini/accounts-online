import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, Hammer, Receipt, ArrowDownUp, Banknote, Calculator, Shield, Users, Home } from 'lucide-react';

export interface TemplateLineDefinition {
  accountCode: string;
  accountName: string;
  description: string;
  side: 'debit' | 'credit';
}

export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  defaultDescription: string;
  lines: TemplateLineDefinition[];
}

const realEstateTemplates: JournalTemplate[] = [
  // ===== 1. شراء الأراضي =====
  {
    id: 'land-purchase',
    name: 'شراء أرض مشروع',
    description: 'تسجيل شراء أرض لمشروع تطوير عقاري مع ضريبة التصرفات العقارية RETT',
    category: 'المشتريات والأراضي',
    icon: <Building2 className="w-5 h-5" />,
    defaultDescription: 'شراء أرض مشروع - ضريبة تصرفات عقارية',
    lines: [
      { accountCode: '130101', accountName: 'مشاريع تحت التطوير - تكلفة الأرض', description: 'قيمة الأرض', side: 'debit' },
      { accountCode: '1184', accountName: 'ضريبة التصرفات العقارية المدفوعة RETT', description: 'ضريبة تصرفات عقارية 5%', side: 'debit' },
      { accountCode: '1102', accountName: 'البنك / الصندوق', description: 'المبلغ المدفوع', side: 'credit' },
    ],
  },
  {
    id: 'land-purchase-installment',
    name: 'شراء أرض بالتقسيط',
    description: 'شراء أرض مع دفعة أولى والباقي أقساط',
    category: 'المشتريات والأراضي',
    icon: <Building2 className="w-5 h-5" />,
    defaultDescription: 'شراء أرض بالتقسيط - دفعة أولى',
    lines: [
      { accountCode: '130101', accountName: 'مشاريع تحت التطوير - تكلفة الأرض', description: 'قيمة الأرض الكاملة', side: 'debit' },
      { accountCode: '1184', accountName: 'ضريبة التصرفات العقارية RETT', description: 'ضريبة تصرفات عقارية 5%', side: 'debit' },
      { accountCode: '1102', accountName: 'البنك', description: 'الدفعة الأولى المدفوعة', side: 'credit' },
      { accountCode: '2101', accountName: 'دائنون / ذمم دائنة', description: 'باقي الأقساط المستحقة', side: 'credit' },
    ],
  },

  // ===== 2. مستخلصات المقاولين =====
  {
    id: 'contractor-progress',
    name: 'مستخلص مقاول إنشاء',
    description: 'تسجيل مستخلص مقاول مع محتجز ضمان 10% وضريبة القيمة المضافة',
    category: 'المقاولين والإنشاء',
    icon: <Hammer className="w-5 h-5" />,
    defaultDescription: 'مستخلص مقاول - إنشاءات المشروع',
    lines: [
      { accountCode: '130104', accountName: 'مشاريع تحت التطوير - الهيكل الإنشائي', description: 'قيمة المستخلص بدون ضريبة', side: 'debit' },
      { accountCode: '1108', accountName: 'ضريبة مدخلات مشاريع', description: 'ضريبة مشتريات 15%', side: 'debit' },
      { accountCode: '2115', accountName: 'محتجزات ضمان المقاولين', description: 'محتجز ضمان 10%', side: 'credit' },
      { accountCode: '2101', accountName: 'دائنون - مقاولين', description: 'صافي المستحق للمقاول', side: 'credit' },
    ],
  },
  {
    id: 'contractor-payment',
    name: 'سداد مستحقات مقاول',
    description: 'سداد المبلغ المستحق للمقاول بعد خصم المحتجز',
    category: 'المقاولين والإنشاء',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'سداد مستحقات مقاول',
    lines: [
      { accountCode: '2101', accountName: 'دائنون - مقاولين', description: 'إقفال ذمة المقاول', side: 'debit' },
      { accountCode: '1102', accountName: 'البنك', description: 'المبلغ المحول للمقاول', side: 'credit' },
    ],
  },
  {
    id: 'retention-release',
    name: 'تحرير محتجز ضمان',
    description: 'تحرير محتجز ضمان المقاول بعد انتهاء فترة الضمان',
    category: 'المقاولين والإنشاء',
    icon: <Shield className="w-5 h-5" />,
    defaultDescription: 'تحرير محتجز ضمان مقاول',
    lines: [
      { accountCode: '2115', accountName: 'محتجزات ضمان المقاولين', description: 'تحرير المحتجز', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المحول للمقاول', side: 'credit' },
    ],
  },

  // ===== 3. تكاليف التطوير والتصميم =====
  {
    id: 'design-cost',
    name: 'تكاليف تصميم ورسوم هندسية',
    description: 'رسوم تصميم معماري وإنشائي ومكاتب استشارية',
    category: 'تكاليف التطوير',
    icon: <FileText className="w-5 h-5" />,
    defaultDescription: 'رسوم تصميم واستشارات هندسية',
    lines: [
      { accountCode: '1251', accountName: 'مشاريع تحت التطوير - استشارات هندسية', description: 'رسوم التصميم والاستشارات', side: 'debit' },
      { accountCode: '1181', accountName: 'ضريبة مدخلات مشاريع', description: 'ضريبة مشتريات 15%', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المدفوع', side: 'credit' },
    ],
  },
  {
    id: 'permit-fees',
    name: 'رسوم تراخيص وتصاريح',
    description: 'رسوم البلدية ورخص البناء والتراخيص الحكومية',
    category: 'تكاليف التطوير',
    icon: <Receipt className="w-5 h-5" />,
    defaultDescription: 'رسوم تراخيص وتصاريح بناء',
    lines: [
      { accountCode: '1260', accountName: 'مشاريع تحت التطوير - تراخيص البلدية', description: 'رسوم تراخيص حكومية', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المدفوع', side: 'credit' },
    ],
  },

  // ===== 4. الدفعات المقدمة من العملاء =====
  {
    id: 'customer-advance',
    name: 'دفعة مقدمة من عميل (حجز وحدة)',
    description: 'تسجيل دفعة مقدمة / عربون من العميل عند حجز وحدة سكنية - التزام تعاقدي IFRS 15',
    category: 'المبيعات والعملاء',
    icon: <Users className="w-5 h-5" />,
    defaultDescription: 'دفعة مقدمة من عميل - حجز وحدة',
    lines: [
      { accountCode: '1121', accountName: 'البنك / الصندوق', description: 'المبلغ المستلم من العميل', side: 'debit' },
      { accountCode: '2120', accountName: 'دفعات مقدمة من العملاء (التزام تعاقدي)', description: 'دفعة مقدمة - حجز وحدة', side: 'credit' },
    ],
  },
  {
    id: 'customer-installment',
    name: 'تحصيل قسط من عميل',
    description: 'تحصيل قسط دوري من عميل على وحدة سكنية',
    category: 'المبيعات والعملاء',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'تحصيل قسط من عميل',
    lines: [
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المحصل', side: 'debit' },
      { accountCode: '1130', accountName: 'ذمم مدينة - عملاء', description: 'تخفيض رصيد العميل', side: 'credit' },
    ],
  },

  // ===== 5. الاعتراف بالإيراد عند التسليم (IFRS 15) =====
  {
    id: 'revenue-recognition',
    name: 'اعتراف بإيراد بيع وحدة (عند التسليم)',
    description: 'تسجيل إيراد بيع وحدة عقارية عند انتقال السيطرة للعميل وفق IFRS 15 مع ترحيل الدفعات المقدمة',
    category: 'المبيعات والعملاء',
    icon: <Home className="w-5 h-5" />,
    defaultDescription: 'اعتراف بإيراد بيع وحدة عقارية عند التسليم',
    lines: [
      { accountCode: '1130', accountName: 'ذمم مدينة - عملاء', description: 'إجمالي قيمة البيع (بدون ضريبة)', side: 'debit' },
      { accountCode: '2120', accountName: 'دفعات مقدمة من العملاء', description: 'ترحيل الدفعات المقدمة المستلمة', side: 'debit' },
      { accountCode: '4110', accountName: 'إيرادات بيع وحدات عقارية', description: 'إيراد البيع', side: 'credit' },
      { accountCode: '2150', accountName: 'ضريبة القيمة المضافة المستحقة', description: 'ضريبة مبيعات 15%', side: 'credit' },
    ],
  },

  // ===== 6. تحويل التكلفة إلى تكلفة المبيعات =====
  {
    id: 'cogs-transfer',
    name: 'تحويل تكلفة الوحدة المباعة (COGS)',
    description: 'ترحيل تكلفة الوحدة المباعة من حساب المشاريع تحت التطوير إلى تكلفة المبيعات',
    category: 'المبيعات والعملاء',
    icon: <ArrowDownUp className="w-5 h-5" />,
    defaultDescription: 'تحويل تكلفة وحدة مباعة إلى تكلفة المبيعات',
    lines: [
      { accountCode: '5110', accountName: 'تكلفة البناء / الوحدات المباعة', description: 'تكلفة الوحدة المباعة', side: 'debit' },
      { accountCode: '1220', accountName: 'مشاريع تحت التطوير', description: 'نصيب الوحدة من تكلفة المشروع', side: 'credit' },
    ],
  },

  // ===== 7. ضريبة التصرفات العقارية =====
  {
    id: 'rett-on-sale',
    name: 'ضريبة تصرفات عقارية على البيع RETT',
    description: 'تسجيل ضريبة التصرفات العقارية 5% المستحقة عند بيع وحدة',
    category: 'الضرائب',
    icon: <Calculator className="w-5 h-5" />,
    defaultDescription: 'ضريبة تصرفات عقارية مستحقة على بيع وحدة',
    lines: [
      { accountCode: '5190', accountName: 'تكلفة ضريبة التصرفات العقارية', description: 'ضريبة RETT 5% على قيمة البيع', side: 'debit' },
      { accountCode: '2156', accountName: 'ضريبة تصرفات عقارية مستحقة', description: 'مستحق للهيئة', side: 'credit' },
    ],
  },
  {
    id: 'rett-payment',
    name: 'سداد ضريبة تصرفات عقارية RETT',
    description: 'سداد ضريبة التصرفات العقارية المستحقة للهيئة',
    category: 'الضرائب',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'سداد ضريبة تصرفات عقارية للهيئة',
    lines: [
      { accountCode: '2156', accountName: 'ضريبة تصرفات عقارية مستحقة', description: 'إقفال المستحق', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المحول للهيئة', side: 'credit' },
    ],
  },
  {
    id: 'first-home-exemption',
    name: 'إعفاء المسكن الأول',
    description: 'تسجيل إعفاء ضريبة التصرفات العقارية للمسكن الأول (تحمل الدولة)',
    category: 'الضرائب',
    icon: <Home className="w-5 h-5" />,
    defaultDescription: 'إعفاء مسكن أول - تحمل الدولة',
    lines: [
      { accountCode: '1145', accountName: 'ذمم مدينة - إعفاء المسكن الأول', description: 'مبلغ الإعفاء المستحق من الدولة', side: 'debit' },
      { accountCode: '2156', accountName: 'ضريبة تصرفات عقارية مستحقة', description: 'تخفيض المستحق بمبلغ الإعفاء', side: 'credit' },
    ],
  },

  // ===== 8. تسوية ضريبة القيمة المضافة =====
  {
    id: 'vat-settlement',
    name: 'تسوية ضريبة القيمة المضافة',
    description: 'تسوية ضريبة القيمة المضافة الشهرية/ربع سنوية',
    category: 'الضرائب',
    icon: <Calculator className="w-5 h-5" />,
    defaultDescription: 'تسوية ضريبة القيمة المضافة',
    lines: [
      { accountCode: '2150', accountName: 'ضريبة القيمة المضافة المستحقة', description: 'إقفال ضريبة المبيعات', side: 'debit' },
      { accountCode: '1180', accountName: 'ضريبة مدخلات قابلة للاسترداد', description: 'إقفال ضريبة المشتريات', side: 'credit' },
      { accountCode: '2155', accountName: 'تسوية ضريبة القيمة المضافة', description: 'الفرق المستحق/لصالح الشركة', side: 'credit' },
    ],
  },

  // ===== 9. قيود التمويل =====
  {
    id: 'redf-loan',
    name: 'استلام قرض من صندوق التنمية العقارية REDF',
    description: 'تسجيل استلام تمويل من الصندوق العقاري',
    category: 'التمويل',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'استلام قرض صندوق التنمية العقارية',
    lines: [
      { accountCode: '1121', accountName: 'البنك', description: 'مبلغ القرض المستلم', side: 'debit' },
      { accountCode: '2235', accountName: 'تمويل صندوق التنمية العقاري REDF', description: 'التزام القرض', side: 'credit' },
    ],
  },
  {
    id: 'bank-financing',
    name: 'تمويل بنكي للمشروع',
    description: 'تسجيل تمويل بنكي / مرابحة لتمويل مشروع عقاري',
    category: 'التمويل',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'تمويل بنكي / مرابحة للمشروع',
    lines: [
      { accountCode: '1121', accountName: 'البنك', description: 'مبلغ التمويل المستلم', side: 'debit' },
      { accountCode: '2210', accountName: 'قروض بنكية / مرابحة', description: 'أصل التمويل', side: 'credit' },
    ],
  },
  {
    id: 'loan-repayment',
    name: 'سداد قسط تمويل بنكي',
    description: 'سداد قسط تمويل بنكي يشمل الأصل وتكلفة التمويل',
    category: 'التمويل',
    icon: <Banknote className="w-5 h-5" />,
    defaultDescription: 'سداد قسط تمويل بنكي',
    lines: [
      { accountCode: '2210', accountName: 'قروض بنكية / مرابحة', description: 'الجزء الأصلي من القسط', side: 'debit' },
      { accountCode: '6410', accountName: 'فوائد القروض / تكاليف التمويل', description: 'تكلفة التمويل', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'إجمالي القسط المدفوع', side: 'credit' },
    ],
  },

  // ===== 10. مصاريف عمومية وإدارية =====
  {
    id: 'admin-expenses',
    name: 'مصاريف عمومية وإدارية',
    description: 'تسجيل مصاريف إدارية عامة (إيجار مكتب، رواتب إدارة، خدمات)',
    category: 'المصاريف',
    icon: <Receipt className="w-5 h-5" />,
    defaultDescription: 'مصاريف عمومية وإدارية',
    lines: [
      { accountCode: '6100', accountName: 'مصروفات إدارية', description: 'المصروف', side: 'debit' },
      { accountCode: '1181', accountName: 'ضريبة مدخلات مشاريع', description: 'ضريبة 15% (إن وجدت)', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المدفوع', side: 'credit' },
    ],
  },
  {
    id: 'marketing-expenses',
    name: 'مصاريف تسويق وإعلان',
    description: 'مصاريف تسويق المشاريع العقارية والحملات الإعلانية',
    category: 'المصاريف',
    icon: <Receipt className="w-5 h-5" />,
    defaultDescription: 'مصاريف تسويق وإعلان للمشروع',
    lines: [
      { accountCode: '6200', accountName: 'مصروفات تسويق', description: 'تكاليف التسويق', side: 'debit' },
      { accountCode: '1181', accountName: 'ضريبة مدخلات مشاريع', description: 'ضريبة 15%', side: 'debit' },
      { accountCode: '1121', accountName: 'البنك', description: 'المبلغ المدفوع', side: 'credit' },
    ],
  },
];

const categoryColors: Record<string, string> = {
  'المشتريات والأراضي': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'المقاولين والإنشاء': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'تكاليف التطوير': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'المبيعات والعملاء': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'الضرائب': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'التمويل': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'المصاريف': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

interface Props {
  onSelectTemplate: (template: JournalTemplate) => void;
}

export function RealEstateJournalTemplates({ onSelectTemplate }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(realEstateTemplates.map(t => t.category))];
  const filtered = selectedCategory 
    ? realEstateTemplates.filter(t => t.category === selectedCategory) 
    : realEstateTemplates;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          قوالب القيود العقارية
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">قوالب القيود المحاسبية - التطوير العقاري</DialogTitle>
          <p className="text-sm text-muted-foreground">
            قوالب جاهزة متوافقة مع معايير SOCPA و IFRS 15 — اختر القالب وسيتم تعبئة القيد تلقائياً
          </p>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            الكل ({realEstateTemplates.length})
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedCategory === cat ? '' : categoryColors[cat] || ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({realEstateTemplates.filter(t => t.category === cat).length})
            </Badge>
          ))}
        </div>

        <ScrollArea className="h-[55vh] pr-3">
          <div className="space-y-3">
            {filtered.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => {
                  onSelectTemplate(template);
                  setOpen(false);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <Badge variant="secondary" className={`text-xs ${categoryColors[template.category] || ''}`}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.lines.map((line, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-md">
                            {line.side === 'debit' ? '⬅ مدين' : '➡ دائن'}: {line.accountCode} {line.accountName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    استخدام
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
