import { useState, useEffect } from 'react';
import { PanelLeft, Save, GripVertical, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useMenuConfiguration, useSaveMenuConfiguration } from '@/hooks/useSystemControl';
import { MenuItem } from '@/services/systemControl';
import { toast } from 'sonner';

// Default menu structure
const DEFAULT_MENU: MenuItem[] = [
  { id: 'main', label: 'القائمة الرئيسية', visible: true, order: 0, isCollapsible: false, children: [
    { id: 'dashboard', label: 'الرئيسية', visible: true, order: 0, path: 'dashboard' },
    { id: 'customers', label: 'العملاء', visible: true, order: 1, path: 'customers' },
    { id: 'suppliers', label: 'الموردين', visible: true, order: 2, path: 'suppliers' },
    { id: 'purchases', label: 'المشتريات', visible: true, order: 3, path: 'purchases' },
    { id: 'sales', label: 'المبيعات', visible: true, order: 4, path: 'sales' },
  ]},
  { id: 'transfers', label: 'التحويلات', visible: true, order: 1, isCollapsible: true, children: [
    { id: 'partner-dealerships', label: 'المعارض الشريكة', visible: true, order: 0, path: 'partner-dealerships' },
    { id: 'car-transfers', label: 'تحويلات السيارات', visible: true, order: 1, path: 'car-transfers' },
  ]},
  { id: 'finance', label: 'المالية', visible: true, order: 2, isCollapsible: true, children: [
    { id: 'employees', label: 'الموظفين', visible: true, order: 0, path: 'employees' },
    { id: 'payroll', label: 'مسير الرواتب', visible: true, order: 1, path: 'payroll' },
    { id: 'expenses', label: 'المصروفات', visible: true, order: 2, path: 'expenses' },
    { id: 'vouchers', label: 'سندات القبض والصرف', visible: true, order: 3, path: 'vouchers' },
  ]},
  { id: 'reports', label: 'التقارير', visible: true, order: 3, isCollapsible: true, children: [
    { id: 'inventory-report', label: 'تقرير المخزون', visible: true, order: 0, path: 'inventory-report' },
    { id: 'profit-report', label: 'تقرير الأرباح', visible: true, order: 1, path: 'profit-report' },
    { id: 'sales-report', label: 'تقرير المبيعات', visible: true, order: 2, path: 'sales-report' },
  ]},
  { id: 'accounting', label: 'المحاسبة', visible: true, order: 4, isCollapsible: true, children: [
    { id: 'chart-of-accounts', label: 'شجرة الحسابات', visible: true, order: 0, path: 'chart-of-accounts' },
    { id: 'journal-entries', label: 'دفتر اليومية', visible: true, order: 1, path: 'journal-entries' },
    { id: 'general-ledger', label: 'دفتر الأستاذ', visible: true, order: 2, path: 'general-ledger' },
  ]},
  { id: 'admin', label: 'الإدارة', visible: true, order: 5, isCollapsible: true, children: [
    { id: 'users-management', label: 'إدارة المستخدمين', visible: true, order: 0, path: 'users-management' },
    { id: 'app-settings', label: 'إعدادات النظام', visible: true, order: 1, path: 'app-settings' },
  ]},
];

export function MenuConfigurationTab() {
  const { data: config, isLoading } = useMenuConfiguration();
  const saveConfig = useSaveMenuConfiguration();

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config?.menu_items && config.menu_items.length > 0) {
      setMenuItems(config.menu_items);
    }
  }, [config]);

  const handleItemUpdate = (sectionId: string, itemId: string | null, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(section => {
      if (section.id === sectionId) {
        if (!itemId) {
          return { ...section, ...updates };
        }
        return {
          ...section,
          children: section.children?.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }
      return section;
    }));
    setHasChanges(true);
  };

  const handleAddItem = (sectionId: string) => {
    const newId = `custom-${Date.now()}`;
    setMenuItems(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newOrder = (section.children?.length || 0);
        return {
          ...section,
          children: [...(section.children || []), {
            id: newId,
            label: 'عنصر جديد',
            visible: true,
            order: newOrder,
            path: newId,
          }],
        };
      }
      return section;
    }));
    setHasChanges(true);
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    setMenuItems(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          children: section.children?.filter(item => item.id !== itemId),
        };
      }
      return section;
    }));
    setHasChanges(true);
  };

  const handleAddSection = () => {
    const newId = `section-${Date.now()}`;
    setMenuItems(prev => [...prev, {
      id: newId,
      label: 'قسم جديد',
      visible: true,
      order: prev.length,
      isCollapsible: true,
      children: [],
    }]);
    setHasChanges(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    setMenuItems(prev => prev.filter(s => s.id !== sectionId));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({ menu_items: menuItems });
      toast.success('تم حفظ إعدادات القائمة');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving menu config:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PanelLeft className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>إعدادات القائمة الجانبية</CardTitle>
              <CardDescription>
                تخصيص عناصر القائمة وترتيبها وإظهارها/إخفائها
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
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={handleAddSection}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة قسم جديد
            </Button>
          </div>
          <Accordion type="multiple" defaultValue={menuItems.map(m => m.id)} className="w-full">
            {menuItems.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={section.label}
                        onChange={(e) => handleItemUpdate(section.id, null, { label: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-40"
                      />
                      <Badge variant={section.visible ? 'default' : 'secondary'}>
                        {section.visible ? 'ظاهر' : 'مخفي'}
                      </Badge>
                      {section.isCollapsible && (
                        <Badge variant="outline">قابل للطي</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={section.visible}
                        onCheckedChange={(checked) => handleItemUpdate(section.id, null, { visible: checked })}
                      />
                      <Switch
                        checked={section.isCollapsible || false}
                        onCheckedChange={(checked) => handleItemUpdate(section.id, null, { isCollapsible: checked })}
                      />
                      <Label className="text-xs">قابل للطي</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pr-8">
                    {section.children?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <Input
                          value={item.label}
                          onChange={(e) => handleItemUpdate(section.id, item.id, { label: e.target.value })}
                          className="h-8 flex-1"
                        />
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.path}
                        </Badge>
                        <Switch
                          checked={item.visible}
                          onCheckedChange={(checked) => handleItemUpdate(section.id, item.id, { visible: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleItemUpdate(section.id, item.id, { visible: !item.visible })}
                        >
                          {item.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(section.id, item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleAddItem(section.id)}
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة عنصر
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
