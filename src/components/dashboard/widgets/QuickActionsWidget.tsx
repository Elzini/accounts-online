import { useState } from 'react';
import { ShoppingCart, DollarSign, UserPlus, Truck, Receipt, HandCoins, Calculator, FileCheck, Settings2, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS_CONFIG_KEY = 'dashboard_quick_actions_config';

interface QuickAction {
  id: string;
  label: string;
  labelEn: string;
  icon: any;
  page: ActivePage;
  permissionKey: 'sales' | 'purchases' | 'accounting';
  gradient: string;
  visible: boolean;
  order: number;
}

const ALL_ACTIONS: QuickAction[] = [
  { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, page: 'sales', permissionKey: 'sales', gradient: 'from-emerald-500 to-emerald-600', visible: true, order: 0 },
  { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, page: 'purchases', permissionKey: 'purchases', gradient: 'from-blue-500 to-blue-600', visible: true, order: 1 },
  { id: 'vouchers', label: 'سند قبض/صرف', labelEn: 'Voucher', icon: Receipt, page: 'vouchers', permissionKey: 'accounting', gradient: 'from-purple-500 to-purple-600', visible: true, order: 2 },
  { id: 'journal', label: 'قيد يومية', labelEn: 'Journal Entry', icon: Calculator, page: 'journal-entries', permissionKey: 'accounting', gradient: 'from-indigo-500 to-indigo-600', visible: true, order: 3 },
  { id: 'custody', label: 'عهدة جديدة', labelEn: 'New Custody', icon: HandCoins, page: 'custody', permissionKey: 'accounting', gradient: 'from-amber-500 to-amber-600', visible: true, order: 4 },
  { id: 'quotation', label: 'عرض سعر', labelEn: 'Quotation', icon: FileCheck, page: 'quotations', permissionKey: 'sales', gradient: 'from-cyan-500 to-cyan-600', visible: true, order: 5 },
  { id: 'add-customer', label: 'عميل جديد', labelEn: 'New Customer', icon: UserPlus, page: 'add-customer', permissionKey: 'sales', gradient: 'from-teal-500 to-teal-600', visible: true, order: 6 },
  { id: 'add-supplier', label: 'مورد جديد', labelEn: 'New Supplier', icon: Truck, page: 'add-supplier', permissionKey: 'purchases', gradient: 'from-orange-500 to-orange-600', visible: true, order: 7 },
];

function loadConfig(): QuickAction[] {
  try {
    const saved = localStorage.getItem(QUICK_ACTIONS_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { id: string; visible: boolean; order: number }[];
      return ALL_ACTIONS.map(a => {
        const cfg = parsed.find(p => p.id === a.id);
        return cfg ? { ...a, visible: cfg.visible, order: cfg.order } : a;
      }).sort((a, b) => a.order - b.order);
    }
  } catch {}
  return ALL_ACTIONS;
}

function saveConfig(actions: QuickAction[]) {
  localStorage.setItem(QUICK_ACTIONS_CONFIG_KEY, JSON.stringify(
    actions.map(a => ({ id: a.id, visible: a.visible, order: a.order }))
  ));
}

interface QuickActionsWidgetProps {
  setActivePage: (page: ActivePage) => void;
  canSales: boolean;
  canPurchases: boolean;
  gridColumns?: number;
  density?: 'compact' | 'comfortable' | 'spacious';
}

export function QuickActionsWidget({ setActivePage, canSales, canPurchases, gridColumns = 4, density = 'comfortable' }: QuickActionsWidgetProps) {
  const { t, language } = useLanguage();
  const { permissions } = useAuth();
  const canAccounting = permissions.admin || permissions.reports;
  const isRtl = language === 'ar';

  const [actions, setActions] = useState<QuickAction[]>(loadConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasPermission = (key: string) => {
    if (key === 'sales') return canSales;
    if (key === 'purchases') return canPurchases;
    if (key === 'accounting') return canAccounting;
    return true;
  };

  const visibleActions = actions.filter(a => a.visible && hasPermission(a.permissionKey));

  const toggleAction = (id: string) => {
    const updated = actions.map(a => a.id === id ? { ...a, visible: !a.visible } : a);
    setActions(updated);
    saveConfig(updated);
  };

  const moveAction = (id: string, dir: -1 | 1) => {
    const sorted = [...actions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(a => a.id === id);
    if ((dir === -1 && idx <= 0) || (dir === 1 && idx >= sorted.length - 1)) return;
    const swapIdx = idx + dir;
    const temp = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
    sorted[swapIdx] = { ...sorted[swapIdx], order: temp };
    const reordered = sorted.sort((a, b) => a.order - b.order);
    setActions(reordered);
    saveConfig(reordered);
  };

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold text-card-foreground flex items-center gap-2">
          🚀 {t.quick_actions || 'إجراءات سريعة'}
        </h2>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{isRtl ? 'تخصيص الإجراءات السريعة' : 'Customize Quick Actions'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {[...actions].sort((a, b) => a.order - b.order).map(action => {
                const Icon = action.icon;
                const enabled = hasPermission(action.permissionKey);
                return (
                  <div
                    key={action.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                      !enabled && 'opacity-40',
                      action.visible ? 'border-primary/30 bg-primary/5' : 'border-border'
                    )}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium flex-1 truncate">
                      {isRtl ? action.label : action.labelEn}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveAction(action.id, -1)}>
                        <span className="text-[10px]">▲</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveAction(action.id, 1)}>
                        <span className="text-[10px]">▼</span>
                      </Button>
                      <button
                        onClick={() => toggleAction(action.id)}
                        disabled={!enabled}
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                          action.visible ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                        )}
                      >
                        {action.visible && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
        {visibleActions.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={() => setActivePage(action.page)}
              variant="ghost"
              className={cn(
                "h-auto flex flex-col items-center gap-1.5 hover:bg-muted/60 border border-transparent hover:border-border/50 rounded-lg transition-all",
                density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-4' : 'py-3'
              )}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-medium text-foreground/80 leading-tight text-center">
                {isRtl ? action.label : action.labelEn}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
