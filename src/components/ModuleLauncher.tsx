import { LucideIcon, LayoutDashboard, Users, ShoppingCart, DollarSign, BookOpen, Warehouse, Users2, Wrench, Plug, Settings, Crown, FileText, Factory, MapPin, UtensilsCrossed, Ship, Building2 } from 'lucide-react';
import { ActivePage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import defaultLogo from '@/assets/logo.png';

interface ModuleLauncherProps {
  setActivePage: (page: ActivePage) => void;
  onModuleSelect: (moduleId: string) => void;
}

interface ModuleItem {
  id: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  page?: ActivePage;
  permission?: string;
}

export function ModuleLauncher({ setActivePage, onModuleSelect }: ModuleLauncherProps) {
  const { permissions } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { language } = useLanguage();

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;

  const modules: ModuleItem[] = [
    { id: 'main', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard, color: 'bg-emerald-500', page: 'dashboard' },
    { id: 'sales', label: 'المبيعات', labelEn: 'Sales', icon: DollarSign, color: 'bg-blue-500', permission: 'sales' },
    { id: 'purchases', label: 'المشتريات', labelEn: 'Purchases', icon: ShoppingCart, color: 'bg-orange-500', permission: 'purchases' },
    { id: 'accounting', label: 'المحاسبة', labelEn: 'Accounting', icon: BookOpen, color: 'bg-indigo-600', permission: 'reports' },
    { id: 'inventory', label: 'المستودعات', labelEn: 'Inventory', icon: Warehouse, color: 'bg-amber-600', permission: 'purchases' },
    { id: 'hr', label: 'الموارد البشرية', labelEn: 'HR', icon: Users2, color: 'bg-teal-500', permission: 'employees' },
    { id: 'operations', label: 'العمليات', labelEn: 'Operations', icon: Wrench, color: 'bg-purple-500' },
    { id: 'integrations', label: 'التكامل', labelEn: 'Integrations', icon: Plug, color: 'bg-pink-500' },
    { id: 'system', label: 'النظام', labelEn: 'System', icon: Settings, color: 'bg-gray-600', permission: 'admin' },
  ];

  // Add industry-specific modules
  if (companyType === 'construction') {
    modules.splice(3, 0, { id: 'construction', label: 'المقاولات', labelEn: 'Construction', icon: Building2, color: 'bg-yellow-600', permission: 'purchases' });
  }
  if (companyType === 'restaurant') {
    modules.splice(3, 0, { id: 'restaurant', label: 'المطعم', labelEn: 'Restaurant', icon: UtensilsCrossed, color: 'bg-red-500', permission: 'sales' });
  }
  if (companyType === 'export_import') {
    modules.splice(3, 0, { id: 'export_import', label: 'الاستيراد والتصدير', labelEn: 'Export/Import', icon: Ship, color: 'bg-cyan-600', permission: 'purchases' });
  }

  // Super admin module
  if (permissions.super_admin) {
    modules.push({ id: 'super_admin', label: 'إدارة الشركات', labelEn: 'Companies', icon: Crown, color: 'bg-yellow-500' });
  }

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.admin || (permissions as any)[permission];
  };

  const handleModuleClick = (mod: ModuleItem) => {
    if (mod.page) {
      setActivePage(mod.page);
      return;
    }
    onModuleSelect(mod.id);
  };

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    return 'Elzini SaaS';
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 sm:p-8">
      {/* Logo & Title */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-card shadow-lg ring-2 ring-border/50">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{getAppName()}</h1>
        <p className="text-sm text-muted-foreground mt-1">{language === 'ar' ? 'اختر الوحدة للبدء' : 'Select a module to start'}</p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 max-w-4xl w-full">
        {modules.filter(m => hasAccess(m.permission)).map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => handleModuleClick(mod)}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:bg-card hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${mod.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight">
                {language === 'ar' ? mod.label : mod.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 sm:mt-16 flex flex-col items-center gap-3">
        <LanguageSwitcher variant="compact" />
        <p className="text-[10px] text-muted-foreground/50">
          Elzini SaaS © 2026
        </p>
      </div>
    </div>
  );
}
