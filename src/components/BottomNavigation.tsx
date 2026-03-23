import { LayoutDashboard, ShoppingCart, DollarSign, Users, Menu, HardHat, Ship, UtensilsCrossed, Building2, LucideIcon } from 'lucide-react';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';

interface BottomNavigationProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onMenuClick: () => void;
}

interface NavItem {
  id: ActivePage;
  label: string;
  label_en: string;
  icon: LucideIcon;
}

function getNavItems(companyType: CompanyActivityType): NavItem[] {
  const features = getIndustryFeatures(companyType);

  const baseNav: NavItem[] = [
    { id: 'dashboard', label: 'الرئيسية', label_en: 'Home', icon: LayoutDashboard },
  ];

  if (features.hasConstructionProjects) {
    baseNav.push(
      { id: 'projects', label: 'المشاريع', label_en: 'Projects', icon: HardHat },
      { id: 'contracts', label: 'العقود', label_en: 'Contracts', icon: DollarSign },
    );
  } else if (features.hasRealEstateProjects) {
    baseNav.push(
      { id: 'purchases', label: 'المشاريع', label_en: 'Projects', icon: Building2 },
      { id: 'sales', label: 'المبيعات', label_en: 'Sales', icon: DollarSign },
    );
  } else {
    baseNav.push(
      { id: 'purchases', label: 'المشتريات', label_en: 'Purchases', icon: ShoppingCart },
      { id: 'sales', label: 'المبيعات', label_en: 'Sales', icon: DollarSign },
    );
  }

  baseNav.push({ id: 'customers', label: 'العملاء', label_en: 'Customers', icon: Users });

  return baseNav;
}

export function BottomNavigation({ activePage, setActivePage, onMenuClick }: BottomNavigationProps) {
  const { company } = useCompany();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const companyType: CompanyActivityType = company?.company_type || 'general_trading';
  const navItems = getNavItems(companyType);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/98 backdrop-blur-lg border-t-2 border-border/80 shadow-2xl safe-area-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}>
      <div className="flex items-center justify-around px-1 sm:px-2 py-1.5 sm:py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg transition-all duration-200 min-w-[50px] sm:min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[9px] sm:text-[10px] font-medium leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {isEn ? item.label_en : item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg transition-all duration-200 min-w-[50px] sm:min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight">{isEn ? 'More' : 'المزيد'}</span>
        </button>
      </div>
    </nav>
  );
}
