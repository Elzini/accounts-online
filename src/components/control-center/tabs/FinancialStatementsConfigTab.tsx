import { useState } from 'react';
import { GitBranch, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFinancialStatementConfig, useSaveFinancialStatementConfig } from '@/hooks/useSystemControl';
import { STATEMENT_TYPES, FinancialStatementSection } from '@/services/systemControl';
import { toast } from 'sonner';

export function FinancialStatementsConfigTab() {
  const [selectedType, setSelectedType] = useState('balance_sheet');
  const { data: config, isLoading } = useFinancialStatementConfig(selectedType);
  const saveConfig = useSaveFinancialStatementConfig();

  const [sections, setSections] = useState<FinancialStatementSection[]>([]);
  const [displayOptions, setDisplayOptions] = useState({
    showSubtotals: true,
    showPercentages: false,
    comparePeriods: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when config loads
  useState(() => {
    if (config) {
      setSections(config.sections);
      setDisplayOptions(config.display_options as typeof displayOptions);
    }
  });

  const handleAddSection = () => {
    const newSection: FinancialStatementSection = {
      name: 'قسم جديد',
      accountCodes: [],
      type: 'asset',
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setHasChanges(true);
  };

  const handleUpdateSection = (index: number, updates: Partial<FinancialStatementSection>) => {
    setSections(prev => prev.map((section, i) => 
      i === index ? { ...section, ...updates } : section
    ));
    setHasChanges(true);
  };

  const handleDeleteSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        statement_type: selectedType,
        sections,
        display_options: displayOptions,
      });
      toast.success('تم حفظ إعدادات القائمة المالية');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>إعدادات القوائم المالية</CardTitle>
              <CardDescription>
                تخصيص أقسام وعناصر كل قائمة مالية
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
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
            {STATEMENT_TYPES.map((type) => (
              <TabsTrigger key={type.type} value={type.type}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {STATEMENT_TYPES.map((type) => (
            <TabsContent key={type.type} value={type.type}>
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Display Options */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={displayOptions.showSubtotals}
                        onCheckedChange={(checked) => {
                          setDisplayOptions(prev => ({ ...prev, showSubtotals: checked }));
                          setHasChanges(true);
                        }}
                      />
                      <Label>عرض المجاميع الفرعية</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={displayOptions.showPercentages}
                        onCheckedChange={(checked) => {
                          setDisplayOptions(prev => ({ ...prev, showPercentages: checked }));
                          setHasChanges(true);
                        }}
                      />
                      <Label>عرض النسب المئوية</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={displayOptions.comparePeriods}
                        onCheckedChange={(checked) => {
                          setDisplayOptions(prev => ({ ...prev, comparePeriods: checked }));
                          setHasChanges(true);
                        }}
                      />
                      <Label>مقارنة الفترات</Label>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg">الأقسام</Label>
                      <Button variant="outline" size="sm" onClick={handleAddSection}>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة قسم
                      </Button>
                    </div>

                    {sections.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>لا توجد أقسام مخصصة</p>
                        <p className="text-sm">النظام يستخدم الإعدادات الافتراضية</p>
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {sections.map((section, index) => (
                          <AccordionItem key={index} value={`section-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-4 flex-1">
                                <span className="font-medium">{section.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({section.accountCodes.length} حسابات)
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                                <div className="space-y-2">
                                  <Label>اسم القسم</Label>
                                  <Input
                                    value={section.name}
                                    onChange={(e) => handleUpdateSection(index, { name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>النوع</Label>
                                  <Select
                                    value={section.type}
                                    onValueChange={(value: any) => handleUpdateSection(index, { type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="asset">أصول</SelectItem>
                                      <SelectItem value="liability">التزامات</SelectItem>
                                      <SelectItem value="equity">حقوق الملكية</SelectItem>
                                      <SelectItem value="revenue">إيرادات</SelectItem>
                                      <SelectItem value="expense">مصروفات</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                  <Label>أكواد الحسابات (مفصولة بفاصلة)</Label>
                                  <Input
                                    value={section.accountCodes.join(', ')}
                                    onChange={(e) => handleUpdateSection(index, { 
                                      accountCodes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="مثال: 1101, 1102, 1103"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteSection(index)}
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف القسم
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
