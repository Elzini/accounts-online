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
  // === الرئيسية / Dashboard ===
  { id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', section: 'الرئيسية', sectionEn: 'Dashboard', icon: 'LayoutDashboard', keywords: ['الرئيسية', 'home', 'main'] },

  // === المبيعات / Sales ===
  { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', section: 'المبيعات', sectionEn: 'Sales', icon: 'DollarSign', keywords: ['بيع', 'فاتورة', 'invoice', 'bill'] },
  { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', section: 'المبيعات', sectionEn: 'Sales', icon: 'RotateCcw', keywords: ['مرتجع', 'إرجاع', 'return'] },
  { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', section: 'المبيعات', sectionEn: 'Sales', icon: 'FileCheck', keywords: ['عرض سعر', 'تسعير', 'quote'] },
  { id: 'installments', label: 'الأقساط', labelEn: 'Installments', section: 'المبيعات', sectionEn: 'Sales', icon: 'CreditCard', keywords: ['قسط', 'تقسيط', 'installment'] },
  { id: 'customers', label: 'العملاء', labelEn: 'Customers', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users', keywords: ['عميل', 'زبون', 'client', 'customer'] },
  { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users', keywords: ['علاقات العملاء', 'crm'] },
  { id: 'partner-dealerships', label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', section: 'المبيعات', sectionEn: 'Sales', icon: 'Building2', keywords: ['معرض', 'شريك', 'dealer'] },
  { id: 'car-transfers', label: 'تحويلات السيارات', labelEn: 'Car Transfers', section: 'المبيعات', sectionEn: 'Sales', icon: 'ArrowLeftRight', keywords: ['تحويل', 'سيارة', 'transfer'] },
  { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', section: 'المبيعات', sectionEn: 'Sales', icon: 'Star', keywords: ['ولاء', 'نقاط', 'loyalty'] },
  { id: 'sales-targets', label: 'المستهدفة', labelEn: 'Sales Targets', section: 'المبيعات', sectionEn: 'Sales', icon: 'Award', keywords: ['هدف', 'مستهدف', 'target'] },
  { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', section: 'المبيعات', sectionEn: 'Sales', icon: 'CalendarCheck', keywords: ['حجز', 'موعد', 'booking'] },
  { id: 'pos', label: 'نقطة البيع', labelEn: 'Point of Sale', section: 'المبيعات', sectionEn: 'Sales', icon: 'Monitor', keywords: ['كاشير', 'pos', 'شاشة البيع'] },
  { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'DollarSign', keywords: ['تقرير مبيعات'] },
  { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'Users', keywords: ['تقرير عملاء'] },
  { id: 'commissions-report', label: 'تقرير العمولات', labelEn: 'Commissions Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'DollarSign', keywords: ['عمولة', 'عمولات', 'commission'] },
  { id: 'transfers-report', label: 'تقرير التحويلات', labelEn: 'Transfers Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'ArrowLeftRight', keywords: ['تقرير تحويلات'] },
  { id: 'partner-report', label: 'تقرير المعرض الشريك', labelEn: 'Partner Report', section: 'المبيعات', sectionEn: 'Sales', icon: 'Building2', keywords: ['تقرير شريك'] },

  // === المشتريات / Purchases ===
  { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ShoppingCart', keywords: ['شراء', 'فاتورة مشتريات', 'purchase'] },
  { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', section: 'المشتريات', sectionEn: 'Purchases', icon: 'RotateCw', keywords: ['مرتجع', 'إرجاع مشتريات'] },
  { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Package', keywords: ['مواد', 'طلب', 'materials'] },
  { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ShoppingCart', keywords: ['أمر شراء', 'order'] },
  { id: 'contractor-payment', label: 'سند صرف مقاول', labelEn: 'Contractor Payment', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Banknote', keywords: ['مقاول', 'صرف', 'contractor'] },
  { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', section: 'المشتريات', sectionEn: 'Purchases', icon: 'ArrowDownToLine', keywords: ['استلام', 'receipt'] },
  { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Truck', keywords: ['مورد', 'موردين', 'supplier'] },
  { id: 'currencies', label: 'العملات', labelEn: 'Currencies', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Coins', keywords: ['عملة', 'صرف', 'currency', 'dollar', 'ريال'] },
  { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Wallet', keywords: ['مصروف', 'expense', 'مصاريف'] },
  { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Clock', keywords: ['مصروف مقدم', 'إيجار', 'prepaid'] },
  { id: 'purchases-report', label: 'تقارير المشتريات', labelEn: 'Purchases Report', section: 'المشتريات', sectionEn: 'Purchases', icon: 'FileText', keywords: ['تقرير مشتريات'] },
  { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', section: 'المشتريات', sectionEn: 'Purchases', icon: 'Truck', keywords: ['تقرير موردين'] },

  // === المحاسبة / Accounting ===
  { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Receipt', keywords: ['سند', 'قبض', 'صرف', 'voucher'] },
  { id: 'journal-entries', label: 'دفتر اليومية', labelEn: 'Journal Entries', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Calculator', keywords: ['قيد', 'قيود', 'يومية', 'journal'] },
  { id: 'general-ledger', label: 'دفتر الأستاذ', labelEn: 'General Ledger', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'FileText', keywords: ['أستاذ', 'ledger'] },
  { id: 'account-statement', label: 'كشف حساب مفصل', labelEn: 'Account Statement', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'ClipboardList', keywords: ['كشف حساب', 'statement'] },
  { id: 'banking', label: 'إدارة البنوك', labelEn: 'Banking', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Scale', keywords: ['بنك', 'بنوك', 'bank', 'حساب بنكي'] },
  { id: 'checks', label: 'إدارة الشيكات', labelEn: 'Checks', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'ClipboardCheck', keywords: ['شيك', 'شيكات', 'check'] },
  { id: 'financing', label: 'شركات التمويل', labelEn: 'Financing', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Landmark', keywords: ['تمويل', 'finance'] },
  { id: 'custody', label: 'إدارة العهد', labelEn: 'Custody', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'HandCoins', keywords: ['عهدة', 'العهده', 'عهده', 'سلفة', 'custody'] },
  { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'BookOpen', keywords: ['حساب', 'شجرة', 'chart', 'دليل الحسابات'] },
  { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Target', keywords: ['مركز تكلفة', 'cost center'] },
  { id: 'tax-settings', label: 'إعدادات الضريبة', labelEn: 'Tax Settings', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Percent', keywords: ['ضريبة', 'ضرائب', 'tax', 'vat'] },
  { id: 'vat-return-report', label: 'إقرار ضريبة القيمة المضافة', labelEn: 'VAT Return', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Receipt', keywords: ['ضريبة', 'إقرار', 'vat', 'القيمة المضافة'] },
  { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'PieChart', keywords: ['تقرير مالي', 'financial'] },
  { id: 'zakat-reports', label: 'القوائم الزكوية', labelEn: 'Zakat Reports', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Scale', keywords: ['زكاة', 'زكوي', 'zakat'] },
  { id: 'trial-balance-analysis', label: 'ميزان المراجعة', labelEn: 'Trial Balance', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'FileSpreadsheet', keywords: ['ميزان', 'مراجعة', 'trial balance'] },
  { id: 'financial-statements', label: 'القوائم المالية', labelEn: 'Financial Statements', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'FileText', keywords: ['ميزانية', 'قائمة مالية', 'balance sheet'] },
  { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Boxes', keywords: ['أصل', 'أصول', 'إهلاك', 'asset', 'depreciation'] },
  { id: 'aging-report', label: 'أعمار الديون', labelEn: 'Aging Report', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Clock', keywords: ['تقادم', 'ذمم', 'aging', 'ديون'] },
  { id: 'budgets', label: 'الموازنات التقديرية', labelEn: 'Budgets', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'BarChart3', keywords: ['موازنة', 'budget', 'تقديرية'] },
  { id: 'financial-kpis', label: 'مؤشرات الأداء', labelEn: 'Financial KPIs', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'Activity', keywords: ['مؤشر', 'kpi', 'أداء مالي'] },
  { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'TrendingUp', keywords: ['ربح', 'أرباح', 'profit'] },
  { id: 'account-movement', label: 'حركة الحسابات', labelEn: 'Account Movement', section: 'المحاسبة', sectionEn: 'Accounting', icon: 'ClipboardList', keywords: ['حركة', 'movement'] },

  // === المستودعات / Inventory ===
  { id: 'items-catalog', label: 'ملف الأصناف', labelEn: 'Items Catalog', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Package', keywords: ['صنف', 'أصناف', 'منتج', 'item', 'product'] },
  { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', section: 'المستودعات', sectionEn: 'Inventory', icon: 'ArrowUpFromLine', keywords: ['إذن', 'أذون', 'مخزن', 'stock'] },
  { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Warehouse', keywords: ['مستودع', 'مخزن', 'warehouse'] },
  { id: 'item-categories', label: 'فئات الأصناف', labelEn: 'Item Categories', section: 'المستودعات', sectionEn: 'Inventory', icon: 'FolderTree', keywords: ['فئة', 'تصنيف', 'category'] },
  { id: 'units-of-measure', label: 'وحدات القياس', labelEn: 'Units of Measure', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Ruler', keywords: ['وحدة', 'قياس', 'unit'] },
  { id: 'stocktaking', label: 'الجرد', labelEn: 'Stocktaking', section: 'المستودعات', sectionEn: 'Inventory', icon: 'ClipboardList', keywords: ['جرد', 'inventory count'] },
  { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Factory', keywords: ['تصنيع', 'إنتاج', 'manufacturing'] },
  { id: 'mobile-inventory', label: 'جرد بالجوال', labelEn: 'Mobile Inventory', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Smartphone', keywords: ['جوال', 'mobile', 'جرد جوال'] },
  { id: 'inventory-report', label: 'تقرير المخزون', labelEn: 'Inventory Report', section: 'المستودعات', sectionEn: 'Inventory', icon: 'Package', keywords: ['تقرير مخزون'] },

  // === الموارد البشرية / HR ===
  { id: 'employees', label: 'الموظفين', labelEn: 'Employees', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Users', keywords: ['موظف', 'عامل', 'employee', 'staff'] },
  { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'CreditCard', keywords: ['راتب', 'رواتب', 'مسير', 'payroll', 'salary'] },
  { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Clock', keywords: ['حضور', 'انصراف', 'دوام', 'attendance'] },
  { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'CalendarDays', keywords: ['إجازة', 'إجازات', 'leave', 'vacation'] },
  { id: 'insurance', label: 'التأمينات', labelEn: 'Insurance', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Shield', keywords: ['تأمين', 'تأمينات', 'insurance', 'gosi'] },
  { id: 'fingerprint-devices', label: 'أجهزة البصمة', labelEn: 'Fingerprint Devices', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Fingerprint', keywords: ['بصمة', 'جهاز', 'fingerprint'] },
  { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Employee Contracts', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'FileSignature', keywords: ['عقد', 'عقود', 'contract'] },
  { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'GitFork', keywords: ['هيكل', 'تنظيمي', 'org'] },
  { id: 'recruitment', label: 'إدارة التوظيف', labelEn: 'Recruitment', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'Users', keywords: ['توظيف', 'تعيين', 'recruitment', 'hiring'] },
  { id: 'appraisals', label: 'تقييم الأداء', labelEn: 'Appraisals', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'ClipboardPenLine', keywords: ['تقييم', 'أداء', 'appraisal'] },
  { id: 'planning', label: 'جدولة الورديات', labelEn: 'Planning', section: 'الموارد البشرية', sectionEn: 'HR', icon: 'CalendarRange', keywords: ['وردية', 'جدول', 'shift', 'planning'] },

  // === العمليات / Operations ===
  { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', section: 'العمليات', sectionEn: 'Operations', icon: 'Wrench', keywords: ['أمر عمل', 'work order'] },
  { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', section: 'العمليات', sectionEn: 'Operations', icon: 'Play', keywords: ['وقت', 'تتبع', 'timesheet'] },
  { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', section: 'العمليات', sectionEn: 'Operations', icon: 'Home', keywords: ['إيجار', 'تأجير', 'rental'] },
  { id: 'trips', label: 'إدارة الرحلات', labelEn: 'Trips', section: 'العمليات', sectionEn: 'Operations', icon: 'MapPin', keywords: ['رحلة', 'رحلات', 'سفر', 'trip'] },
  { id: 'advanced-projects', label: 'مشاريع متقدمة', labelEn: 'Advanced Projects', section: 'العمليات', sectionEn: 'Operations', icon: 'LayoutGrid', keywords: ['مشروع', 'مشاريع', 'project'] },
  { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', section: 'العمليات', sectionEn: 'Operations', icon: 'Globe', keywords: ['بوابة', 'portal'] },
  { id: 'bookkeeping-service', label: 'مسك الدفاتر', labelEn: 'Bookkeeping', section: 'العمليات', sectionEn: 'Operations', icon: 'BookMarked', keywords: ['دفاتر', 'bookkeeping'] },
  { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', section: 'العمليات', sectionEn: 'Operations', icon: 'RefreshCw', keywords: ['اشتراك', 'subscription'] },
  { id: 'payment-gateway', label: 'بوابة الدفع', labelEn: 'Payment Gateway', section: 'العمليات', sectionEn: 'Operations', icon: 'Link2', keywords: ['دفع', 'بوابة دفع', 'payment'] },
  { id: 'fleet', label: 'إدارة الأسطول', labelEn: 'Fleet Management', section: 'العمليات', sectionEn: 'Operations', icon: 'Car', keywords: ['أسطول', 'مركبة', 'سيارات', 'fleet', 'vehicle'] },
  { id: 'maintenance', label: 'الصيانة', labelEn: 'Maintenance', section: 'العمليات', sectionEn: 'Operations', icon: 'Hammer', keywords: ['صيانة', 'maintenance'] },
  { id: 'quality-control', label: 'مراقبة الجودة', labelEn: 'Quality Control', section: 'العمليات', sectionEn: 'Operations', icon: 'SquareCheck', keywords: ['جودة', 'فحص', 'quality'] },
  { id: 'field-service', label: 'خدمة ميدانية', labelEn: 'Field Service', section: 'العمليات', sectionEn: 'Operations', icon: 'MapPinned', keywords: ['ميداني', 'فني', 'field'] },
  { id: 'helpdesk', label: 'الدعم الفني', labelEn: 'Helpdesk', section: 'العمليات', sectionEn: 'Operations', icon: 'Headphones', keywords: ['دعم', 'مساعدة', 'support', 'helpdesk'] },
  { id: 'appointments', label: 'حجز المواعيد', labelEn: 'Appointments', section: 'العمليات', sectionEn: 'Operations', icon: 'CalendarCheck', keywords: ['موعد', 'مواعيد', 'appointment'] },

  // === التسويق / Marketing ===
  { id: 'email-marketing', label: 'حملات البريد', labelEn: 'Email Marketing', section: 'التسويق', sectionEn: 'Marketing', icon: 'Mail', keywords: ['بريد', 'إيميل', 'email', 'حملة'] },
  { id: 'sms-marketing', label: 'رسائل SMS', labelEn: 'SMS Marketing', section: 'التسويق', sectionEn: 'Marketing', icon: 'Phone', keywords: ['رسالة', 'sms', 'رسائل'] },
  { id: 'social-marketing', label: 'وسائل التواصل', labelEn: 'Social Marketing', section: 'التسويق', sectionEn: 'Marketing', icon: 'Share2', keywords: ['تواصل', 'اجتماعي', 'social'] },
  { id: 'events', label: 'إدارة الفعاليات', labelEn: 'Events', section: 'التسويق', sectionEn: 'Marketing', icon: 'PartyPopper', keywords: ['فعالية', 'حدث', 'event'] },
  { id: 'surveys', label: 'استطلاعات الرأي', labelEn: 'Surveys', section: 'التسويق', sectionEn: 'Marketing', icon: 'ClipboardList', keywords: ['استبيان', 'استطلاع', 'survey'] },

  // === المعرفة والتعليم / Knowledge ===
  { id: 'elearning', label: 'الدورات التدريبية', labelEn: 'eLearning', section: 'المعرفة', sectionEn: 'Knowledge', icon: 'GraduationCap', keywords: ['دورة', 'تدريب', 'تعليم', 'elearning'] },
  { id: 'knowledge-base', label: 'ويكي داخلي', labelEn: 'Knowledge Base', section: 'المعرفة', sectionEn: 'Knowledge', icon: 'BookOpenCheck', keywords: ['معرفة', 'ويكي', 'wiki'] },

  // === التكاملات / Integrations ===
  { id: 'integrations', label: 'التكاملات الخارجية', labelEn: 'Integrations', section: 'التكاملات', sectionEn: 'Integrations', icon: 'Plug', keywords: ['تكامل', 'ربط', 'integration'] },
  { id: 'api-management', label: 'API عام', labelEn: 'API Management', section: 'التكاملات', sectionEn: 'Integrations', icon: 'Globe', keywords: ['api', 'واجهة برمجة'] },
  { id: 'developer-api', label: 'API للمطورين', labelEn: 'Developer API', section: 'التكاملات', sectionEn: 'Integrations', icon: 'Code', keywords: ['مطور', 'developer'] },
  { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', section: 'التكاملات', sectionEn: 'Integrations', icon: 'Puzzle', keywords: ['إضافة', 'plugin'] },

  // === النظام / System ===
  { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'User Management', section: 'النظام', sectionEn: 'System', icon: 'UserCog', keywords: ['مستخدم', 'صلاحية', 'user', 'permission'] },
  { id: 'branches', label: 'الفروع', labelEn: 'Branches', section: 'النظام', sectionEn: 'System', icon: 'GitFork', keywords: ['فرع', 'فروع', 'branch'] },
  { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', section: 'النظام', sectionEn: 'System', icon: 'Calendar', keywords: ['سنة مالية', 'fiscal'] },
  { id: 'tasks', label: 'إدارة المهام', labelEn: 'Tasks', section: 'النظام', sectionEn: 'System', icon: 'ListTodo', keywords: ['مهمة', 'مهام', 'task'] },
  { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', section: 'النظام', sectionEn: 'System', icon: 'GitBranch', keywords: ['موافقة', 'اعتماد', 'approval'] },
  { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', section: 'النظام', sectionEn: 'System', icon: 'Workflow', keywords: ['دورة مستندية', 'workflow'] },
  { id: 'app-settings', label: 'إعدادات النظام', labelEn: 'App Settings', section: 'النظام', sectionEn: 'System', icon: 'Settings', keywords: ['إعداد', 'ضبط', 'setting'] },
  { id: 'theme-settings', label: 'المظهر', labelEn: 'Theme Settings', section: 'النظام', sectionEn: 'System', icon: 'Palette', keywords: ['مظهر', 'ثيم', 'theme', 'لون'] },
  { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', section: 'النظام', sectionEn: 'System', icon: 'Settings2', keywords: ['تحكم', 'control'] },
  { id: 'audit-logs', label: 'سجل التدقيق', labelEn: 'Audit Logs', section: 'النظام', sectionEn: 'System', icon: 'ClipboardList', keywords: ['تدقيق', 'سجل', 'audit', 'log'] },
  { id: 'accounting-audit', label: 'تدقيق محاسبي', labelEn: 'Accounting Audit', section: 'النظام', sectionEn: 'System', icon: 'ShieldCheck', keywords: ['تدقيق محاسبي'] },
  { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', section: 'النظام', sectionEn: 'System', icon: 'Database', keywords: ['نسخ', 'احتياطي', 'backup'] },
  { id: 'medad-import', label: 'استيراد من ميداد', labelEn: 'Medad Import', section: 'النظام', sectionEn: 'System', icon: 'FileUp', keywords: ['ميداد', 'استيراد', 'medad', 'import'] },
  { id: 'zatca-sandbox', label: 'بيئة محاكاة ZATCA', labelEn: 'ZATCA Sandbox', section: 'النظام', sectionEn: 'System', icon: 'TestTube', keywords: ['زاتكا', 'هيئة', 'zatca', 'فاتورة إلكترونية'] },
  { id: 'zatca-technical-doc', label: 'وثائق ZATCA', labelEn: 'ZATCA Docs', section: 'النظام', sectionEn: 'System', icon: 'FileText', keywords: ['وثائق', 'zatca'] },
  { id: 'mobile-invoice-reader', label: 'قراءة فاتورة بالجوال', labelEn: 'Invoice Reader', section: 'النظام', sectionEn: 'System', icon: 'QrCode', keywords: ['قراءة', 'جوال', 'qr'] },
  { id: 'internal-chat', label: 'الدردشة الداخلية', labelEn: 'Internal Chat', section: 'النظام', sectionEn: 'System', icon: 'MessagesSquare', keywords: ['دردشة', 'محادثة', 'chat', 'رسالة'] },
  { id: 'e-signature', label: 'التوقيع الإلكتروني', labelEn: 'E-Signature', section: 'النظام', sectionEn: 'System', icon: 'PenTool', keywords: ['توقيع', 'إلكتروني', 'signature'] },
  { id: 'plm', label: 'دورة حياة المنتج', labelEn: 'PLM', section: 'النظام', sectionEn: 'System', icon: 'Layers', keywords: ['plm', 'دورة حياة', 'منتج'] },
  { id: 'barcode-scanner', label: 'ماسح الباركود', labelEn: 'Barcode Scanner', section: 'النظام', sectionEn: 'System', icon: 'ScanBarcode', keywords: ['باركود', 'barcode', 'ماسح'] },
  { id: 'support-contact', label: 'تواصل مع الدعم', labelEn: 'Contact Support', section: 'النظام', sectionEn: 'System', icon: 'Headphones', keywords: ['دعم', 'تواصل', 'support', 'مساعدة'] },
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
