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

// Available stat card types
const STAT_CARD_TYPES = [
  { id: 'available_cars', label: 'السيارات المتاحة', icon: '🚗', category: 'inventory' },
  { id: 'total_purchases', label: 'إجمالي المشتريات', icon: '🛒', category: 'purchases' },
  { id: 'month_sales', label: 'مبيعات الشهر', icon: '📈', category: 'sales' },
  { id: 'total_profit', label: 'إجمالي الأرباح', icon: '💰', category: 'profit' },
  { id: 'today_sales', label: 'مبيعات اليوم', icon: '📊', category: 'sales' },
  { id: 'month_sales_count', label: 'عدد مبيعات الشهر', icon: '🔢', category: 'sales' },
  { id: 'year_sales', label: 'مبيعات السنة', icon: '📅', category: 'sales' },
  { id: 'year_purchases', label: 'مشتريات السنة', icon: '📦', category: 'purchases' },
  { id: 'month_purchases', label: 'مشتريات الشهر', icon: '🛍️', category: 'purchases' },
  { id: 'gross_profit', label: 'إجمالي الربح الخام', icon: '💵', category: 'profit' },
  { id: 'net_profit', label: 'صافي الربح', icon: '💎', category: 'profit' },
  { id: 'total_expenses', label: 'إجمالي المصروفات', icon: '💸', category: 'expenses' },
  { id: 'month_expenses', label: 'مصروفات الشهر', icon: '📉', category: 'expenses' },
  { id: 'active_installments', label: 'عقود التقسيط النشطة', icon: '📋', category: 'installments' },
  { id: 'overdue_installments', label: 'الأقساط المتأخرة', icon: '⚠️', category: 'installments' },
  { id: 'current_month_installments', label: 'أقساط الشهر الحالي', icon: '💳', category: 'installments' },
  { id: 'total_receivables', label: 'إجمالي المستحق', icon: '💲', category: 'installments' },
  { id: 'customers_count', label: 'عدد العملاء', icon: '👥', category: 'customers' },
  { id: 'suppliers_count', label: 'عدد الموردين', icon: '🚚', category: 'suppliers' },
  { id: 'incoming_transfers', label: 'التحويلات الواردة', icon: '⬇️', category: 'transfers' },
  { id: 'outgoing_transfers', label: 'التحويلات الصادرة', icon: '⬆️', category: 'transfers' },
  { id: 'all_time_purchases', label: 'إجمالي مشتريات الشركة (كل السنين)', icon: '🏢', category: 'all_time' },
  { id: 'all_time_sales', label: 'إجمالي مبيعات الشركة (كل السنين)', icon: '🌐', category: 'all_time' },
];

// Analytics components available
const ANALYTICS_COMPONENTS = [
  { id: 'sales_chart', label: 'رسم المبيعات البياني', description: 'رسم بياني شهري للمبيعات' },
  { id: 'profit_chart', label: 'رسم الأرباح البياني', description: 'رسم بياني شهري للأرباح' },
  { id: 'inventory_pie', label: 'توزيع المخزون', description: 'رسم دائري لحالة السيارات' },
  { id: 'revenue_area', label: 'منحنى الإيرادات', description: 'رسم المساحة للإيرادات والتكاليف' },
  { id: 'top_customers', label: 'أفضل العملاء', description: 'قائمة بأفضل العملاء' },
  { id: 'top_cars', label: 'أفضل السيارات مبيعاً', description: 'أكثر السيارات مبيعاً' },
  { id: 'performance_kpis', label: 'مؤشرات الأداء', description: 'مؤشرات KPI رئيسية' },
  { id: 'recent_activity', label: 'النشاط الأخير', description: 'آخر العمليات' },
  { id: 'trend_cards', label: 'بطاقات الاتجاه', description: 'بطاقات تحليل الاتجاهات' },
];

interface StatCardConfig {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
  color?: string;
}

interface AnalyticsConfig {
  componentId: string;
  visible: boolean;
  order: number;
  size: 'half' | 'full';
}

interface LayoutConfig {
  cardsPerRow: number;
  cardSpacing: number;
  showOverviewTab: boolean;
  showAnalyticsTab: boolean;
  defaultTab: 'overview' | 'analytics';
}

