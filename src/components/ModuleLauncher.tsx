import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LucideIcon, LayoutDashboard, Users, ShoppingCart, DollarSign, BookOpen, 
  Warehouse, Users2, Wrench, Plug, Settings, FileText, Factory, 
  MapPin, Building2, RotateCcw, RotateCw, FileCheck,
  CreditCard, Star, Award, CalendarCheck, ArrowLeftRight, Package, Banknote,
  ArrowDownToLine, Truck, Coins, Wallet, Clock, Receipt, Calculator, Scale,
  ClipboardList, ClipboardCheck, Landmark, HandCoins, Target, Percent,
  PieChart, FileSpreadsheet, Boxes, BarChart3, Activity, TrendingUp,
  ArrowUpFromLine, FolderTree, Ruler, Smartphone, Play, Home, Globe,
  BookMarked, RefreshCw, Link2, LayoutGrid, Code, Puzzle, Workflow,
  GitBranch, GitFork, Palette, Settings2, ShieldCheck, Database, FileUp,
  TestTube, QrCode, CalendarDays, FileSignature, Calendar, UserCog, ListTodo,
  ArrowRight, ArrowLeft, Search, Bell, Users2 as UsersIcon, Fingerprint, Shield,
  Edit3, Sparkles, LayoutGrid as LayoutGridIcon,
  Monitor, Car, Hammer, SquareCheck, Mail, MessageSquare, Phone,
  Share2, PartyPopper, ClipboardPenLine, GraduationCap, BookOpenCheck,
  MessagesSquare, PenTool, CalendarRange, MapPinned, Layers, ScanBarcode, Headphones
} from 'lucide-react';
import { ActivePage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlugins } from '@/hooks/usePlugins';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LauncherEditToolbar, EditableModuleCard, useLauncherDragDrop, LauncherModuleConfig } from '@/components/launcher/LauncherEditMode';
import { LauncherCustomizer } from '@/components/launcher/LauncherCustomizer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import defaultLogo from '@/assets/logo.png';

interface ModuleLauncherProps {
  setActivePage: (page: ActivePage) => void;
  onModuleSelect: (moduleId: string) => void;
}

interface SubItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  permission?: string;
}

interface MainModule {
  id: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  permission?: string;
  items: SubItem[];
}

const LAUNCHER_CONFIG_KEY = 'launcher_module_config';

