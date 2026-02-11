import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';

interface SearchItem {
  id: ActivePage;
  label: string;
  section: string;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: 'dashboard', label: 'الرئيسية', section: 'عام', keywords: ['لوحة التحكم', 'dashboard', 'home'] },
  { id: 'customers', label: 'العملاء', section: 'المبيعات', keywords: ['عميل', 'زبون', 'customer'] },
  { id: 'suppliers', label: 'الموردين', section: 'المشتريات', keywords: ['مورد', 'supplier'] },
  { id: 'purchases', label: 'المشتريات', section: 'المشتريات', keywords: ['شراء', 'purchase', 'سيارة'] },
  { id: 'sales', label: 'المبيعات', section: 'المبيعات', keywords: ['بيع', 'sale', 'فاتورة'] },
  { id: 'expenses', label: 'المصروفات', section: 'المالية', keywords: ['مصروف', 'expense'] },
  { id: 'chart-of-accounts', label: 'شجرة الحسابات', section: 'المحاسبة', keywords: ['حساب', 'account', 'chart'] },
  { id: 'journal-entries', label: 'القيود اليومية', section: 'المحاسبة', keywords: ['قيد', 'journal', 'entry'] },
  { id: 'general-ledger', label: 'دفتر الأستاذ', section: 'المحاسبة', keywords: ['أستاذ', 'ledger'] },
  { id: 'employees', label: 'الموظفين', section: 'الموارد البشرية', keywords: ['موظف', 'employee', 'عامل'] },
  { id: 'payroll', label: 'مسير الرواتب', section: 'الموارد البشرية', keywords: ['راتب', 'payroll', 'مسير'] },
  { id: 'custody', label: 'العهد', section: 'المالية', keywords: ['عهدة', 'custody', 'سلفة'] },
  { id: 'installments', label: 'الأقساط', section: 'المبيعات', keywords: ['قسط', 'installment', 'تقسيط'] },
  { id: 'vouchers', label: 'سندات القبض والصرف', section: 'المالية', keywords: ['سند', 'voucher', 'قبض', 'صرف'] },
  { id: 'checks', label: 'الشيكات', section: 'المالية', keywords: ['شيك', 'check'] },
  { id: 'banking', label: 'البنوك', section: 'المالية', keywords: ['بنك', 'bank', 'حساب بنكي'] },
  { id: 'fixed-assets', label: 'الأصول الثابتة', section: 'المحاسبة', keywords: ['أصل', 'asset', 'إهلاك'] },
  { id: 'fiscal-years', label: 'السنوات المالية', section: 'المحاسبة', keywords: ['سنة مالية', 'fiscal'] },
  { id: 'profit-report', label: 'تقرير الأرباح', section: 'التقارير', keywords: ['ربح', 'profit'] },
  { id: 'sales-report', label: 'تقرير المبيعات', section: 'التقارير', keywords: ['تقرير مبيعات'] },
  { id: 'purchases-report', label: 'تقرير المشتريات', section: 'التقارير', keywords: ['تقرير مشتريات'] },
  { id: 'financial-statements', label: 'القوائم المالية', section: 'التقارير', keywords: ['ميزانية', 'قائمة مالية', 'balance'] },
  { id: 'trial-balance-analysis', label: 'ميزان المراجعة', section: 'التقارير', keywords: ['ميزان', 'trial balance'] },
  { id: 'vat-return-report', label: 'إقرار الضريبة', section: 'التقارير', keywords: ['ضريبة', 'vat', 'ضريبة القيمة المضافة'] },
  { id: 'users-management', label: 'إدارة المستخدمين', section: 'الإدارة', keywords: ['مستخدم', 'user', 'صلاحية'] },
  { id: 'app-settings', label: 'الإعدادات', section: 'الإدارة', keywords: ['إعداد', 'setting', 'ضبط'] },
  { id: 'backups', label: 'النسخ الاحتياطي', section: 'الإدارة', keywords: ['نسخ', 'backup'] },
  { id: 'quotations', label: 'عروض الأسعار', section: 'المبيعات', keywords: ['عرض سعر', 'quotation'] },
  { id: 'financing', label: 'التمويل', section: 'المالية', keywords: ['تمويل', 'finance'] },
  { id: 'cost-centers', label: 'مراكز التكلفة', section: 'المحاسبة', keywords: ['مركز تكلفة', 'cost center'] },
  { id: 'budgets', label: 'الموازنات', section: 'المحاسبة', keywords: ['موازنة', 'budget'] },
  { id: 'currencies', label: 'العملات', section: 'المحاسبة', keywords: ['عملة', 'currency'] },
  { id: 'branches', label: 'الفروع', section: 'الإدارة', keywords: ['فرع', 'branch'] },
  { id: 'tasks', label: 'المهام', section: 'عام', keywords: ['مهمة', 'task'] },
  { id: 'prepaid-expenses', label: 'المصروفات المقدمة', section: 'المالية', keywords: ['مصروف مقدم', 'prepaid', 'إيجار'] },
  { id: 'aging-report', label: 'تقادم الذمم', section: 'التقارير', keywords: ['تقادم', 'aging'] },
  { id: 'financial-kpis', label: 'مؤشرات الأداء', section: 'التقارير', keywords: ['مؤشر', 'kpi', 'أداء'] },
];

interface GlobalSearchProps {
  setActivePage: (page: ActivePage) => void;
}

export function GlobalSearch({ setActivePage }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter(item =>
      item.label.includes(q) ||
      item.section.includes(q) ||
      item.keywords.some(k => k.includes(q))
    ).slice(0, 8);
  }, [query]);

  const handleSelect = useCallback((item: SearchItem) => {
    setActivePage(item.id);
    setQuery('');
    setIsOpen(false);
  }, [setActivePage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }, [results, selectedIndex, handleSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs" dir="rtl">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="بحث... (Ctrl+K)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-9 pl-8 h-8 text-sm bg-muted/50 border-border/50 focus:bg-background"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute left-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-right hover:bg-accent transition-colors',
                i === selectedIndex && 'bg-accent'
              )}
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.section}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