const DEFAULT_STAT_CARDS: StatCardConfig[] = [
  { id: '1', type: 'available_cars', label: 'السيارات المتاحة', visible: true, order: 0, size: 'medium' },
  { id: '2', type: 'total_purchases', label: 'إجمالي المشتريات', visible: true, order: 1, size: 'medium' },
  { id: '3', type: 'month_sales', label: 'مبيعات الشهر', visible: true, order: 2, size: 'medium' },
  { id: '4', type: 'total_profit', label: 'إجمالي الأرباح', visible: true, order: 3, size: 'medium' },
  { id: '5', type: 'today_sales', label: 'مبيعات اليوم', visible: true, order: 4, size: 'medium' },
  { id: '6', type: 'month_sales_count', label: 'عدد مبيعات الشهر', visible: true, order: 5, size: 'medium' },
];

const DEFAULT_ANALYTICS: AnalyticsConfig[] = [
  { componentId: 'trend_cards', visible: true, order: 0, size: 'full' },
  { componentId: 'inventory_pie', visible: true, order: 1, size: 'half' },
  { componentId: 'revenue_area', visible: true, order: 2, size: 'half' },
  { componentId: 'top_customers', visible: true, order: 3, size: 'half' },
  { componentId: 'performance_kpis', visible: true, order: 4, size: 'half' },
  { componentId: 'recent_activity', visible: true, order: 5, size: 'full' },
];

const DEFAULT_LAYOUT: LayoutConfig = {
  cardsPerRow: 3,
  cardSpacing: 4,
  showOverviewTab: true,
  showAnalyticsTab: true,
  defaultTab: 'overview',
};

