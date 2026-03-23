import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Plus,
  DollarSign, Users, ShoppingCart, Car, Percent, Clock, Edit2, Trash2, Loader2, BarChart3, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useReportsServices';
import { fetchKPITargets, saveKPITargets, fetchCarKPIMetrics, fetchInvoiceKPIMetrics } from '@/services/kpi/kpiService';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { toast } from 'sonner';

interface KPITarget {
  id: string;
  name: string;
  metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  alert_threshold: number;
  icon: string;
}

const COMMON_METRIC_OPTIONS = [
  { value: 'total_sales', label: 'إجمالي المبيعات', icon: DollarSign, unit: 'ر.س' },
  { value: 'total_profit', label: 'إجمالي الأرباح', icon: TrendingUp, unit: 'ر.س' },
  { value: 'sales_count', label: 'عدد الصفقات', icon: ShoppingCart, unit: 'صفقة' },
  { value: 'new_customers', label: 'عملاء جدد', icon: Users, unit: 'عميل' },
  { value: 'profit_margin', label: 'هامش الربح', icon: Percent, unit: '%' },
  { value: 'total_expenses', label: 'إجمالي المصروفات', icon: BarChart3, unit: 'ر.س' },
];

const CAR_METRIC_OPTIONS = [
  { value: 'available_cars', label: 'مخزون متاح', icon: Car, unit: 'سيارة' },
  { value: 'avg_days_to_sell', label: 'متوسط أيام البيع', icon: Clock, unit: 'يوم' },
];

const COMMON_DEFAULT_TARGETS: Omit<KPITarget, 'current_value'>[] = [
  { id: '1', name: 'هدف المبيعات الشهري', metric: 'total_sales', target_value: 500000, unit: 'ر.س', alert_threshold: 70, icon: 'DollarSign' },
  { id: '2', name: 'هدف الأرباح', metric: 'total_profit', target_value: 100000, unit: 'ر.س', alert_threshold: 60, icon: 'TrendingUp' },
  { id: '3', name: 'عدد الصفقات', metric: 'sales_count', target_value: 20, unit: 'صفقة', alert_threshold: 50, icon: 'ShoppingCart' },
  { id: '4', name: 'عملاء جدد', metric: 'new_customers', target_value: 10, unit: 'عميل', alert_threshold: 40, icon: 'Users' },
  { id: '5', name: 'هامش الربح', metric: 'profit_margin', target_value: 15, unit: '%', alert_threshold: 80, icon: 'Percent' },
];

const CAR_DEFAULT_TARGETS: Omit<KPITarget, 'current_value'>[] = [
  { id: '6', name: 'متوسط أيام البيع', metric: 'avg_days_to_sell', target_value: 30, unit: 'يوم', alert_threshold: 120, icon: 'Clock' },
  { id: '7', name: 'مخزون متاح', metric: 'available_cars', target_value: 50, unit: 'سيارة', alert_threshold: 60, icon: 'Car' },
];

