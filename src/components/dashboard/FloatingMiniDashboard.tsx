import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, ShoppingCart, Package, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStats } from '@/hooks/useDatabase';
import { useCompanyId } from '@/hooks/useCompanyId';

const FLOATING_PANEL_KEY = 'floating_panel_visible';
const FLOATING_PANEL_POS_KEY = 'floating_panel_position';

interface FloatingMiniDashboardProps {
  isOnDashboard?: boolean;
}

export function FloatingMiniDashboard({ isOnDashboard = false }: FloatingMiniDashboardProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const companyId = useCompanyId();
  const { data: stats } = useStats();

  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(FLOATING_PANEL_KEY) === 'true';
    } catch { return false; }
  });
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(FLOATING_PANEL_POS_KEY);
      return saved ? JSON.parse(saved) : { x: 20, y: 100 };
    } catch { return { x: 20, y: 100 }; }
  });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Hide on dashboard page
  if (isOnDashboard || !visible || !stats) return null;

  const toggleVisible = () => {
    const next = !visible;
    setVisible(next);
    localStorage.setItem(FLOATING_PANEL_KEY, String(next));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newPos = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    setPosition(newPos);
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      localStorage.setItem(FLOATING_PANEL_POS_KEY, JSON.stringify(position));
    }
  };

  const kpis = [
    { icon: Package, label: isRtl ? 'المخزون' : 'Stock', value: stats.availableCars, color: 'text-blue-500' },
    { icon: DollarSign, label: isRtl ? 'مبيعات الشهر' : 'Sales', value: new Intl.NumberFormat('en-SA', { notation: 'compact' }).format(stats.monthSalesAmount || 0), color: 'text-emerald-500' },
    { icon: ShoppingCart, label: isRtl ? 'المشتريات' : 'Purchases', value: new Intl.NumberFormat('en-SA', { notation: 'compact' }).format(stats.totalPurchases || 0), color: 'text-red-500' },
    { icon: TrendingUp, label: isRtl ? 'الأرباح' : 'Profit', value: new Intl.NumberFormat('en-SA', { notation: 'compact' }).format(stats.totalProfit || 0), color: 'text-amber-500' },
  ];

  return (
    <div
      className={cn(
        'fixed z-50 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl transition-all select-none',
        dragging && 'cursor-grabbing opacity-90',
        !dragging && 'cursor-grab'
      )}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <span className="text-[10px] font-bold text-muted-foreground">
          {isRtl ? '📊 مؤشرات سريعة' : '📊 Quick KPIs'}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMinimized(!minimized)}>
            {minimized ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={toggleVisible}>
            <X className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="p-2 grid grid-cols-2 gap-1.5 min-w-[180px]">
          {kpis.map((kpi, i) => (
            <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/40">
              <kpi.icon className={cn('w-3 h-3 shrink-0', kpi.color)} />
              <div className="min-w-0">
                <div className="text-[9px] text-muted-foreground truncate">{kpi.label}</div>
                <div className="text-[11px] font-bold">{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Toggle button to show/hide the floating panel */
export function FloatingPanelToggle() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  
  const toggle = () => {
    const current = localStorage.getItem(FLOATING_PANEL_KEY) === 'true';
    localStorage.setItem(FLOATING_PANEL_KEY, String(!current));
    window.location.reload();
  };

  const isActive = localStorage.getItem(FLOATING_PANEL_KEY) === 'true';

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={toggle}>
      <TrendingUp className="w-3.5 h-3.5" />
      {isRtl ? (isActive ? 'إخفاء اللوحة العائمة' : 'لوحة عائمة') : (isActive ? 'Hide Panel' : 'Float Panel')}
    </Button>
  );
}