export function DashboardConfigTab() {
  const { data: config, isLoading } = useDashboardConfig();
  const saveConfig = useSaveDashboardConfig();

  const [statCards, setStatCards] = useState<StatCardConfig[]>(DEFAULT_STAT_CARDS);
  const [analytics, setAnalytics] = useState<AnalyticsConfig[]>(DEFAULT_ANALYTICS);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      if (config.stat_cards && config.stat_cards.length > 0) {
        setStatCards(config.stat_cards as StatCardConfig[]);
      }
      if (config.analytics_settings && Object.keys(config.analytics_settings).length > 0) {
        setAnalytics((config.analytics_settings as any).components || DEFAULT_ANALYTICS);
      }
      if (config.layout_settings && Object.keys(config.layout_settings).length > 0) {
        setLayout({ ...DEFAULT_LAYOUT, ...(config.layout_settings as LayoutConfig) });
      }
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        stat_cards: statCards,
        analytics_settings: { components: analytics },
        layout_settings: layout,
      });
      toast.success('تم حفظ إعدادات لوحة التحكم');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const addStatCard = () => {
    const newCard: StatCardConfig = {
      id: Date.now().toString(),
      type: 'available_cars',
      label: 'بطاقة جديدة',
      visible: true,
      order: statCards.length,
      size: 'medium',
    };
    setStatCards([...statCards, newCard]);
    setHasChanges(true);
  };

  const updateStatCard = (id: string, updates: Partial<StatCardConfig>) => {
    setStatCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
    setHasChanges(true);
  };

  const removeStatCard = (id: string) => {
    setStatCards(prev => prev.filter(card => card.id !== id));
    setHasChanges(true);
  };

  const updateAnalytics = (componentId: string, updates: Partial<AnalyticsConfig>) => {
    setAnalytics(prev => prev.map(comp => 
      comp.componentId === componentId ? { ...comp, ...updates } : comp
    ));
    setHasChanges(true);
  };

  const updateLayout = (updates: Partial<LayoutConfig>) => {
    setLayout(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>إعدادات لوحة التحكم</CardTitle>
                <CardDescription>
                  تخصيص بطاقات الإحصائيات والتحليلات وتخطيط الصفحة
                </CardDescription>
              </div>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saveConfig.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="cards">بطاقات الإحصائيات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="layout">التخطيط</TabsTrigger>
        </TabsList>

        {/* Stat Cards Tab */}
        <TabsContent value="cards" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">بطاقات الإحصائيات</CardTitle>
                <Button onClick={addStatCard} size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة بطاقة
                </Button>
              </div>
              <CardDescription>
                أضف وعدّل البطاقات التي تظهر في لوحة التحكم الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border"
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Card Type */}
                      <div className="space-y-1">
                        <Label className="text-xs">نوع البطاقة</Label>
                        <Select
                          value={card.type}
                          onValueChange={(value) => {
                            const cardType = STAT_CARD_TYPES.find(t => t.id === value);
                            updateStatCard(card.id, { 
                              type: value,
                              label: cardType?.label || card.label 
                            });
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAT_CARD_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <span className="flex items-center gap-2">
                                  <span>{type.icon}</span>
                                  <span>{type.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom Label */}
                      <div className="space-y-1">
                        <Label className="text-xs">العنوان المخصص</Label>
                        <Input
                          value={card.label}
                          onChange={(e) => updateStatCard(card.id, { label: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      {/* Size */}
                      <div className="space-y-1">
                        <Label className="text-xs">الحجم</Label>
                        <Select
                          value={card.size}
                          onValueChange={(value: 'small' | 'medium' | 'large') => 
                            updateStatCard(card.id, { size: value })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">صغير</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="large">كبير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Visibility */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={card.visible}
                          onCheckedChange={(checked) => updateStatCard(card.id, { visible: checked })}
                        />
                        <Label className="text-xs">
                          {card.visible ? 'ظاهرة' : 'مخفية'}
                        </Label>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStatCard(card.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {statCards.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بطاقات. اضغط على "إضافة بطاقة" لإنشاء بطاقة جديدة.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مكونات التحليلات</CardTitle>
              <CardDescription>
                اختر المكونات التي تظهر في تبويب التحليلات المتقدمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ANALYTICS_COMPONENTS.map((component) => {
                  const config = analytics.find(a => a.componentId === component.id);
                  const isVisible = config?.visible ?? true;
                  const size = config?.size ?? 'half';

                  return (
                    <div
                      key={component.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{component.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {size === 'full' ? 'عرض كامل' : 'نصف العرض'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {component.description}
                        </p>
                      </div>

                      <Select
                        value={size}
                        onValueChange={(value: 'half' | 'full') => 
                          updateAnalytics(component.id, { 
                            componentId: component.id,
                            visible: isVisible,
                            order: config?.order ?? 0,
                            size: value 
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="half">نصف العرض</SelectItem>
                          <SelectItem value="full">عرض كامل</SelectItem>
                        </SelectContent>
                      </Select>

                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) => 
                          updateAnalytics(component.id, { 
                            componentId: component.id,
                            visible: checked,
                            order: config?.order ?? 0,
                            size
                          })
                        }
                      />
                      <span className="text-sm w-16">
                        {isVisible ? 'ظاهر' : 'مخفي'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات التخطيط</CardTitle>
              <CardDescription>
                التحكم في شكل وترتيب لوحة التحكم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cards per row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>عدد البطاقات في الصف</Label>
                    <Badge variant="secondary">{layout.cardsPerRow}</Badge>
                  </div>
                  <Slider
                    value={[layout.cardsPerRow]}
                    onValueChange={(value) => updateLayout({ cardsPerRow: value[0] })}
                    min={2}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>

                {/* Card spacing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>المسافة بين البطاقات</Label>
                    <Badge variant="secondary">{layout.cardSpacing}</Badge>
                  </div>
                  <Slider
                    value={[layout.cardSpacing]}
                    onValueChange={(value) => updateLayout({ cardSpacing: value[0] })}
                    min={2}
                    max={8}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Tab visibility */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">إظهار التبويبات</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تبويب نظرة عامة</Label>
                      <p className="text-sm text-muted-foreground">البطاقات والإحصائيات الأساسية</p>
                    </div>
                    <Switch
                      checked={layout.showOverviewTab}
                      onCheckedChange={(checked) => updateLayout({ showOverviewTab: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تبويب التحليلات المتقدمة</Label>
                      <p className="text-sm text-muted-foreground">الرسوم البيانية والتحليلات</p>
                    </div>
                    <Switch
                      checked={layout.showAnalyticsTab}
                      onCheckedChange={(checked) => updateLayout({ showAnalyticsTab: checked })}
                    />
                  </div>
                </div>

                {/* Default tab */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>التبويب الافتراضي</Label>
                  <Select
                    value={layout.defaultTab}
                    onValueChange={(value: 'overview' | 'analytics') => 
                      updateLayout({ defaultTab: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">نظرة عامة</SelectItem>
                      <SelectItem value="analytics">التحليلات المتقدمة</SelectItem>
                    </SelectContent>
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
