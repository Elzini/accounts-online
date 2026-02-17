import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, ArrowRight, Command, CornerDownLeft } from 'lucide-react';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface SearchItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  section: string;
  sectionEn: string;
  icon: string;
  keywords?: string[];
}

// All searchable pages
const ALL_SEARCH_ITEMS: SearchItem[] = [
  // Dashboard
  { id: 'dashboard', label: 'الرئيسية', labelEn: 'Dashboard', section: 'الرئيسية', sectionEn: 'Main', icon: 'LayoutDashboard' },
  // Sales
  { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', section: 'المبيعات', sectionEn: 'Sales', icon: 'DollarSign', keywords: ['invoice', 'bill', 'فاتورة'] },
  { id: 'customers', label: 'العملاء', labelEn: 'Customers', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users', keywords: ['client', 'عميل'] },
  { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', section: 'المبيعات', sectionEn: 'Sales', icon: 'FileCheck' },
  { id: 'installments', label: 'الأقساط', labelEn: 'Installments', section: 'المبيعات', sectionEn: 'Sales', icon: 'CreditCard' },
  { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users' },
  { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', section: 'المبيعات', sectionEn: 'Sales', icon: 'Star' },
  { id: 'sales-targets', label: 'المبيعات المستهدفة', labelEn: 'Sales Targets', section: 'المبيعات', sectionEn: 'Sales', icon: 'Award' },
  { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', section: 'المبيعات', sectionEn: 'Sales', icon: 'CalendarCheck' },
  { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', section: 'المبيعات', sectionEn: 'Sales', icon: 'RotateCcw' },
  { id: 'sales-report', label: 'تقارير المبيعات', labelEn: 'Sales Reports', section: 'المبيعات', sectionEn: 'Sales', icon: 'DollarSign' },
  { id: 'customers-report', label: 'تقارير العملاء', labelEn: 'Customers Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users' },
  // Purchases
  { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ShoppingCart' },
  { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Truck' },
  { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Orders', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ShoppingCart' },
  { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ArrowDownToLine' },
  { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Wallet' },
  { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', section: 'المشتريات', sectionEn: 'Purchases', icon: 'RotateCw' },
  { id: 'currencies', label: 'العملات', labelEn: 'Currencies', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Coins' },
  // Accounting
  { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Receipt' },
  { id: 'journal-entries', label: 'القيود اليومية', labelEn: 'Journal Entries', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Calculator' },
  { id: 'general-ledger', label: 'دفتر الأستاذ', labelEn: 'General Ledger', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'FileText' },
  { id: 'account-statement', label: 'كشف حساب', labelEn: 'Account Statement', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'ClipboardList' },
  { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'BookOpen' },
  { id: 'banking', label: 'البنوك', labelEn: 'Banking', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Scale' },
  { id: 'checks', label: 'الشيكات', labelEn: 'Checks', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'ClipboardCheck' },
  { id: 'custody', label: 'العهد', labelEn: 'Custody', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'KeyRound', keywords: ['عهدة', 'العهده', 'عهده', 'سلفة', 'custody'] },
  { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'CalendarClock', keywords: ['مصروف مقدم', 'إيجار', 'prepaid'] },
  { id: 'financing', label: 'التمويل', labelEn: 'Financing', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Landmark' },
  { id: 'tax-settings', label: 'إعدادات الضرائب', labelEn: 'Tax Settings', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Percent' },
  { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'PieChart' },
  { id: 'trial-balance-analysis', label: 'ميزان المراجعة', labelEn: 'Trial Balance', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'FileSpreadsheet' },
  { id: 'budgets', label: 'الموازنات', labelEn: 'Budgets', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'BarChart3' },
  { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Boxes' },
  { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Target' },
  // Inventory
  { id: 'items-catalog', label: 'الأصناف', labelEn: 'Items', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Package' },
  { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Warehouse' },
  { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', section: 'المستودعات', sectionEn: 'Inventory', icon: 'ArrowUpFromLine' },
  { id: 'stocktaking', label: 'الجرد', labelEn: 'Stocktaking', section: 'المستودعات', sectionEn: 'Inventory', icon: 'ClipboardList' },
  { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Factory' },
  // HR
  { id: 'employees', label: 'الموظفين', labelEn: 'Employees', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Users' },
  { id: 'payroll', label: 'الرواتب', labelEn: 'Payroll', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'CreditCard' },
  { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Clock' },
  { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'CalendarDays' },
  { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Employee Contracts', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'FileSignature' },
  // Operations
  { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', section: 'العمليات', sectionEn: 'Operations', icon: 'Wrench' },
  { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', section: 'العمليات', sectionEn: 'Operations', icon: 'Play' },
  { id: 'trips', label: 'الرحلات', labelEn: 'Trips', section: 'العمليات', sectionEn: 'Operations', icon: 'MapPin' },
  { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', section: 'العمليات', sectionEn: 'Operations', icon: 'Home' },
  { id: 'advanced-projects', label: 'إدارة مشاريع', labelEn: 'Advanced Projects', section: 'العمليات', sectionEn: 'Operations', icon: 'LayoutGrid' },
  // System
  { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'User Management', section: 'النظام', sectionEn: 'System', icon: 'UserCog' },
  { id: 'app-settings', label: 'إعدادات التطبيق', labelEn: 'App Settings', section: 'النظام', sectionEn: 'System', icon: 'Settings' },
  { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', section: 'النظام', sectionEn: 'System', icon: 'Settings2' },
  { id: 'audit-logs', label: 'سجل العمليات', labelEn: 'Audit Logs', section: 'النظام', sectionEn: 'System', icon: 'ClipboardList' },
  { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', section: 'النظام', sectionEn: 'System', icon: 'Database' },
  { id: 'branches', label: 'الفروع', labelEn: 'Branches', section: 'النظام', sectionEn: 'System', icon: 'GitFork' },
  { id: 'tasks', label: 'المهام', labelEn: 'Tasks', section: 'النظام', sectionEn: 'System', icon: 'ListTodo' },
  // New modules
  { id: 'pos', label: 'نقطة البيع', labelEn: 'Point of Sale', section: 'المبيعات', sectionEn: 'Sales', icon: 'Monitor' },
  { id: 'recruitment', label: 'التوظيف', labelEn: 'Recruitment', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Users' },
  { id: 'fleet', label: 'إدارة الأسطول', labelEn: 'Fleet', section: 'العمليات', sectionEn: 'Operations', icon: 'Truck' },
  { id: 'maintenance', label: 'الصيانة', labelEn: 'Maintenance', section: 'العمليات', sectionEn: 'Operations', icon: 'Wrench' },
  { id: 'internal-chat', label: 'المحادثة الداخلية', labelEn: 'Internal Chat', section: 'النظام', sectionEn: 'System', icon: 'MessageCircle' },
  { id: 'helpdesk', label: 'الدعم الفني', labelEn: 'Helpdesk', section: 'العمليات', sectionEn: 'Operations', icon: 'Wrench' },
];

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setActivePage: (page: ActivePage) => void;
}

export function GlobalSearchDialog({ open, onOpenChange, setActivePage }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_SEARCH_ITEMS.slice(0, 15);
    const q = query.toLowerCase();
    return ALL_SEARCH_ITEMS.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.labelEn.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q) ||
      item.sectionEn.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((item: SearchItem) => {
    setActivePage(item.id);
    onOpenChange(false);
    setQuery('');
  }, [setActivePage, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  // Get icon component
  const getIcon = (iconName: string) => {
    const IconComp = (Icons as any)[iconName];
    return IconComp || Icons.FileText;
  };

  // Group by section
  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filtered.forEach(item => {
      const key = isAr ? item.section : item.sectionEn;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filtered, isAr]);

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'ابحث في جميع الوحدات...' : 'Search all modules...'}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isAr ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                  {section}
                </p>
                {items.map(item => {
                  flatIndex++;
                  const idx = flatIndex;
                  const Icon = getIcon(item.icon);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        idx === selectedIndex
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0 opacity-60" />
                      <span className="flex-1 text-start truncate">
                        {isAr ? item.label : item.labelEn}
                      </span>
                      <CornerDownLeft className={cn("w-3 h-3 text-muted-foreground opacity-0 transition-opacity", idx === selectedIndex && "opacity-100")} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↑↓</kbd>
            {isAr ? 'للتنقل' : 'Navigate'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↵</kbd>
            {isAr ? 'للفتح' : 'Open'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded font-mono">Esc</kbd>
            {isAr ? 'للإغلاق' : 'Close'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
