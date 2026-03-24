/**
 * Dashboard Config Tab - Refactored
 * Constants extracted to dashboard-config/configConstants.ts
 */
import { useState, useEffect } from 'react';
import { LayoutGrid, Save, Plus, Trash2, GripVertical, Eye, EyeOff, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { toast } from 'sonner';
import {
  STAT_CARD_TYPES, ANALYTICS_COMPONENTS,
  StatCardConfig, AnalyticsConfig, LayoutConfig,
  DEFAULT_STAT_CARDS, DEFAULT_ANALYTICS, DEFAULT_LAYOUT,
} from './dashboard-config/configConstants';

export function DashboardConfigTab() {
  const { data: config, isLoading } = useDashboardConfig();
  const saveConfig = useSaveDashboardConfig();

  const [statCards, setStatCards] = useState<StatCardConfig[]>(DEFAULT_STAT_CARDS);
  const [analytics, setAnalytics] = useState<AnalyticsConfig[]>(DEFAULT_ANALYTICS);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      if (config.stat_cards && config.stat_cards.length > 0) setStatCards(config.stat_cards as StatCardConfig[]);
      if (config.analytics_settings && Object.keys(config.analytics_settings).length > 0) setAnalytics((config.analytics_settings as any).components || DEFAULT_ANALYTICS);
      if (config.layout_settings && Object.keys(config.layout_settings).length > 0) setLayout({ ...DEFAULT_LAYOUT, ...(config.layout_settings as LayoutConfig) });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({ stat_cards: statCards, analytics_settings: { components: analytics }, layout_settings: layout });
      toast.success('تم حفظ إعدادات لوحة التحكم'); setHasChanges(false);
    } catch (error) { toast.error('حدث خطأ أثناء الحفظ'); }
  };

  const addStatCard = () => {
    setStatCards([...statCards, { id: Date.now().toString(), type: 'available_cars', label: 'بطاقة جديدة', visible: true, order: statCards.length, size: 'medium' }]);
    setHasChanges(true);
  };

  const updateStatCard = (id: string, updates: Partial<StatCardConfig>) => { setStatCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); setHasChanges(true); };
  const removeStatCard = (id: string) => { setStatCards(prev => prev.filter(c => c.id !== id)); setHasChanges(true); };
  const updateAnalytics = (componentId: string, updates: Partial<AnalyticsConfig>) => { setAnalytics(prev => prev.map(c => c.componentId === componentId ? { ...c, ...updates } : c)); setHasChanges(true); };
  const updateLayout = (updates: Partial<LayoutConfig>) => { setLayout(prev => ({ ...prev, ...updates })); setHasChanges(true); };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-primary" />
              <div><CardTitle>إعدادات لوحة التحكم</CardTitle><CardDescription>تخصيص بطاقات الإحصائيات والتحليلات وتخطيط الصفحة</CardDescription></div>
            </div>
            {hasChanges && <Button onClick={handleSave} disabled={saveConfig.isPending}><Save className="w-4 h-4 ml-2" />حفظ التغييرات</Button>}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="cards">بطاقات الإحصائيات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="layout">التخطيط</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">بطاقات الإحصائيات</CardTitle>
                <Button onClick={addStatCard} size="sm"><Plus className="w-4 h-4 ml-2" />إضافة بطاقة</Button>
              </div>
              <CardDescription>أضف وعدّل البطاقات التي تظهر في لوحة التحكم الرئيسية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statCards.map((card) => (
                  <div key={card.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="space-y-1"><Label className="text-xs">نوع البطاقة</Label>
                        <Select value={card.type} onValueChange={(v) => { const ct = STAT_CARD_TYPES.find(t => t.id === v); updateStatCard(card.id, { type: v, label: ct?.label || card.label }); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{STAT_CARD_TYPES.map((type) => (<SelectItem key={type.id} value={type.id}><span className="flex items-center gap-2"><span>{type.icon}</span><span>{type.label}</span></span></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">العنوان المخصص</Label><Input value={card.label} onChange={(e) => updateStatCard(card.id, { label: e.target.value })} className="h-9" /></div>
                      <div className="space-y-1"><Label className="text-xs">الحجم</Label>
                        <Select value={card.size} onValueChange={(v: 'small' | 'medium' | 'large') => updateStatCard(card.id, { size: v })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="small">صغير</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="large">كبير</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">العرض (px)</Label><Input type="number" value={card.width || 0} onChange={(e) => updateStatCard(card.id, { width: Number(e.target.value) || 0 })} className="h-9" min={0} max={600} step={10} /></div>
                      <div className="space-y-1"><Label className="text-xs">الارتفاع (px)</Label><Input type="number" value={card.height || 160} onChange={(e) => updateStatCard(card.id, { height: Number(e.target.value) })} className="h-9" min={100} max={400} step={10} /></div>
                      <div className="flex items-center gap-2"><Switch checked={card.visible} onCheckedChange={(c) => updateStatCard(card.id, { visible: c })} /><Label className="text-xs">{card.visible ? 'ظاهرة' : 'مخفية'}</Label></div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeStatCard(card.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                {statCards.length === 0 && <div className="text-center py-8 text-muted-foreground">لا توجد بطاقات. اضغط على "إضافة بطاقة" لإنشاء بطاقة جديدة.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">مكونات التحليلات</CardTitle><CardDescription>اختر المكونات التي تظهر في تبويب التحليلات المتقدمة</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ANALYTICS_COMPONENTS.map((component) => {
                  const conf = analytics.find(a => a.componentId === component.id);
                  const isVisible = conf?.visible ?? true;
                  const size = conf?.size ?? 'half';
                  return (
                    <div key={component.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="font-medium">{component.label}</span><Badge variant="outline" className="text-xs">{size === 'full' ? 'عرض كامل' : 'نصف العرض'}</Badge></div>
                        <p className="text-sm text-muted-foreground mt-1">{component.description}</p>
                      </div>
                      <Select value={size} onValueChange={(v: 'half' | 'full') => updateAnalytics(component.id, { componentId: component.id, visible: isVisible, order: conf?.order ?? 0, size: v })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="half">نصف العرض</SelectItem><SelectItem value="full">عرض كامل</SelectItem></SelectContent>
                      </Select>
                      <Switch checked={isVisible} onCheckedChange={(c) => updateAnalytics(component.id, { componentId: component.id, visible: c, order: conf?.order ?? 0, size })} />
                      <span className="text-sm w-16">{isVisible ? 'ظاهر' : 'مخفي'}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">إعدادات التخطيط</CardTitle><CardDescription>التحكم في شكل وترتيب لوحة التحكم</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>عدد البطاقات في الصف</Label><Badge variant="secondary">{layout.cardsPerRow}</Badge></div>
                  <Slider value={[layout.cardsPerRow]} onValueChange={(v) => updateLayout({ cardsPerRow: v[0] })} min={2} max={4} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>2</span><span>3</span><span>4</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>المسافة بين البطاقات</Label><Badge variant="secondary">{layout.cardSpacing}</Badge></div>
                  <Slider value={[layout.cardSpacing]} onValueChange={(v) => updateLayout({ cardSpacing: v[0] })} min={2} max={8} step={1} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">إظهار التبويبات</h4>
                  <div className="flex items-center justify-between"><div><Label>تبويب نظرة عامة</Label><p className="text-sm text-muted-foreground">البطاقات والإحصائيات الأساسية</p></div><Switch checked={layout.showOverviewTab} onCheckedChange={(c) => updateLayout({ showOverviewTab: c })} /></div>
                  <div className="flex items-center justify-between"><div><Label>تبويب التحليلات المتقدمة</Label><p className="text-sm text-muted-foreground">الرسوم البيانية والتحليلات</p></div><Switch checked={layout.showAnalyticsTab} onCheckedChange={(c) => updateLayout({ showAnalyticsTab: c })} /></div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <Label>التبويب الافتراضي</Label>
                  <Select value={layout.defaultTab} onValueChange={(v: 'overview' | 'analytics') => updateLayout({ defaultTab: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="overview">نظرة عامة</SelectItem><SelectItem value="analytics">التحليلات المتقدمة</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
