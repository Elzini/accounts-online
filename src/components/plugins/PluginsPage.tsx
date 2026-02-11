import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Puzzle, Download, Settings, Star, Globe, Shield, Zap, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  version: string;
  author: string;
  category: 'accounting' | 'hr' | 'inventory' | 'reports' | 'integrations' | 'utilities';
  icon: string;
  installed: boolean;
  enabled: boolean;
  rating: number;
  downloads: number;
}

const AVAILABLE_PLUGINS: Plugin[] = [
  {
    id: 'zatca-phase2',
    name: 'الفوترة الإلكترونية ZATCA',
    name_en: 'ZATCA E-Invoicing',
    description: 'الامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك - المرحلة الثانية',
    description_en: 'Full compliance with ZATCA Phase 2 requirements',
    version: '2.1.0',
    author: 'Elzini',
    category: 'accounting',
    icon: '🧾',
    installed: true,
    enabled: true,
    rating: 4.9,
    downloads: 1250,
  },
  {
    id: 'advanced-hr',
    name: 'الموارد البشرية المتقدمة',
    name_en: 'Advanced HR',
    description: 'إدارة شاملة للموارد البشرية تشمل التأمينات والتقييم والتدريب',
    description_en: 'Comprehensive HR management with insurance, evaluation and training',
    version: '1.5.0',
    author: 'Elzini',
    category: 'hr',
    icon: '👥',
    installed: true,
    enabled: true,
    rating: 4.7,
    downloads: 890,
  },
  {
    id: 'multi-warehouse',
    name: 'المستودعات المتعددة',
    name_en: 'Multi-Warehouse',
    description: 'إدارة مخزون متعددة المواقع مع تتبع التحويلات والجرد',
    description_en: 'Multi-location inventory with transfer tracking and stocktake',
    version: '1.3.0',
    author: 'Elzini',
    category: 'inventory',
    icon: '🏭',
    installed: true,
    enabled: true,
    rating: 4.8,
    downloads: 720,
  },
  {
    id: 'bi-analytics',
    name: 'تحليلات الأعمال BI',
    name_en: 'Business Intelligence',
    description: 'لوحات تحليل متقدمة مع مخططات تفاعلية وتقارير ذكية',
    description_en: 'Advanced analytics dashboards with interactive charts and smart reports',
    version: '1.2.0',
    author: 'Elzini',
    category: 'reports',
    icon: '📊',
    installed: false,
    enabled: false,
    rating: 4.6,
    downloads: 560,
  },
  {
    id: 'pos-system',
    name: 'نقاط البيع POS',
    name_en: 'Point of Sale',
    description: 'نظام نقاط بيع متكامل مع دعم الباركود والطابعات الحرارية',
    description_en: 'Integrated POS system with barcode and thermal printer support',
    version: '1.0.0',
    author: 'Elzini',
    category: 'utilities',
    icon: '🖥️',
    installed: false,
    enabled: false,
    rating: 4.5,
    downloads: 340,
  },
  {
    id: 'whatsapp-integration',
    name: 'تكامل واتساب',
    name_en: 'WhatsApp Integration',
    description: 'إرسال الفواتير والتقارير عبر واتساب تلقائياً',
    description_en: 'Auto-send invoices and reports via WhatsApp',
    version: '1.1.0',
    author: 'Elzini Partners',
    category: 'integrations',
    icon: '💬',
    installed: false,
    enabled: false,
    rating: 4.4,
    downloads: 430,
  },
  {
    id: 'ifrs-compliance',
    name: 'معايير IFRS الدولية',
    name_en: 'IFRS Compliance',
    description: 'الامتثال لمعايير المحاسبة الدولية IFRS مع التقارير المطلوبة',
    description_en: 'International Financial Reporting Standards compliance',
    version: '1.0.0',
    author: 'Elzini',
    category: 'accounting',
    icon: '🌍',
    installed: false,
    enabled: false,
    rating: 4.3,
    downloads: 210,
  },
  {
    id: 'project-management',
    name: 'إدارة المشاريع المتقدمة',
    name_en: 'Advanced Project Management',
    description: 'إدارة المشاريع مع Gantt Charts وتتبع الموارد والتكاليف',
    description_en: 'Project management with Gantt Charts, resource and cost tracking',
    version: '1.4.0',
    author: 'Elzini',
    category: 'utilities',
    icon: '📋',
    installed: false,
    enabled: false,
    rating: 4.7,
    downloads: 380,
  },
];

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  accounting: { ar: 'المحاسبة', en: 'Accounting' },
  hr: { ar: 'الموارد البشرية', en: 'HR' },
  inventory: { ar: 'المخزون', en: 'Inventory' },
  reports: { ar: 'التقارير', en: 'Reports' },
  integrations: { ar: 'التكاملات', en: 'Integrations' },
  utilities: { ar: 'أدوات', en: 'Utilities' },
};

export function PluginsPage() {
  const [plugins, setPlugins] = useState(AVAILABLE_PLUGINS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const installedPlugins = plugins.filter(p => p.installed);
  const availablePlugins = plugins.filter(p => !p.installed);

  const filteredMarketplace = selectedCategory === 'all'
    ? availablePlugins
    : availablePlugins.filter(p => p.category === selectedCategory);

  const handleInstall = (pluginId: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, installed: true, enabled: true } : p
    ));
    toast.success('تم تثبيت الإضافة بنجاح');
  };

  const handleUninstall = (pluginId: string) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, installed: false, enabled: false } : p
    ));
    toast.success('تم إزالة الإضافة');
  };

  const handleToggle = (pluginId: string, enabled: boolean) => {
    setPlugins(prev => prev.map(p =>
      p.id === pluginId ? { ...p, enabled } : p
    ));
    toast.success(enabled ? 'تم تفعيل الإضافة' : 'تم تعطيل الإضافة');
  };

  const renderPluginCard = (plugin: Plugin) => (
    <Card key={plugin.id} className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{plugin.icon}</div>
            <div>
              <CardTitle className="text-base">{plugin.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{plugin.name_en}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v{plugin.version}</Badge>
            {plugin.installed && (
              <Switch
                checked={plugin.enabled}
                onCheckedChange={(checked) => handleToggle(plugin.id, checked)}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {plugin.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {plugin.downloads}
            </span>
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[plugin.category]?.ar}
            </Badge>
          </div>
          {!plugin.installed ? (
            <Button size="sm" onClick={() => handleInstall(plugin.id)}>
              <Download className="w-3 h-3 me-1" /> تثبيت
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUninstall(plugin.id)}
            >
              إزالة
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">الإضافات والتوسعات</h1>
          <p className="text-muted-foreground">تخصيص النظام بإضافات ووحدات جاهزة</p>
        </div>
        <div className="ms-auto flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Package className="w-3 h-3" />
            {installedPlugins.length} مثبتة
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            {installedPlugins.filter(p => p.enabled).length} نشطة
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList>
          <TabsTrigger value="installed" className="gap-2">
            <Settings className="w-4 h-4" /> المثبتة ({installedPlugins.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Globe className="w-4 h-4" /> المتجر ({availablePlugins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          {installedPlugins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لم يتم تثبيت أي إضافات بعد</p>
                <p className="text-sm text-muted-foreground mt-1">تصفح المتجر لاكتشاف الإضافات المتاحة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {installedPlugins.map(renderPluginCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          {/* Category filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              الكل
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {label.ar}
              </Button>
            ))}
          </div>
          {filteredMarketplace.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد إضافات متاحة في هذا التصنيف</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMarketplace.map(renderPluginCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
