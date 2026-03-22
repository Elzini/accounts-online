import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Users, Truck, ShoppingCart, DollarSign, FileText,
  TrendingUp, Package, UserCog, Settings, Building2, ArrowLeftRight,
  Calculator, BookOpen, Percent, PieChart, Receipt, CreditCard,
  FileCheck, Wallet, ClipboardList, Scale, Clock, Calendar,
  FileSpreadsheet, Settings2, Boxes, FileUp, Wrench, HandCoins,
  Warehouse, FolderTree, Target, ClipboardCheck,
  BarChart3, Activity, GitBranch, CalendarDays, Factory,
  Plug, Coins, GitFork, Workflow, ArrowDownToLine, RotateCcw,
  RotateCw, Star, RefreshCw, CalendarCheck, Globe,
  LucideIcon, Landmark, Zap,
} from 'lucide-react';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommandPaletteProps {
  setActivePage: (page: ActivePage) => void;
}

interface CommandItemData {
  id: ActivePage;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  group: string;
  keywords?: string;
}

const COMMAND_ITEMS: CommandItemData[] = [
  { id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard, group: 'رئيسي', keywords: 'home main رئيسي' },

  // المبيعات
  { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, group: 'المبيعات', keywords: 'بيع فاتورة sale invoice' },
  { id: 'customers', label: 'العملاء', labelEn: 'Customers', icon: Users, group: 'المبيعات', keywords: 'عميل زبون customer client' },
  { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', icon: FileCheck, group: 'المبيعات', keywords: 'عرض سعر quote' },
  { id: 'installments', label: 'الأقساط', labelEn: 'Installments', icon: CreditCard, group: 'المبيعات', keywords: 'قسط تقسيط installment' },
  { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', icon: RotateCcw, group: 'المبيعات', keywords: 'مرتجع return credit' },
  { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', icon: DollarSign, group: 'المبيعات', keywords: 'تقرير بيع report' },
  { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', icon: Users, group: 'المبيعات', keywords: 'تقرير عملاء report' },
  { id: 'partner-dealerships', label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', icon: Building2, group: 'المبيعات', keywords: 'معرض شريك partner dealer' },
  { id: 'car-transfers', label: 'نقل السيارات', labelEn: 'Car Transfers', icon: ArrowLeftRight, group: 'المبيعات', keywords: 'نقل سيارة transfer' },

  // المشتريات
  { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, group: 'المشتريات', keywords: 'شراء فاتورة purchase buy' },
  { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', icon: Truck, group: 'المشتريات', keywords: 'مورد supplier vendor' },
  { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', icon: ShoppingCart, group: 'المشتريات', keywords: 'طلب شراء order po' },
  { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', icon: Package, group: 'المشتريات', keywords: 'طلب مواد material request' },
  { id: 'goods-receipt', label: 'سند استلام', labelEn: 'Goods Receipt', icon: ArrowDownToLine, group: 'المشتريات', keywords: 'استلام بضاعة goods receipt' },
  { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', icon: Wallet, group: 'المشتريات', keywords: 'مصروف expense cost' },
  { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', icon: RotateCw, group: 'المشتريات', keywords: 'مرتجع return' },
  { id: 'purchases-report', label: 'تقرير المشتريات', labelEn: 'Purchases Report', icon: FileText, group: 'المشتريات', keywords: 'تقرير شراء report' },
  { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', icon: Truck, group: 'المشتريات', keywords: 'تقرير موردين report' },

  // المحاسبة
  { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', icon: Receipt, group: 'المحاسبة', keywords: 'سند قبض صرف voucher receipt payment' },
  { id: 'journal-entries', label: 'القيود المحاسبية', labelEn: 'Journal Entries', icon: Calculator, group: 'المحاسبة', keywords: 'قيد محاسبي journal entry' },
  { id: 'general-ledger', label: 'الأستاذ العام', labelEn: 'General Ledger', icon: FileText, group: 'المحاسبة', keywords: 'استاذ عام ledger' },
  { id: 'account-statement', label: 'كشف حساب', labelEn: 'Account Statement', icon: ClipboardList, group: 'المحاسبة', keywords: 'كشف حساب statement' },
  { id: 'banking', label: 'البنوك', labelEn: 'Banking', icon: Scale, group: 'المحاسبة', keywords: 'بنك حساب بنكي bank' },
  { id: 'checks', label: 'الشيكات', labelEn: 'Checks', icon: ClipboardCheck, group: 'المحاسبة', keywords: 'شيك check cheque' },
  { id: 'custody', label: 'العهد', labelEn: 'Custody', icon: HandCoins, group: 'المحاسبة', keywords: 'عهدة custody' },
  { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', icon: BookOpen, group: 'المحاسبة', keywords: 'شجرة حسابات دليل chart accounts coa' },
  { id: 'trial-balance', label: 'ميزان المراجعة', labelEn: 'Trial Balance', icon: Scale, group: 'المحاسبة', keywords: 'ميزان مراجعة trial balance شامل comprehensive' },
  { id: 'financial-statements', label: 'القوائم المالية', labelEn: 'Financial Statements', icon: FileText, group: 'المحاسبة', keywords: 'قوائم مالية ميزانية financial statement' },
  { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', icon: PieChart, group: 'المحاسبة', keywords: 'تقارير مالية financial report' },
  { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', icon: TrendingUp, group: 'المحاسبة', keywords: 'ربح أرباح profit' },

  // المخازن
  { id: 'items-catalog', label: 'كتالوج الأصناف', labelEn: 'Items Catalog', icon: Package, group: 'المخازن', keywords: 'صنف منتج item product catalog' },
  { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', icon: ArrowDownToLine, group: 'المخازن', keywords: 'إذن مخزني stock voucher' },
  { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse, group: 'المخازن', keywords: 'مستودع مخزن warehouse store' },
  { id: 'inventory-report', label: 'تقرير المخزون', labelEn: 'Inventory Report', icon: Package, group: 'المخازن', keywords: 'مخزون جرد inventory stock report' },

  // الموارد البشرية
  { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users, group: 'الموارد البشرية', keywords: 'موظف employee staff' },
  { id: 'payroll', label: 'الرواتب', labelEn: 'Payroll', icon: CreditCard, group: 'الموارد البشرية', keywords: 'راتب مسير payroll salary' },
  { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock, group: 'الموارد البشرية', keywords: 'حضور انصراف attendance' },
  { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays, group: 'الموارد البشرية', keywords: 'اجازة leave vacation' },

  // النظام
  { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'Users Management', icon: UserCog, group: 'النظام', keywords: 'مستخدم user manage' },
  { id: 'branches', label: 'الفروع', labelEn: 'Branches', icon: GitFork, group: 'النظام', keywords: 'فرع branch' },
  { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', icon: Calendar, group: 'النظام', keywords: 'سنة مالية fiscal year' },
  { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', icon: GitBranch, group: 'النظام', keywords: 'موافقة اعتماد approval' },
  { id: 'app-settings', label: 'إعدادات التطبيق', labelEn: 'App Settings', icon: Settings, group: 'النظام', keywords: 'اعدادات settings config' },
  { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', icon: Settings2, group: 'النظام', keywords: 'تحكم مركز control center' },
  { id: 'backups', label: 'النسخ الاحتياطية', labelEn: 'Backups', icon: Boxes, group: 'النظام', keywords: 'نسخة احتياطية backup' },
  { id: 'audit-logs', label: 'سجل المراجعة', labelEn: 'Audit Logs', icon: ClipboardList, group: 'النظام', keywords: 'سجل مراجعة audit log' },

  // أدوات
  { id: 'tax-settings', label: 'إعدادات الضريبة', labelEn: 'Tax Settings', icon: Percent, group: 'أدوات', keywords: 'ضريبة قيمة مضافة tax vat' },
  { id: 'vat-return-report', label: 'إقرار ضريبي', labelEn: 'VAT Return', icon: Receipt, group: 'أدوات', keywords: 'اقرار ضريبي vat return' },
  { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', icon: Boxes, group: 'أدوات', keywords: 'اصل ثابت fixed asset' },
  { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', icon: Target, group: 'أدوات', keywords: 'مركز تكلفة cost center' },
  { id: 'currencies', label: 'العملات', labelEn: 'Currencies', icon: Coins, group: 'أدوات', keywords: 'عملة currency' },
  { id: 'budgets', label: 'الموازنات', labelEn: 'Budgets', icon: BarChart3, group: 'أدوات', keywords: 'موازنة ميزانية budget' },
  { id: 'aging-report', label: 'تقرير الأعمار', labelEn: 'Aging Report', icon: Clock, group: 'أدوات', keywords: 'اعمار ذمم aging' },
  { id: 'medad-import', label: 'استيراد بيانات', labelEn: 'Data Import', icon: FileUp, group: 'أدوات', keywords: 'استيراد import medad' },
  { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', icon: Plug, group: 'أدوات', keywords: 'اضافة plugin addon' },
  { id: 'integrations', label: 'التكاملات', labelEn: 'Integrations', icon: Plug, group: 'أدوات', keywords: 'تكامل ربط integration api' },
  { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', icon: Workflow, group: 'أدوات', keywords: 'دورة مستندية workflow' },
  { id: 'automation', label: 'أتمتة العمليات', labelEn: 'Automation', icon: Zap, group: 'أدوات', keywords: 'أتمتة فواتير دورية تذكيرات تحصيل automation recurring collection' },
  { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', icon: Users, group: 'أدوات', keywords: 'علاقات عملاء crm' },
  { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty', icon: Star, group: 'أدوات', keywords: 'ولاء نقاط loyalty' },
  { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', icon: CalendarCheck, group: 'أدوات', keywords: 'حجز booking reservation' },
  { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', icon: Factory, group: 'أدوات', keywords: 'تصنيع انتاج manufacturing production' },
  { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', icon: Globe, group: 'أدوات', keywords: 'بوابة عملاء portal' },
  { id: 'financial-kpis', label: 'مؤشرات الأداء', labelEn: 'Financial KPIs', icon: Activity, group: 'أدوات', keywords: 'مؤشر اداء kpi' },
  { id: 'cashflow-forecast', label: 'توقعات التدفق النقدي', labelEn: 'Cashflow Forecast', icon: TrendingUp, group: 'أدوات', keywords: 'تدفق نقدي cashflow forecast' },
  { id: 'financing', label: 'التمويل', labelEn: 'Financing', icon: Landmark, group: 'أدوات', keywords: 'تمويل قرض financing loan' },
  { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', icon: RefreshCw, group: 'أدوات', keywords: 'اشتراك subscription' },
];

function groupItems(items: CommandItemData[]): Record<string, CommandItemData[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, CommandItemData[]>);
}

export function CommandPalette({ setActivePage }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((pageId: string) => {
    setActivePage(pageId as ActivePage);
    setOpen(false);
  }, [setActivePage]);

  const grouped = useMemo(() => groupItems(COMMAND_ITEMS), []);
  const groupNames = useMemo(() => Object.keys(grouped), [grouped]);

  return (
    <>
      {/* Desktop search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-xs hover:bg-muted transition-colors min-w-[200px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-start">{language === 'ar' ? 'بحث سريع...' : 'Quick search...'}</span>
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={language === 'ar' ? 'ابحث عن صفحة أو عملية...' : 'Search for a page or action...'}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            {language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No results found'}
          </CommandEmpty>
          {groupNames.map((groupName, idx) => (
            <div key={groupName}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={groupName}>
                {grouped[groupName].map(item => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${item.labelEn} ${item.keywords || ''}`}
                      onSelect={() => handleSelect(item.id)}
                      className="flex items-center gap-3 py-2.5 cursor-pointer"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {language === 'ar' ? item.label : item.labelEn}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {language === 'ar' ? item.labelEn : item.label}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
