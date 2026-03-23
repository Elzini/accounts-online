import { AccountMappingType } from './types';

// قواعد الربط التلقائي حسب رمز الحساب
export const AUTO_MAPPING_RULES: { prefix: string; type: AccountMappingType; label: string }[] = [
  // === 1 - الأصول ===
  { prefix: '11', type: 'non_current_assets', label: 'أصول ثابتة (صافي الأصول الثابتة)' },
  { prefix: '12', type: 'current_assets', label: 'أصول متداولة (بنوك، عهد)' },
  { prefix: '13', type: 'current_assets', label: 'حسابات مدينة أخرى' },
  { prefix: '14', type: 'current_assets', label: 'أصول متداولة أخرى' },
  { prefix: '15', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '16', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '17', type: 'non_current_assets', label: 'استثمارات' },
  { prefix: '18', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '19', type: 'non_current_assets', label: 'أصول غير متداولة' },
  { prefix: '1', type: 'current_assets', label: 'أصول' },

  // === 2 - الخصوم وحقوق الملكية ===
  { prefix: '21', type: 'current_liabilities', label: 'خصوم متداولة' },
  { prefix: '22', type: 'current_liabilities', label: 'خصوم متداولة' },
  { prefix: '23', type: 'current_liabilities', label: 'أرصدة دائنة أخرى' },
  { prefix: '24', type: 'non_current_liabilities', label: 'خصوم غير متداولة' },
  { prefix: '25', type: 'equity', label: 'حقوق الملكية ورأس المال' },
  { prefix: '26', type: 'equity', label: 'حقوق ملكية' },
  { prefix: '2', type: 'current_liabilities', label: 'خصوم' },

  // === 3 - الإيرادات ===
  { prefix: '31', type: 'revenue', label: 'المبيعات' },
  { prefix: '32', type: 'revenue', label: 'إيرادات أخرى' },
  { prefix: '3', type: 'revenue', label: 'إيرادات' },

  // === 4 - المصروفات ===
  { prefix: '41', type: 'expenses', label: 'المصاريف العمومية والإدارية' },
  { prefix: '42', type: 'expenses', label: 'مصروفات أخرى' },
  { prefix: '43', type: 'expenses', label: 'مصروفات' },
  { prefix: '44', type: 'expenses', label: 'مصاريف التشغيل' },
  { prefix: '45', type: 'cogs', label: 'المشتريات' },
  { prefix: '46', type: 'expenses', label: 'مصروفات' },
  { prefix: '4', type: 'expenses', label: 'مصروفات' },

  // === دعم الترميز القديم (5xxx، 6xxx) ===
  { prefix: '51', type: 'cogs', label: 'تكلفة البضاعة المباعة' },
  { prefix: '52', type: 'expenses', label: 'مصروفات تشغيلية' },
  { prefix: '53', type: 'expenses', label: 'مصروفات إدارية' },
  { prefix: '54', type: 'expenses', label: 'مصروفات عمومية' },
  { prefix: '55', type: 'expenses', label: 'مصروفات أخرى' },
  { prefix: '5', type: 'expenses', label: 'مصروفات' },
  { prefix: '6', type: 'expenses', label: 'مصروفات' },
];