export function ModuleLauncher({ setActivePage, onModuleSelect }: ModuleLauncherProps) {
  const { permissions, user } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { language } = useLanguage();
  const { activePlugins } = usePlugins();
  const [selectedModule, setSelectedModule] = useState<MainModule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const usersRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (usersRef.current && !usersRef.current.contains(e.target as Node)) setShowUsers(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;
  const isRtl = language === 'ar';

  const modules: MainModule[] = [
    {
      id: 'dashboard-mod', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard,
      color: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600',
      items: [{ id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      id: 'sales-mod', label: 'المبيعات', labelEn: 'Sales', icon: DollarSign,
      color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', permission: 'sales',
      items: [
        { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, permission: 'sales' },
        { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', icon: RotateCcw, permission: 'sales' },
        { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', icon: FileCheck, permission: 'sales' },
        { id: 'installments', label: 'الأقساط', labelEn: 'Installments', icon: CreditCard, permission: 'sales' },
        { id: 'customers', label: 'العملاء', labelEn: 'Customers', icon: Users, permission: 'sales' },
        { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', icon: Users, permission: 'sales' },
        ...(companyType === 'car_dealership' ? [
          { id: 'partner-dealerships' as ActivePage, label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', icon: Building2, permission: 'sales' },
          { id: 'car-transfers' as ActivePage, label: 'تحويلات السيارات', labelEn: 'Car Transfers', icon: ArrowLeftRight, permission: 'sales' },
        ] : []),
        { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', icon: Star, permission: 'sales' },
        { id: 'sales-targets', label: 'المستهدفة', labelEn: 'Sales Targets', icon: Award, permission: 'sales' },
        { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', icon: CalendarCheck, permission: 'sales' },
        { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', icon: DollarSign, permission: 'reports' },
        { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', icon: Users, permission: 'reports' },
        { id: 'commissions-report', label: 'تقرير العمولات', labelEn: 'Commissions', icon: DollarSign, permission: 'reports' },
        ...(companyType === 'car_dealership' ? [
          { id: 'transfers-report' as ActivePage, label: 'تقرير التحويلات', labelEn: 'Transfers Report', icon: ArrowLeftRight, permission: 'reports' },
          { id: 'partner-report' as ActivePage, label: 'تقرير المعرض الشريك', labelEn: 'Partner Report', icon: Building2, permission: 'reports' },
        ] : []),
      ],
    },
    {
      id: 'purchases-mod', label: 'المشتريات', labelEn: 'Purchases', icon: ShoppingCart,
      color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600', permission: 'purchases',
      items: [
        { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, permission: 'purchases' },
        { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', icon: RotateCw, permission: 'purchases' },
        { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', icon: Package, permission: 'purchases' },
        { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', icon: ShoppingCart, permission: 'purchases' },
        { id: 'contractor-payment', label: 'سند صرف مقاول', labelEn: 'Contractor Payment', icon: Banknote, permission: 'purchases' },
        { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', icon: ArrowDownToLine, permission: 'purchases' },
        { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', icon: Truck, permission: 'purchases' },
        { id: 'currencies', label: 'العملات', labelEn: 'Currencies', icon: Coins, permission: 'purchases' },
        { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', icon: Wallet, permission: 'purchases' },
        { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', icon: Clock, permission: 'purchases' },
        { id: 'purchases-report', label: 'تقارير المشتريات', labelEn: 'Purchases Report', icon: FileText, permission: 'reports' },
        { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', icon: Truck, permission: 'reports' },
      ],
    },
    {
      id: 'accounting-mod', label: 'المحاسبة', labelEn: 'Accounting', icon: BookOpen,
      color: 'bg-indigo-600', gradient: 'from-indigo-500 to-indigo-700', permission: 'reports',
      items: [
        { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', icon: Receipt },
        { id: 'journal-entries', label: 'دفتر اليومية', labelEn: 'Journal Entries', icon: Calculator },
        { id: 'general-ledger', label: 'دفتر الأستاذ', labelEn: 'General Ledger', icon: FileText },
        { id: 'account-statement', label: 'كشف حساب مفصل', labelEn: 'Account Statement', icon: ClipboardList },
        { id: 'banking', label: 'إدارة البنوك', labelEn: 'Banking', icon: Scale },
        { id: 'checks', label: 'إدارة الشيكات', labelEn: 'Checks', icon: ClipboardCheck },
        { id: 'financing', label: 'شركات التمويل', labelEn: 'Financing', icon: Landmark },
        { id: 'custody', label: 'إدارة العهد', labelEn: 'Custody', icon: HandCoins },
        { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', icon: BookOpen },
        { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', icon: Target },
        { id: 'tax-settings', label: 'إعدادات الضريبة', labelEn: 'Tax Settings', icon: Percent },
        { id: 'vat-return-report', label: 'إقرار ضريبة القيمة المضافة', labelEn: 'VAT Return', icon: Receipt },
        { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', icon: PieChart },
        { id: 'zakat-reports', label: 'القوائم الزكوية', labelEn: 'Zakat Reports', icon: Scale },
        { id: 'trial-balance-analysis', label: 'ميزان المراجعة', labelEn: 'Trial Balance', icon: FileSpreadsheet },
        { id: 'financial-statements', label: 'القوائم المالية', labelEn: 'Financial Statements', icon: FileText },
        { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', icon: Boxes },
        { id: 'aging-report', label: 'أعمار الديون', labelEn: 'Aging Report', icon: Clock },
        { id: 'budgets', label: 'الموازنات التقديرية', labelEn: 'Budgets', icon: BarChart3 },
        { id: 'financial-kpis', label: 'مؤشرات الأداء', labelEn: 'Financial KPIs', icon: Activity },
        { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', icon: TrendingUp, permission: 'reports' },
        { id: 'account-movement', label: 'حركة الحسابات', labelEn: 'Account Movement', icon: ClipboardList, permission: 'reports' },
      ],
    },
    {
      id: 'inventory-mod', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse,
      color: 'bg-amber-600', gradient: 'from-amber-500 to-amber-700', permission: 'purchases',
      items: [
        { id: 'items-catalog', label: 'ملف الأصناف', labelEn: 'Items Catalog', icon: Package },
        { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', icon: ArrowUpFromLine },
        { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse },
        { id: 'item-categories', label: 'فئات الأصناف', labelEn: 'Categories', icon: FolderTree },
        { id: 'units-of-measure', label: 'وحدات القياس', labelEn: 'Units', icon: Ruler },
        { id: 'stocktaking', label: 'الجرد', labelEn: 'Stocktaking', icon: ClipboardList },
        { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', icon: Factory },
        { id: 'mobile-inventory', label: 'جرد بالجوال', labelEn: 'Mobile Inventory', icon: Smartphone },
        { id: 'inventory-report', label: 'تقرير المخزون', labelEn: 'Inventory Report', icon: Package, permission: 'reports' },
      ],
    },
    {
      id: 'hr-mod', label: 'الموارد البشرية', labelEn: 'Human Resources', icon: Users2,
      color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600', permission: 'employees',
      items: [
        { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users, permission: 'employees' },
        { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', icon: CreditCard, permission: 'employees' },
        { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock, permission: 'employees' },
        { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays, permission: 'employees' },
        { id: 'insurance', label: 'التأمينات', labelEn: 'Insurance', icon: Shield, permission: 'employees' },
        { id: 'fingerprint-devices', label: 'أجهزة البصمة', labelEn: 'Fingerprint Devices', icon: Fingerprint, permission: 'employees' },
        { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Contracts', icon: FileSignature, permission: 'employees' },
        { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', icon: GitFork, permission: 'employees' },
      ],
    },
    {
      id: 'operations-mod', label: 'العمليات', labelEn: 'Operations', icon: Wrench,
      color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600',
      items: [
        { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', icon: Wrench },
        { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', icon: Play },
        { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', icon: Home },
        { id: 'trips', label: 'إدارة الرحلات', labelEn: 'Trips', icon: MapPin },
        { id: 'advanced-projects', label: 'مشاريع متقدمة', labelEn: 'Projects', icon: LayoutGrid },
        { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', icon: Globe },
        { id: 'bookkeeping-service', label: 'مسك الدفاتر', labelEn: 'Bookkeeping', icon: BookMarked },
        { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', icon: RefreshCw },
        { id: 'payment-gateway', label: 'بوابة الدفع', labelEn: 'Payment Gateway', icon: Link2 },
      ],
    },
    {
      id: 'integrations-mod', label: 'التكاملات', labelEn: 'Integrations', icon: Plug,
      color: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600',
      items: [
        { id: 'integrations', label: 'التكاملات الخارجية', labelEn: 'Integrations', icon: Plug },
        { id: 'api-management', label: 'API عام', labelEn: 'API Management', icon: Globe },
        { id: 'developer-api', label: 'API للمطورين', labelEn: 'Developer API', icon: Code },
        { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', icon: Puzzle },
        ...activePlugins.map(p => ({
          id: p.pageId as ActivePage,
          label: p.menuLabel,
          labelEn: p.menuLabel_en,
          icon: Puzzle,
        })),
      ],
    },
    {
      id: 'system-mod', label: 'النظام', labelEn: 'System', icon: Settings,
      color: 'bg-slate-600', gradient: 'from-slate-500 to-slate-700', permission: 'admin',
      items: [
        { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'Users', icon: UserCog, permission: 'admin' },
        { id: 'branches', label: 'الفروع', labelEn: 'Branches', icon: GitFork, permission: 'admin' },
        { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', icon: Calendar, permission: 'admin' },
        { id: 'tasks', label: 'إدارة المهام', labelEn: 'Tasks', icon: ListTodo, permission: 'admin' },
        { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', icon: GitBranch, permission: 'admin' },
        { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', icon: Workflow, permission: 'admin' },
        { id: 'app-settings', label: 'إعدادات النظام', labelEn: 'Settings', icon: Settings, permission: 'admin' },
        { id: 'theme-settings', label: 'المظهر', labelEn: 'Theme', icon: Palette, permission: 'admin' },
        { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', icon: Settings2, permission: 'admin' },
        { id: 'audit-logs', label: 'سجل التدقيق', labelEn: 'Audit Logs', icon: ClipboardList, permission: 'admin' },
        { id: 'accounting-audit', label: 'تدقيق محاسبي', labelEn: 'Accounting Audit', icon: ShieldCheck, permission: 'admin' },
        { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', icon: Database, permission: 'admin' },
        { id: 'medad-import', label: 'استيراد من ميداد', labelEn: 'Medad Import', icon: FileUp, permission: 'admin' },
        { id: 'zatca-sandbox', label: 'بيئة محاكاة ZATCA', labelEn: 'ZATCA Sandbox', icon: TestTube, permission: 'admin' },
        { id: 'zatca-technical-doc', label: 'وثائق ZATCA', labelEn: 'ZATCA Docs', icon: FileText, permission: 'admin' },
        { id: 'mobile-invoice-reader', label: 'قراءة فاتورة بالجوال', labelEn: 'Invoice Reader', icon: QrCode, permission: 'admin' },
      ],
    },
    {
      id: 'pos-mod', label: 'نقطة البيع', labelEn: 'Point of Sale', icon: Monitor,
      color: 'bg-red-500', gradient: 'from-red-400 to-red-600', permission: 'sales',
      items: [
        { id: 'pos', label: 'شاشة البيع', labelEn: 'POS Screen', icon: Monitor, permission: 'sales' },
      ],
    },
    {
      id: 'recruitment-mod', label: 'التوظيف', labelEn: 'Recruitment', icon: Users,
      color: 'bg-cyan-500', gradient: 'from-cyan-400 to-cyan-600', permission: 'employees',
      items: [
        { id: 'recruitment', label: 'إدارة التوظيف', labelEn: 'Recruitment', icon: Users, permission: 'employees' },
      ],
    },
    {
      id: 'appraisals-mod', label: 'تقييم الأداء', labelEn: 'Appraisals', icon: ClipboardPenLine,
      color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600', permission: 'employees',
      items: [
        { id: 'appraisals', label: 'تقييمات الموظفين', labelEn: 'Appraisals', icon: ClipboardPenLine, permission: 'employees' },
      ],
    },
    {
      id: 'fleet-mod', label: 'إدارة الأسطول', labelEn: 'Fleet', icon: Car,
      color: 'bg-sky-500', gradient: 'from-sky-400 to-sky-600',
      items: [
        { id: 'fleet', label: 'إدارة المركبات', labelEn: 'Fleet Management', icon: Car },
      ],
    },
    {
      id: 'maintenance-mod', label: 'الصيانة', labelEn: 'Maintenance', icon: Hammer,
      color: 'bg-stone-500', gradient: 'from-stone-400 to-stone-600',
      items: [
        { id: 'maintenance', label: 'جدولة الصيانة', labelEn: 'Maintenance', icon: Hammer },
      ],
    },
    {
      id: 'quality-mod', label: 'مراقبة الجودة', labelEn: 'Quality Control', icon: SquareCheck,
      color: 'bg-lime-500', gradient: 'from-lime-400 to-lime-600',
      items: [
        { id: 'quality-control', label: 'فحوصات الجودة', labelEn: 'Quality Control', icon: SquareCheck },
      ],
    },
    {
      id: 'email-marketing-mod', label: 'التسويق بالبريد', labelEn: 'Email Marketing', icon: Mail,
      color: 'bg-rose-400', gradient: 'from-rose-300 to-rose-500',
      items: [
        { id: 'email-marketing', label: 'حملات البريد', labelEn: 'Email Campaigns', icon: Mail },
      ],
    },
    {
      id: 'sms-marketing-mod', label: 'التسويق SMS', labelEn: 'SMS Marketing', icon: Phone,
      color: 'bg-green-500', gradient: 'from-green-400 to-green-600',
      items: [
        { id: 'sms-marketing', label: 'رسائل SMS', labelEn: 'SMS Marketing', icon: Phone },
      ],
    },
    {
      id: 'social-mod', label: 'التسويق الاجتماعي', labelEn: 'Social Marketing', icon: Share2,
      color: 'bg-blue-400', gradient: 'from-blue-300 to-blue-500',
      items: [
        { id: 'social-marketing', label: 'وسائل التواصل', labelEn: 'Social Marketing', icon: Share2 },
      ],
    },
    {
      id: 'events-mod', label: 'الأحداث', labelEn: 'Events', icon: PartyPopper,
      color: 'bg-fuchsia-500', gradient: 'from-fuchsia-400 to-fuchsia-600',
      items: [
        { id: 'events', label: 'إدارة الفعاليات', labelEn: 'Events', icon: PartyPopper },
      ],
    },
    {
      id: 'surveys-mod', label: 'الاستبيانات', labelEn: 'Surveys', icon: ClipboardList,
      color: 'bg-violet-400', gradient: 'from-violet-300 to-violet-500',
      items: [
        { id: 'surveys', label: 'استطلاعات الرأي', labelEn: 'Surveys', icon: ClipboardList },
      ],
    },
    {
      id: 'elearning-mod', label: 'التعلم الإلكتروني', labelEn: 'eLearning', icon: GraduationCap,
      color: 'bg-indigo-400', gradient: 'from-indigo-300 to-indigo-500',
      items: [
        { id: 'elearning', label: 'الدورات التدريبية', labelEn: 'eLearning', icon: GraduationCap },
      ],
    },
    {
      id: 'knowledge-mod', label: 'قاعدة المعرفة', labelEn: 'Knowledge', icon: BookOpenCheck,
      color: 'bg-emerald-400', gradient: 'from-emerald-300 to-emerald-500',
      items: [
        { id: 'knowledge-base', label: 'ويكي داخلي', labelEn: 'Knowledge Base', icon: BookOpenCheck },
      ],
    },
    {
      id: 'chat-mod', label: 'المحادثات', labelEn: 'Discuss', icon: MessagesSquare,
      color: 'bg-blue-600', gradient: 'from-blue-500 to-blue-700',
      items: [
        { id: 'internal-chat', label: 'الدردشة الداخلية', labelEn: 'Internal Chat', icon: MessagesSquare },
      ],
    },
    {
      id: 'sign-mod', label: 'التوقيع الإلكتروني', labelEn: 'Sign', icon: PenTool,
      color: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600',
      items: [
        { id: 'e-signature', label: 'توقيع المستندات', labelEn: 'E-Signature', icon: PenTool },
      ],
    },
    {
      id: 'planning-mod', label: 'التخطيط', labelEn: 'Planning', icon: CalendarRange,
      color: 'bg-teal-400', gradient: 'from-teal-300 to-teal-500', permission: 'employees',
      items: [
        { id: 'planning', label: 'جدولة الورديات', labelEn: 'Planning', icon: CalendarRange, permission: 'employees' },
      ],
    },
    {
      id: 'appointments-mod', label: 'المواعيد', labelEn: 'Appointments', icon: CalendarCheck,
      color: 'bg-orange-400', gradient: 'from-orange-300 to-orange-500',
      items: [
        { id: 'appointments', label: 'حجز المواعيد', labelEn: 'Appointments', icon: CalendarCheck },
      ],
    },
    {
      id: 'field-service-mod', label: 'خدمة ميدانية', labelEn: 'Field Service', icon: MapPinned,
      color: 'bg-red-400', gradient: 'from-red-300 to-red-500',
      items: [
        { id: 'field-service', label: 'الفنيين الميدانيين', labelEn: 'Field Service', icon: MapPinned },
      ],
    },
    {
      id: 'plm-mod', label: 'دورة حياة المنتج', labelEn: 'PLM', icon: Layers,
      color: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600',
      items: [
        { id: 'plm', label: 'إدارة PLM', labelEn: 'PLM', icon: Layers },
      ],
    },
    {
      id: 'barcode-mod', label: 'الباركود', labelEn: 'Barcode', icon: ScanBarcode,
      color: 'bg-neutral-600', gradient: 'from-neutral-500 to-neutral-700',
      items: [
        { id: 'barcode-scanner', label: 'ماسح الباركود', labelEn: 'Barcode Scanner', icon: ScanBarcode },
      ],
    },
    {
      id: 'support-mod', label: 'الدعم الفني', labelEn: 'Support', icon: Headphones,
      color: 'bg-red-600', gradient: 'from-red-500 to-red-700',
      items: [
        { id: 'support-contact', label: 'تواصل مع الدعم', labelEn: 'Contact Support', icon: Headphones },
      ],
    },
  ];

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.admin || (permissions as any)[permission];
  };

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    return 'Elzini SaaS';
  };

  const visibleModules = modules.filter(m => hasAccess(m.permission));
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // === Launcher customization config ===
  const defaultModuleConfigs: LauncherModuleConfig[] = useMemo(() =>
    visibleModules.map((m, i) => ({
      id: m.id,
      label: isRtl ? m.label : m.labelEn,
      visible: true,
      order: i,
      size: 'normal' as const,
    })),
    [visibleModules.length, isRtl]
  );

  const [moduleConfigs, setModuleConfigs] = useState<LauncherModuleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LAUNCHER_CONFIG_KEY);
      if (saved) {
        const parsed: LauncherModuleConfig[] = JSON.parse(saved);
        const merged = visibleModules.map((m, i) => {
          const existing = parsed.find(p => p.id === m.id);
          return existing || {
            id: m.id,
            label: isRtl ? m.label : m.labelEn,
            visible: true,
            order: existing?.order ?? i,
            size: 'normal' as const,
          };
        });
        return merged.sort((a, b) => a.order - b.order).map((m, i) => ({ ...m, order: i }));
      }
    } catch {}
    return defaultModuleConfigs;
  });

  const [editConfigs, setEditConfigs] = useState<LauncherModuleConfig[]>(moduleConfigs);

  const handleStartEdit = () => {
    setEditConfigs([...moduleConfigs]);
    setIsEditMode(true);
  };

  const handleSave = (configs: LauncherModuleConfig[]) => {
    setModuleConfigs(configs);
    localStorage.setItem(LAUNCHER_CONFIG_KEY, JSON.stringify(configs));
    setIsEditMode(false);
    toast.success(isRtl ? 'تم حفظ تخصيص الواجهة' : 'Layout saved');
  };

  const handleCancel = () => {
    setEditConfigs([...moduleConfigs]);
    setIsEditMode(false);
  };

  const dragDrop = useLauncherDragDrop(editConfigs, setEditConfigs);

  const currentConfigs = isEditMode ? editConfigs : moduleConfigs;
  const sortedConfigs = [...currentConfigs].sort((a, b) => a.order - b.order);

  const filterBySearch = (items: SubItem[]) => {
    if (!searchQuery.trim()) return items.filter(i => hasAccess(i.permission));
    const q = searchQuery.toLowerCase();
    return items.filter(i => 
      hasAccess(i.permission) && 
      (i.label.includes(q) || i.labelEn.toLowerCase().includes(q))
    );
  };

  // === Sub-items view ===
  if (selectedModule) {
    const visibleItems = filterBySearch(selectedModule.items);
    const ModIcon = selectedModule.icon;
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background">
        <div className={`bg-gradient-to-r ${selectedModule.gradient} px-4 sm:px-8 py-6`}>
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => { setSelectedModule(null); setSearchQuery(''); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
            >
              <BackIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{isRtl ? 'رجوع للقائمة' : 'Back to menu'}</span>
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ModIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isRtl ? selectedModule.label : selectedModule.labelEn}
                  </h2>
                  <p className="text-white/70 text-sm mt-0.5">
                    {visibleItems.length} {isRtl ? 'عنصر' : 'items'}
                  </p>
                </div>
              </div>
              <div className="relative hidden sm:block">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'بحث...' : 'Search...'}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-full py-2 ps-10 pe-4 text-sm text-white placeholder:text-white/40 w-56 focus:outline-none focus:bg-white/25 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 sm:p-8">
          {visibleItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {isRtl ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {visibleItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/40 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedModule.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <ItemIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-center text-foreground/80 group-hover:text-foreground leading-tight line-clamp-2 font-medium transition-colors">
                      {isRtl ? item.label : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const onlineUsersCount = 1;

  // Category filter

  // Build categories with counts
  const categories = visibleModules.map(mod => ({
    id: mod.id,
    label: isRtl ? mod.label : mod.labelEn,
    count: mod.items.filter(i => hasAccess(i.permission)).length,
  }));

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  // Filter modules by category
  const displayModules = selectedCategory 
    ? visibleModules.filter(m => m.id === selectedCategory) 
    : visibleModules;

  // Get all items for display (flattened from filtered modules)  
  const allDisplayItems = displayModules.flatMap(mod => 
    mod.items.filter(i => hasAccess(i.permission)).map(item => ({
      ...item,
      moduleId: mod.id,
      moduleLabel: isRtl ? mod.label : mod.labelEn,
      gradient: mod.gradient,
      color: mod.color,
    }))
  );

  // Apply search filter
  const filteredItems = searchQuery.trim() 
    ? allDisplayItems.filter(i => {
        const q = searchQuery.toLowerCase();
        return i.label.includes(q) || i.labelEn.toLowerCase().includes(q);
      })
    : allDisplayItems;

  // Odoo-style description map
  const moduleDescriptions: Record<string, { ar: string; en: string }> = {
    'dashboard-mod': { ar: 'لوحة تحكم شاملة بالمؤشرات', en: 'Comprehensive KPI Dashboard' },
    'sales-mod': { ar: 'من عروض الأسعار للفواتير', en: 'From quotations to invoices' },
    'purchases-mod': { ar: 'إدارة المشتريات والموردين', en: 'Manage purchases & suppliers' },
    'accounting-mod': { ar: 'إدارة المحاسبة المالية والتحليلية', en: 'Financial & analytical accounting' },
    'inventory-mod': { ar: 'إدارة أنشطة مخزونك واللوجستية', en: 'Manage inventory & logistics' },
    'hr-mod': { ar: 'إدارة الموارد البشرية والرواتب', en: 'HR & payroll management' },
    'operations-mod': { ar: 'إدارة العمليات والمشاريع', en: 'Operations & project management' },
    'integrations-mod': { ar: 'التكاملات والإضافات الخارجية', en: 'External integrations & plugins' },
    'system-mod': { ar: 'إعدادات النظام والمستخدمين', en: 'System settings & users' },
    'pos-mod': { ar: 'واجهة نقطة بيع سهلة', en: 'User-friendly POS interface' },
    'recruitment-mod': { ar: 'تتبع الترشيحات وإغلاق الفرص', en: 'Track applications & hire' },
    'appraisals-mod': { ar: 'تقييم أداء الموظفين', en: 'Employee performance reviews' },
    'fleet-mod': { ar: 'إدارة المركبات والأسطول', en: 'Vehicle & fleet management' },
    'maintenance-mod': { ar: 'جدولة وتتبع الصيانة', en: 'Schedule & track maintenance' },
    'quality-mod': { ar: 'فحوصات ومراقبة الجودة', en: 'Quality checks & control' },
    'email-marketing-mod': { ar: 'تصميم وإرسال وتتبع رسائل البريد', en: 'Design, send & track emails' },
    'sms-marketing-mod': { ar: 'إرسال رسائل SMS تسويقية', en: 'Send marketing SMS messages' },
    'social-mod': { ar: 'إدارة وسائل التواصل الاجتماعي', en: 'Manage social media channels' },
    'events-mod': { ar: 'تنظيم وإدارة الفعاليات', en: 'Organize & manage events' },
    'surveys-mod': { ar: 'إنشاء استطلاعات الرأي', en: 'Create & manage surveys' },
    'elearning-mod': { ar: 'الدورات التدريبية الإلكترونية', en: 'Online training courses' },
    'knowledge-mod': { ar: 'ويكي وقاعدة معرفة داخلية', en: 'Internal wiki & knowledge base' },
    'chat-mod': { ar: 'الدردشة والتواصل الداخلي', en: 'Internal messaging & chat' },
    'sign-mod': { ar: 'توقيع المستندات إلكترونياً', en: 'Electronic document signing' },
    'planning-mod': { ar: 'تخطيط وجدولة الورديات', en: 'Shift planning & scheduling' },
    'appointments-mod': { ar: 'حجز وإدارة المواعيد', en: 'Book & manage appointments' },
    'field-service-mod': { ar: 'إدارة الفنيين الميدانيين', en: 'Manage field technicians' },
    'plm-mod': { ar: 'إدارة دورة حياة المنتج', en: 'Product lifecycle management' },
    'barcode-mod': { ar: 'مسح وإدارة الباركود', en: 'Barcode scanning & management' },
    'support-mod': { ar: 'تواصل مع فريق الدعم الفني', en: 'Contact technical support' },
  };

  // === Main modules view - Odoo Style ===
  return (
    <div className="min-h-[calc(100vh-60px)] bg-muted/30">
      {/* Edit Mode Toolbar */}
      <LauncherEditToolbar
        isEditMode={isEditMode}
        onSave={handleSave}
        onCancel={handleCancel}
        modules={editConfigs}
        onModulesChange={setEditConfigs}
        defaultModules={defaultModuleConfigs}
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b border-border/50 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-dashed">
                    <Settings className="w-4 h-4" />
                    {isRtl ? 'تخصيص' : 'Customize'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{isRtl ? 'خيارات التخصيص' : 'Customization'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleStartEdit} className="gap-2 cursor-pointer">
                    <Edit3 className="w-4 h-4 text-primary" />
                    {isRtl ? 'تعديل الواجهة' : 'Edit Layout'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCustomizerOpen(true)} className="gap-2 cursor-pointer">
                    <LayoutGridIcon className="w-4 h-4 text-success" />
                    {isRtl ? 'ترتيب الوحدات' : 'Arrange Modules'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : <div />}
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} {isRtl ? 'وحدة' : 'modules'}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className="bg-card border border-border/50 rounded-lg py-1.5 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Grid + Category Sidebar */}
      <div className="max-w-7xl mx-auto flex gap-0">
        {/* Right Category Sidebar - Odoo Style */}
        <div className="hidden md:block w-52 lg:w-56 border-e border-border/50 bg-background p-4 sticky top-[45px] h-[calc(100vh-45px)] overflow-y-auto">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            {isRtl ? 'الفئات' : 'Categories'}
          </h3>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory 
                    ? 'bg-primary/10 text-primary font-semibold border-e-2 border-primary' 
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{isRtl ? 'الكل' : 'All'}</span>
                <span className="text-xs text-muted-foreground">{totalCount}</span>
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-primary/10 text-primary font-semibold border-e-2 border-primary' 
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Module Cards Grid - Main Area */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Welcome Banner */}
          <div className="mb-6 rounded-xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">👋</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {isRtl ? `أهلاً, ${userName}` : `Hello, ${userName}`} ☕
                </h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {isRtl ? `مرحباً بك في ${getAppName()}` : `Welcome to ${getAppName()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white font-bold text-xs tabular-nums">
                  {liveTime.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/90 text-xs">
                  {liveTime.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Odoo-style Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {isRtl ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(selectedCategory ? filteredItems : 
                // Group by module and show module-level cards when no category selected
                visibleModules.filter(mod => {
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    return mod.items.some(i => hasAccess(i.permission) && (i.label.includes(q) || i.labelEn.toLowerCase().includes(q)));
                  }
                  return true;
                }).map(mod => ({
                  id: mod.id as ActivePage,
                  label: mod.label,
                  labelEn: mod.labelEn,
                  icon: mod.icon,
                  moduleId: mod.id,
                  moduleLabel: isRtl ? mod.label : mod.labelEn,
                  gradient: mod.gradient,
                  color: mod.color,
                  permission: mod.permission,
                  isModule: true,
                  itemCount: mod.items.filter(i => hasAccess(i.permission)).length,
                }))
              ).map((item: any) => {
                const ItemIcon = item.icon;
                const desc = moduleDescriptions[item.moduleId];
                const description = desc ? (isRtl ? desc.ar : desc.en) : '';
                const isModule = item.isModule;

                return (
                  <button
                    key={item.isModule ? item.moduleId : item.id}
                    onClick={() => {
                      if (isModule) {
                        const mod = visibleModules.find(m => m.id === item.moduleId);
                        if (mod) {
                          // Navigate to first item directly
                          setActivePage(mod.items[0].id);
                        }
                      } else {
                        setActivePage(item.id);
                      }
                    }}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-md transition-all duration-200 text-start"
                  >
                    {/* Module Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                      <ItemIcon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {isRtl ? (item.isModule ? item.label : item.label) : (item.isModule ? item.labelEn : item.labelEn)}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {isRtl ? 'مثبت' : 'Installed'}
                        </span>
                        {isModule && item.itemCount > 1 && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.itemCount} {isRtl ? 'عنصر' : 'items'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <p className="text-[10px] text-muted-foreground/50">Elzini SaaS © 2026</p>
          </div>
        </div>

      </div>

      {/* Launcher Customizer Dialog */}
      <LauncherCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        modules={moduleConfigs}
        onModulesChange={(configs) => {
          setModuleConfigs(configs);
          localStorage.setItem(LAUNCHER_CONFIG_KEY, JSON.stringify(configs));
        }}
        visibleModules={visibleModules}
      />
    </div>
  );
}
