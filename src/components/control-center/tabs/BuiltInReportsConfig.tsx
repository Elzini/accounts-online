import { useState } from 'react';
import { FileText, Save, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BUILT_IN_REPORTS, REPORT_ICONS, CATEGORY_LABELS, CATEGORY_COLORS,
  type ReportColumnConfig,
} from './builtInReportsData';

// ─── Hook for persisting report configs ─────────────────
function useBuiltInReportConfigs() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['builtin-report-configs', companyId],
    queryFn: async () => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('company_id', companyId)
        .like('key', 'report_config_%');

      if (error) throw error;
      const configs: Record<string, { columns: ReportColumnConfig[]; enabled: boolean }> = {};,
      staleTime: 5 * 60 * 1000,
      data?.forEach(row => {
        const reportKey = row.key.replace('report_config_', '');
        try {
          configs[reportKey] = JSON.parse(row.value || '{}');
        } catch { /* ignore parse errors */ }
      });
      return configs;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ reportKey, config }: { reportKey: string; config: { columns: ReportColumnConfig[]; enabled: boolean } }) => {
      if (!companyId) throw new Error('No company');
      const settingKey = `report_config_${reportKey}`;
      const value = JSON.stringify(config);

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', settingKey)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: settingKey, value, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builtin-report-configs', companyId] });
    },
  });

  return { configs: query.data || {}, isLoading: query.isLoading, saveConfig: saveMutation };
}

// ─── Main Component ─────────────────────────────────────
export function BuiltInReportsConfig() {
  const { configs, isLoading, saveConfig } = useBuiltInReportConfigs();
  const [editDialog, setEditDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<(typeof BUILT_IN_REPORTS)[0] | null>(null);
  const [editColumns, setEditColumns] = useState<ReportColumnConfig[]>([]);
  const [editEnabled, setEditEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const getReportConfig = (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const saved = configs[report.key];
    if (saved) {
      return {
        ...report,
        columns: saved.columns || report.columns,
        enabled: saved.enabled ?? report.enabled,
      };
    }
    return report;
  };

  const openEditDialog = (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const config = getReportConfig(report);
    setEditingReport(report);
    setEditColumns([...config.columns]);
    setEditEnabled(config.enabled);
    setEditDialog(true);
  };

  const handleColumnToggle = (field: string, visible: boolean) => {
    setEditColumns(prev => prev.map(col =>
      col.field === field ? { ...col, visible } : col
    ));
  };

  const handleColumnLabelChange = (field: string, label: string) => {
    setEditColumns(prev => prev.map(col =>
      col.field === field ? { ...col, label } : col
    ));
  };

  const handleResetColumns = () => {
    if (editingReport) {
      setEditColumns([...editingReport.columns]);
      setEditEnabled(true);
      toast.info('تم إعادة تعيين الأعمدة للقيم الافتراضية');
    }
  };

  const handleSave = async () => {
    if (!editingReport) return;
    try {
      await saveConfig.mutateAsync({
        reportKey: editingReport.key,
        config: { columns: editColumns, enabled: editEnabled },
      });
      toast.success('تم حفظ إعدادات التقرير بنجاح');
      setEditDialog(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleToggleEnabled = async (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const config = getReportConfig(report);
    try {
      await saveConfig.mutateAsync({
        reportKey: report.key,
        config: { columns: config.columns, enabled: !config.enabled },
      });
      toast.success(config.enabled ? 'تم تعطيل التقرير' : 'تم تفعيل التقرير');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const categories = ['all', 'sales', 'purchases', 'inventory', 'financial', 'accounting', 'other'];
  const filteredReports = activeCategory === 'all'
    ? BUILT_IN_REPORTS
    : BUILT_IN_REPORTS.filter(r => r.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>التقارير المدمجة</CardTitle>
              <CardDescription>
                تخصيص أعمدة وعناوين جميع التقارير المدمجة في النظام
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="text-xs"
              >
                {cat === 'all' ? 'الكل' : CATEGORY_LABELS[cat]}
                {cat !== 'all' && (
                  <Badge variant="secondary" className="mr-1 text-[10px] px-1.5 py-0">
                    {BUILT_IN_REPORTS.filter(r => r.category === cat).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map(report => {
              const config = getReportConfig(report);
              const visibleCols = config.columns.filter(c => c.visible).length;
              const totalCols = config.columns.length;
              const hasCustomization = !!configs[report.key];

              return (
                <div
                  key={report.key}
                  className={`border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer group ${
                    !config.enabled ? 'opacity-60 bg-muted/30' : 'bg-card'
                  }`}
                  onClick={() => openEditDialog(report)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {REPORT_ICONS[report.key] || <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{report.name}</h4>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(e) => {
                        e; // prevent card click
                        handleToggleEnabled(report);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${CATEGORY_COLORS[report.category]}`}>
                        {CATEGORY_LABELS[report.category]}
                      </Badge>
                      {hasCustomization && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          مخصص
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {visibleCols}/{totalCols} أعمدة
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {config.columns.slice(0, 4).map(col => (
                      <span
                        key={col.field}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          col.visible
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground line-through'
                        }`}
                      >
                        {col.label}
                      </span>
                    ))}
                    {config.columns.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{config.columns.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingReport && (REPORT_ICONS[editingReport.key] || <FileText className="w-5 h-5" />)}
              تعديل {editingReport?.name}
            </DialogTitle>
            <DialogDescription>
              تخصيص الأعمدة المعروضة وعناوينها
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">تفعيل التقرير</Label>
                  <p className="text-xs text-muted-foreground">إظهار أو إخفاء التقرير من قائمة التقارير</p>
                </div>
                <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">الأعمدة</Label>
                  <Button variant="ghost" size="sm" onClick={handleResetColumns} className="text-xs gap-1">
                    <RotateCcw className="w-3 h-3" />
                    إعادة تعيين
                  </Button>
                </div>
                <div className="border rounded-lg divide-y">
                  {editColumns.map(column => (
                    <div key={column.field} className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={column.visible}
                        onCheckedChange={(checked) => handleColumnToggle(column.field, !!checked)}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {column.visible ? (
                          <Eye className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">الحقل</Label>
                            <p className="text-sm font-mono text-muted-foreground">{column.field}</p>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">العنوان</Label>
                            <Input
                              value={column.label}
                              onChange={(e) => handleColumnLabelChange(column.field, e.target.value)}
                              className="h-8 text-sm"
                              placeholder={column.defaultLabel}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saveConfig.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
