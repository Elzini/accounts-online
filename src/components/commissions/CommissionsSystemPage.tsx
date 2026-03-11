import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Users, TrendingUp, Plus, Calculator, Loader2, Award, Crown, Medal, Edit2, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CommissionRule {
  id: string;
  employee_name: string;
  rate_type: 'percentage' | 'fixed_per_sale';
  rate_value: number;
  min_sales: number;
  bonus_rate: number;
  bonus_threshold: number;
}

export function CommissionsSystemPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editRule, setEditRule] = useState<CommissionRule | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter'>('month');

  // Form state
  const [formEmployee, setFormEmployee] = useState('');
  const [formRateType, setFormRateType] = useState<'percentage' | 'fixed_per_sale'>('percentage');
  const [formRateValue, setFormRateValue] = useState(3);
  const [formMinSales, setFormMinSales] = useState(0);
  const [formBonusRate, setFormBonusRate] = useState(1);
  const [formBonusThreshold, setFormBonusThreshold] = useState(200000);

  // Load commission rules
  const { data: rules = [] } = useQuery({
    queryKey: ['commission-rules', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings')
        .select('value').eq('company_id', companyId!).eq('key', 'commission_rules').maybeSingle();
      return data?.value ? JSON.parse(data.value) as CommissionRule[] : [];
    },
    enabled: !!companyId,
  });

  // Fetch sales data with salesperson info
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['commission-sales', companyId, period],
    queryFn: async () => {
      const now = new Date();
      let start: string;
      if (period === 'month') {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        start = `${now.getFullYear()}-${String(qMonth + 1).padStart(2, '0')}-01`;
      }
      const { data } = await supabase.from('sales')
        .select('sale_price, purchase_price, sale_date, salesperson_name')
        .eq('company_id', companyId!)
        .gte('sale_date', start);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Calculate commissions
  const commissions = useMemo(() => {
    const byEmployee: Record<string, { sales_total: number; sales_count: number; profit: number }> = {};

    sales.forEach((s: any) => {
      const emp = s.salesperson_name || 'غير محدد';
      if (!byEmployee[emp]) byEmployee[emp] = { sales_total: 0, sales_count: 0, profit: 0 };
      byEmployee[emp].sales_total += s.sale_price || 0;
      byEmployee[emp].sales_count += 1;
      byEmployee[emp].profit += (s.sale_price || 0) - (s.purchase_price || 0);
    });

    return Object.entries(byEmployee).map(([name, data]) => {
      const rule = rules.find(r => r.employee_name === name);
      let commission = 0;
      let bonus = 0;

      if (rule) {
        if (data.sales_count >= rule.min_sales) {
          commission = rule.rate_type === 'percentage'
            ? data.profit * (rule.rate_value / 100)
            : data.sales_count * rule.rate_value;
        }
        if (data.sales_total >= rule.bonus_threshold) {
          bonus = data.profit * (rule.bonus_rate / 100);
        }
      } else {
        // Default 2% commission
        commission = data.profit * 0.02;
      }

      return {
        name,
        ...data,
        commission: Math.round(commission),
        bonus: Math.round(bonus),
        total: Math.round(commission + bonus),
        hasRule: !!rule,
      };
    }).sort((a, b) => b.total - a.total);
  }, [sales, rules]);

  const totalCommissions = commissions.reduce((s, c) => s + c.total, 0);

  const saveRules = useMutation({
    mutationFn: async (newRules: CommissionRule[]) => {
      const { data: existing } = await supabase.from('app_settings')
        .select('id').eq('company_id', companyId!).eq('key', 'commission_rules').maybeSingle();
      if (existing) {
        await supabase.from('app_settings').update({ value: JSON.stringify(newRules) }).eq('id', existing.id);
      } else {
        await supabase.from('app_settings').insert({ company_id: companyId!, key: 'commission_rules', value: JSON.stringify(newRules) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('تم حفظ قواعد العمولات');
    },
  });

  const handleSave = () => {
    const newRule: CommissionRule = {
      id: editRule?.id || crypto.randomUUID(),
      employee_name: formEmployee,
      rate_type: formRateType,
      rate_value: formRateValue,
      min_sales: formMinSales,
      bonus_rate: formBonusRate,
      bonus_threshold: formBonusThreshold,
    };
    const updated = editRule ? rules.map(r => r.id === editRule.id ? newRule : r) : [...rules, newRule];
    saveRules.mutate(updated);
    setShowDialog(false);
    setEditRule(null);
  };

  const handleDelete = (id: string) => saveRules.mutate(rules.filter(r => r.id !== id));

  const rankIcon = (i: number) => i === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : i === 1 ? <Medal className="w-5 h-5 text-gray-400" /> : i === 2 ? <Award className="w-5 h-5 text-amber-600" /> : <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>;

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">نظام العمولات</h1>
            <p className="text-muted-foreground">حساب تلقائي لعمولات الموظفين بناءً على المبيعات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditRule(null); setFormEmployee(''); setShowDialog(true); }} className="gap-2"><Plus className="w-4 h-4" />إضافة قاعدة</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-500" />
          <p className="text-xl font-bold">{totalCommissions.toLocaleString('ar-SA')}</p>
          <p className="text-xs text-muted-foreground">إجمالي العمولات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
          <p className="text-xl font-bold">{commissions.length}</p>
          <p className="text-xs text-muted-foreground">موظفي مبيعات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-500" />
          <p className="text-xl font-bold">{sales.length}</p>
          <p className="text-xs text-muted-foreground">صفقات الفترة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Calculator className="w-6 h-6 mx-auto mb-1 text-orange-500" />
          <p className="text-xl font-bold">{rules.length}</p>
          <p className="text-xs text-muted-foreground">قواعد عمولات</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-2"><Crown className="w-4 h-4" />الترتيب</TabsTrigger>
          <TabsTrigger value="chart" className="gap-2"><TrendingUp className="w-4 h-4" />الرسم البياني</TabsTrigger>
          <TabsTrigger value="rules" className="gap-2"><Calculator className="w-4 h-4" />القواعد</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">ترتيب الموظفين حسب العمولات</CardTitle></CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد مبيعات في هذه الفترة</p>
              ) : (
                <div className="space-y-3">
                  {commissions.map((c, i) => (
                    <div key={c.name} className={`flex items-center gap-4 p-3 rounded-lg ${i < 3 ? 'bg-muted/50' : ''}`}>
                      <div className="w-8 h-8 flex items-center justify-center">{rankIcon(i)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.sales_count} صفقة • مبيعات: {c.sales_total.toLocaleString('ar-SA')}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-green-600">{c.commission.toLocaleString('ar-SA')} عمولة</p>
                        {c.bonus > 0 && <p className="text-xs text-orange-500">+{c.bonus.toLocaleString('ar-SA')} مكافأة</p>}
                      </div>
                      {!c.hasRule && <Badge variant="outline" className="text-[10px]">افتراضي 2%</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">العمولات والمكافآت</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={commissions.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tickFormatter={v => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(v: number) => v.toLocaleString('ar-SA')} />
                  <Bar dataKey="commission" fill="hsl(var(--primary))" name="عمولة" radius={[0,4,4,0]} />
                  <Bar dataKey="bonus" fill="hsl(var(--chart-2))" name="مكافأة" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">قواعد العمولات المخصصة</CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد قواعد مخصصة. يتم تطبيق عمولة افتراضية 2% من الربح.</p>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rule.employee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.rate_type === 'percentage' ? `${rule.rate_value}% من الربح` : `${rule.rate_value} ر.س لكل صفقة`}
                          {rule.min_sales > 0 && ` • حد أدنى ${rule.min_sales} صفقة`}
                          {rule.bonus_threshold > 0 && ` • مكافأة ${rule.bonus_rate}% عند تجاوز ${rule.bonus_threshold.toLocaleString()}`}
                        </p>
                      </div>
                      <button onClick={() => { setEditRule(rule); setFormEmployee(rule.employee_name); setFormRateType(rule.rate_type); setFormRateValue(rule.rate_value); setFormMinSales(rule.min_sales); setFormBonusRate(rule.bonus_rate); setFormBonusThreshold(rule.bonus_threshold); setShowDialog(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded hover:bg-muted"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editRule ? 'تعديل قاعدة العمولة' : 'إضافة قاعدة عمولة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الموظف *</Label><Input value={formEmployee} onChange={e => setFormEmployee(e.target.value)} /></div>
            <div>
              <Label>نوع العمولة</Label>
              <Select value={formRateType} onValueChange={(v: any) => setFormRateType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة من الربح</SelectItem>
                  <SelectItem value="fixed_per_sale">مبلغ ثابت لكل صفقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{formRateType === 'percentage' ? 'النسبة (%)' : 'المبلغ لكل صفقة'}</Label><Input type="number" value={formRateValue} onChange={e => setFormRateValue(Number(e.target.value))} /></div>
            <div><Label>حد أدنى صفقات (0 = بدون حد)</Label><Input type="number" value={formMinSales} onChange={e => setFormMinSales(Number(e.target.value))} /></div>
            <div><Label>نسبة المكافأة الإضافية (%)</Label><Input type="number" value={formBonusRate} onChange={e => setFormBonusRate(Number(e.target.value))} /></div>
            <div><Label>حد المكافأة (عند تجاوز مبيعات)</Label><Input type="number" value={formBonusThreshold} onChange={e => setFormBonusThreshold(Number(e.target.value))} /></div>
            <Button onClick={handleSave} disabled={!formEmployee} className="w-full">{editRule ? 'تحديث' : 'إضافة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
