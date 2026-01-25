import { LayoutDashboard, ShoppingCart, DollarSign, Users, FileText, Menu } from 'lucide-react';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onMenuClick: () => void;
}

const navItems = [
  { id: 'dashboard' as ActivePage, label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'purchases' as ActivePage, label: 'المشتريات', icon: ShoppingCart },
  { id: 'sales' as ActivePage, label: 'المبيعات', icon: DollarSign },
  { id: 'customers' as ActivePage, label: 'العملاء', icon: Users },
];

export function BottomNavigation({ activePage, setActivePage, onMenuClick }: BottomNavigationProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-all duration-200 min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </div>
    </nav>
  );
}