export function ExecutiveKPIDashboard() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<KPITarget | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMetric, setFormMetric] = useState('total_sales');
  const [formTargetValue, setFormTargetValue] = useState(0);
  const [formAlertThreshold, setFormAlertThreshold] = useState(70);

  // Load saved targets from app_settings
  const { data: savedTargets } = useQuery({
    queryKey: ['kpi-targets', companyId],
    queryFn: () => fetchKPITargets(companyId!),
    enabled: !!companyId,
  });

  const { hasCarInventory } = useIndustryFeatures();

  const METRIC_OPTIONS = useMemo(() => 
    hasCarInventory ? [...COMMON_METRIC_OPTIONS, ...CAR_METRIC_OPTIONS] : COMMON_METRIC_OPTIONS,
    [hasCarInventory]
  );
  const DEFAULT_TARGETS = useMemo(() => 
    hasCarInventory ? [...COMMON_DEFAULT_TARGETS, ...CAR_DEFAULT_TARGETS] : COMMON_DEFAULT_TARGETS,
    [hasCarInventory]
  );

  // Fetch actual metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['kpi-actuals', companyId, hasCarInventory],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      if (hasCarInventory) {
        const [salesRes, carsRes, customersRes, expensesRes] = await Promise.all([
          supabase.from('sales').select('sale_price, purchase_price, sale_date, customer_id').eq('company_id', companyId!).gte('sale_date', monthStart),
          supabase.from('cars').select('id, status, purchase_date').eq('company_id', companyId!),
          supabase.from('customers').select('id, created_at').eq('company_id', companyId!).gte('created_at', monthStart),
          supabase.from('expenses').select('amount, expense_date').eq('company_id', companyId!).gte('expense_date', monthStart),
        ]);

        const sales = salesRes.data || [];
        const cars = carsRes.data || [];
        const customers = customersRes.data || [];
        const expenses = expensesRes.data || [];

        const totalSales = sales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
        const totalPurchasePrice = sales.reduce((s: number, r: any) => s + (r.purchase_price || 0), 0);
        const totalProfit = totalSales - totalPurchasePrice;
        const totalExpenses = expenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);
        const availableCars = cars.filter((c: any) => c.status === 'available').length;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        const soldCars = cars.filter((c: any) => c.status === 'sold');
        const avgDays = soldCars.length > 0 ? soldCars.reduce((s: number, c: any) => {
          const purchaseDate = new Date(c.purchase_date);
          const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / 86400000);
          return s + daysDiff;
        }, 0) / soldCars.length : 0;

        return {
          total_sales: totalSales,
          total_profit: totalProfit,
          sales_count: sales.length,
          new_customers: customers.length,
          available_cars: availableCars,
          profit_margin: Math.round(profitMargin * 10) / 10,
          avg_days_to_sell: Math.round(avgDays),
          total_expenses: totalExpenses,
        } as Record<string, number>;
      }

      // Non-car: use invoices table
      const [invoicesRes, customersRes, expensesRes] = await Promise.all([
        supabase.from('invoices').select('subtotal, invoice_date').eq('company_id', companyId!).eq('invoice_type', 'sales').gte('invoice_date', monthStart),
        supabase.from('customers').select('id, created_at').eq('company_id', companyId!).gte('created_at', monthStart),
        supabase.from('expenses').select('amount, expense_date').eq('company_id', companyId!).gte('expense_date', monthStart),
      ]);

      const invoices = invoicesRes.data || [];
      const customers = customersRes.data || [];
      const expenses = expensesRes.data || [];

      const totalSales = invoices.reduce((s: number, r: any) => s + (r.subtotal || 0), 0);
      const totalExpenses = expenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);

      return {
        total_sales: totalSales,
        total_profit: totalSales - totalExpenses,
        sales_count: invoices.length,
        new_customers: customers.length,
        available_cars: 0,
        profit_margin: totalSales > 0 ? Math.round(((totalSales - totalExpenses) / totalSales) * 1000) / 10 : 0,
        avg_days_to_sell: 0,
        total_expenses: totalExpenses,
      } as Record<string, number>;
    },
    enabled: !!companyId,
  });

  const targets: KPITarget[] = useMemo(() => {
    const base = savedTargets || DEFAULT_TARGETS;
    return base.map((t: any) => ({
      ...t,
      current_value: metrics?.[t.metric] || 0,
    }));
  }, [savedTargets, metrics]);

  const saveTargets = useMutation({
    mutationFn: async (newTargets: any[]) => {
      const { data: existing } = await supabase.from('app_settings')
        .select('id').eq('company_id', companyId!).eq('key', 'kpi_targets').maybeSingle();
      
      if (existing) {
        await supabase.from('app_settings').update({ value: JSON.stringify(newTargets) }).eq('id', existing.id);
      } else {
        await supabase.from('app_settings').insert({ company_id: companyId!, key: 'kpi_targets', value: JSON.stringify(newTargets) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-targets'] });
      toast.success('تم حفظ الأهداف');
    },
  });

  const handleSaveTarget = () => {
    const metricInfo = METRIC_OPTIONS.find(m => m.value === formMetric);
    const newTarget = {
      id: editTarget?.id || crypto.randomUUID(),
      name: formName,
      metric: formMetric,
      target_value: formTargetValue,
      unit: metricInfo?.unit || '',
      alert_threshold: formAlertThreshold,
      icon: metricInfo?.icon?.name || 'Target',
    };

    const currentTargets = savedTargets || DEFAULT_TARGETS;
    const updated = editTarget
      ? currentTargets.map((t: any) => t.id === editTarget.id ? newTarget : t)
      : [...currentTargets, newTarget];

    saveTargets.mutate(updated);
    setShowAddDialog(false);
    setEditTarget(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const currentTargets = savedTargets || DEFAULT_TARGETS;
    saveTargets.mutate(currentTargets.filter((t: any) => t.id !== id));
  };

  const resetForm = () => {
    setFormName('');
    setFormMetric('total_sales');
    setFormTargetValue(0);
    setFormAlertThreshold(70);
  };

  const openEdit = (target: KPITarget) => {
    setEditTarget(target);
    setFormName(target.name);
    setFormMetric(target.metric);
    setFormTargetValue(target.target_value);
    setFormAlertThreshold(target.alert_threshold);
    setShowAddDialog(true);
  };

  const fmt = (n: number, unit: string) => {
    if (unit === '%') return `${n}%`;
    if (unit === 'يوم' || unit === 'صفقة' || unit === 'عميل' || unit === 'سيارة') return `${n} ${unit}`;
    return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة مؤشرات الأداء</h1>
            <p className="text-muted-foreground">مؤشرات أداء مخصصة مع أهداف وتنبيهات فورية</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setEditTarget(null); setShowAddDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" />إضافة هدف
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        {(() => {
          const achieved = targets.filter(t => {
            const pct = t.metric === 'avg_days_to_sell'
              ? (t.target_value > 0 ? (t.target_value / Math.max(t.current_value, 1)) * 100 : 100)
              : (t.target_value > 0 ? (t.current_value / t.target_value) * 100 : 0);
            return pct >= 100;
          }).length;
          const atRisk = targets.filter(t => {
            const pct = t.metric === 'avg_days_to_sell'
              ? (t.target_value > 0 ? (t.target_value / Math.max(t.current_value, 1)) * 100 : 100)
              : (t.target_value > 0 ? (t.current_value / t.target_value) * 100 : 0);
            return pct < t.alert_threshold;
          }).length;
          return (
            <>
              <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{achieved} محقق</Badge>
              {atRisk > 0 && <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />{atRisk} بحاجة انتباه</Badge>}
              <Badge variant="secondary" className="gap-1"><Activity className="w-3 h-3" />{targets.length} مؤشر</Badge>
            </>
          );
        })()}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((target) => {
          // For "avg_days_to_sell", lower is better
          const isInverse = target.metric === 'avg_days_to_sell';
          const pct = isInverse
            ? (target.target_value > 0 ? (target.target_value / Math.max(target.current_value, 1)) * 100 : 100)
            : (target.target_value > 0 ? (target.current_value / target.target_value) * 100 : 0);
          const clampedPct = Math.min(pct, 100);
          const isAchieved = pct >= 100;
          const isAtRisk = pct < target.alert_threshold;

          const MetricIcon = METRIC_OPTIONS.find(m => m.value === target.metric)?.icon || Target;

          return (
            <Card key={target.id} className={`relative overflow-hidden transition-all ${isAtRisk ? 'border-destructive/50 shadow-destructive/10 shadow-md' : isAchieved ? 'border-green-500/50 shadow-green-500/10 shadow-md' : ''}`}>
              {isAtRisk && <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />}
              {isAchieved && <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />}
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAtRisk ? 'bg-destructive/10' : isAchieved ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                      <MetricIcon className={`w-5 h-5 ${isAtRisk ? 'text-destructive' : isAchieved ? 'text-green-500' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{target.name}</p>
                      <p className="text-xs text-muted-foreground">الهدف: {fmt(target.target_value, target.unit)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(target)} className="p-1 rounded hover:bg-muted"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(target.id)} className="p-1 rounded hover:bg-muted"><Trash2 className="w-3 h-3 text-muted-foreground" /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">{fmt(target.current_value, target.unit)}</span>
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${isAtRisk ? 'text-destructive' : isAchieved ? 'text-green-500' : 'text-primary'}`}>
                      {isAchieved ? <TrendingUp className="w-3 h-3" /> : isAtRisk ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <Progress value={clampedPct} className="h-2" />
                  {isAtRisk && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      أقل من عتبة التنبيه ({target.alert_threshold}%)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'تعديل الهدف' : 'إضافة هدف جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المؤشر *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثل: هدف المبيعات الشهري" /></div>
            <div>
              <Label>المقياس *</Label>
              <Select value={formMetric} onValueChange={setFormMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>القيمة المستهدفة *</Label><Input type="number" value={formTargetValue} onChange={e => setFormTargetValue(Number(e.target.value))} /></div>
            <div><Label>عتبة التنبيه (%) - يُنبه عند الانخفاض دونها</Label><Input type="number" value={formAlertThreshold} onChange={e => setFormAlertThreshold(Number(e.target.value))} min={0} max={100} /></div>
            <Button onClick={handleSaveTarget} disabled={!formName || !formTargetValue} className="w-full">
              {editTarget ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