// قواعد الربط بالاسم العربي
export const NAME_MAPPING_RULES: { keywords: string[]; type: AccountMappingType }[] = [
  // === أصول متداولة ===
  { keywords: ['نقد', 'صندوق', 'كاش', 'خزينة', 'cash'], type: 'current_assets' },
  { keywords: ['بنك', 'مصرف', 'bank', 'حساب جاري'], type: 'current_assets' },
  { keywords: ['عملاء', 'ذمم مدينة', 'مدينون', 'حسابات مدينة', 'receivable'], type: 'current_assets' },
  { keywords: ['مخزون', 'بضاعة', 'بضائع', 'مواد', 'inventory', 'stock'], type: 'current_assets' },
  { keywords: ['مصاريف مدفوعة مقدما', 'مصروفات مقدمة', 'دفعات مقدمة', 'prepaid'], type: 'current_assets' },
  { keywords: ['أوراق قبض', 'شيكات محصلة', 'كمبيالات'], type: 'current_assets' },
  { keywords: ['أصول متداولة', 'الأصول المتداولة', 'current assets'], type: 'current_assets' },

  // === أصول غير متداولة ===
  { keywords: ['أصول ثابتة', 'الأصول الثابتة', 'صافي الأصول الثابتة', 'fixed assets'], type: 'non_current_assets' },
  { keywords: ['أثاث', 'الأثاث', 'مفروشات', 'تجهيزات', 'furniture'], type: 'non_current_assets' },
  { keywords: ['معدات', 'آلات', 'الات', 'اجهزه', 'أجهزة', 'ماكينات', 'equipment', 'machinery'], type: 'non_current_assets' },
  { keywords: ['سيارات', 'مركبات', 'وسائل نقل', 'vehicles'], type: 'non_current_assets' },
  { keywords: ['عقارات', 'مباني', 'أراضي', 'ارض', 'buildings', 'land'], type: 'non_current_assets' },
  { keywords: ['استهلاك', 'إهلاك', 'اهلاك', 'مجمع الاستهلاك', 'مجمع الإهلاك', 'depreciation'], type: 'non_current_assets' },
  { keywords: ['استثمارات طويلة', 'استثمارات', 'investments'], type: 'non_current_assets' },
  { keywords: ['أصول غير متداولة', 'الأصول غير المتداولة', 'non-current'], type: 'non_current_assets' },
  { keywords: ['شهرة', 'goodwill', 'أصول غير ملموسة', 'برامج', 'حقوق'], type: 'non_current_assets' },

  // === مطلوبات متداولة ===
  { keywords: ['موردين', 'موردون', 'دائنون', 'ذمم دائنة', 'حسابات دائنة', 'payable'], type: 'current_liabilities' },
  { keywords: ['أوراق دفع', 'شيكات مستحقة'], type: 'current_liabilities' },
  { keywords: ['ضريبة القيمة المضافة', 'ضريبة مستحقة', 'vat', 'زكاة مستحقة'], type: 'current_liabilities' },
  { keywords: ['رواتب مستحقة', 'أجور مستحقة', 'مستحقات الموظفين'], type: 'current_liabilities' },
  { keywords: ['مصاريف مستحقة', 'مصروفات مستحقة', 'التزامات متداولة', 'accrued'], type: 'current_liabilities' },
  { keywords: ['إيرادات مقدمة', 'إيرادات مؤجلة', 'دفعات مقدمة من عملاء', 'unearned'], type: 'current_liabilities' },
  { keywords: ['قروض قصيرة', 'تسهيلات بنكية', 'سحب على المكشوف'], type: 'current_liabilities' },
  { keywords: ['مطلوبات متداولة', 'المطلوبات المتداولة', 'خصوم متداولة', 'current liabilities'], type: 'current_liabilities' },

  // === مطلوبات غير متداولة ===
  { keywords: ['قروض طويلة', 'قروض بنكية طويلة', 'تمويل طويل', 'long-term'], type: 'non_current_liabilities' },
  { keywords: ['مكافأة نهاية الخدمة', 'مكافآت نهاية', 'end of service'], type: 'non_current_liabilities' },
  { keywords: ['مطلوبات غير متداولة', 'المطلوبات غير المتداولة', 'خصوم غير متداولة'], type: 'non_current_liabilities' },

  // === حقوق ملكية ===
  { keywords: ['رأس المال', 'رأسمال', 'رأس مال', 'capital'], type: 'equity' },
  { keywords: ['احتياطي', 'الاحتياطي', 'reserve'], type: 'equity' },
  { keywords: ['أرباح محتجزة', 'أرباح مبقاة', 'أرباح مرحلة', 'retained'], type: 'equity' },
  { keywords: ['جاري الشريك', 'جاري المالك', 'حساب المالك', 'جاري صاحب', 'مسحوبات'], type: 'equity' },
  { keywords: ['حقوق ملكية', 'حقوق المساهمين', 'حقوق الملاك', 'equity'], type: 'equity' },
  { keywords: ['أرباح العام', 'صافي الربح', 'صافي الخسارة', 'نتيجة النشاط', 'net income'], type: 'equity' },

  // === إيرادات ===
  { keywords: ['إيراد', 'ايراد', 'إيرادات', 'ايرادات', 'revenue', 'income'], type: 'revenue' },
  { keywords: ['مبيعات', 'المبيعات', 'sales'], type: 'revenue' },
  { keywords: ['خدمات', 'أتعاب', 'عمولات مكتسبة'], type: 'revenue' },
  { keywords: ['إيرادات أخرى', 'دخل آخر', 'other income'], type: 'revenue' },

  // === تكلفة الإيرادات ===
  { keywords: ['تكلفة المبيعات', 'تكلفة البضاعة', 'تكلفة الإيرادات', 'تكلفة البضائع', 'cost of goods', 'cogs'], type: 'cogs' },
  { keywords: ['تكاليف مباشرة', 'مواد مباشرة', 'أجور مباشرة'], type: 'cogs' },

  // === مصروفات ===
  { keywords: ['مصروف', 'مصاريف', 'مصروفات', 'نفقات', 'expense'], type: 'expenses' },
  { keywords: ['رواتب', 'أجور', 'salaries', 'wages'], type: 'expenses' },
  { keywords: ['إيجار', 'ايجار', 'rent'], type: 'expenses' },
  { keywords: ['كهرباء', 'ماء', 'هاتف', 'اتصالات', 'utilities'], type: 'expenses' },
  { keywords: ['صيانة', 'إصلاح', 'maintenance'], type: 'expenses' },
  { keywords: ['تأمين', 'insurance'], type: 'expenses' },
  { keywords: ['دعاية', 'إعلان', 'تسويق', 'marketing'], type: 'expenses' },
  { keywords: ['مصاريف إدارية', 'مصاريف عمومية', 'مصاريف تشغيلية', 'operating'], type: 'expenses' },
  { keywords: ['فوائد', 'عمولات بنكية', 'مصاريف بنكية', 'interest'], type: 'expenses' },
  { keywords: ['ضيافة', 'سفر', 'انتقالات', 'بدلات'], type: 'expenses' },
];

// ربط الحساب تلقائياً حسب الرمز ثم الاسم
export function autoMapAccount(code: string, name: string): AccountMappingType {
  const cleanCode = code.trim();
  
  // 1) ربط بالرمز
  if (/^\d/.test(cleanCode)) {
    for (const rule of AUTO_MAPPING_RULES) {
      if (cleanCode.startsWith(rule.prefix)) {
        return rule.type;
      }
    }
  }
  
  // 2) ربط بالاسم
  const nameNormalized = name.trim();
  for (const rule of NAME_MAPPING_RULES) {
    for (const keyword of rule.keywords) {
      if (nameNormalized.includes(keyword)) {
        return rule.type;
      }
    }
  }

  // 3) محاولة أخيرة
  if (nameNormalized === 'الأصول' || nameNormalized === 'أصول') return 'current_assets';
  if (nameNormalized === 'الخصوم' || nameNormalized === 'المطلوبات' || nameNormalized === 'الالتزامات') return 'current_liabilities';
  
  return 'unmapped';
}
