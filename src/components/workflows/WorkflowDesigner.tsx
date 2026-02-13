import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Settings, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useWorkflowTemplate,
  useWorkflowStages,
  useCreateWorkflowStage,
  useUpdateWorkflowStage,
  useDeleteWorkflowStage,
  useStageFields,
  useCreateStageField,
  useDeleteStageField,
  useAccountingRules,
  useCreateAccountingRule,
  useDeleteAccountingRule,
} from '@/hooks/useWorkflows';
import { FIELD_TYPES, STAGE_TYPES } from '@/services/workflows';
import { toast } from 'sonner';

interface Props {
  workflowId: string;
  onBack: () => void;
}

export function WorkflowDesigner({ workflowId, onBack }: Props) {
  const { language } = useLanguage();
  const { data: template } = useWorkflowTemplate(workflowId);
  const { data: stages = [] } = useWorkflowStages(workflowId);
  const createStage = useCreateWorkflowStage();
  const updateStage = useUpdateWorkflowStage();
  const deleteStage = useDeleteWorkflowStage();

  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddStage = async () => {
    try {
      await createStage.mutateAsync({
        workflow_id: workflowId,
        name: language === 'ar' ? 'مرحلة جديدة' : 'New Stage',
        stage_order: stages.length,
        stage_type: 'task',
      });
      toast.success(language === 'ar' ? 'تمت الإضافة' : 'Stage added');
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  const handleDeleteStage = async (id: string) => {
    try {
      await deleteStage.mutateAsync({ id, workflowId });
      if (selectedStageId === id) setSelectedStageId(null);
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  const handleUpdateStage = async (id: string, field: string, value: any) => {
    try {
      await updateStage.mutateAsync({ id, updates: { [field]: value }, workflowId });
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  const stageTypeColors: Record<string, string> = {
    task: '#3b82f6',
    approval: '#f59e0b',
    decision: '#8b5cf6',
    notification: '#06b6d4',
    accounting: '#10b981',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? `تصميم: ${template?.name || ''}` : `Design: ${template?.name_en || template?.name || ''}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'أضف المراحل والحقول والقواعد المحاسبية' : 'Add stages, fields, and accounting rules'}
          </p>
        </div>
        <Button onClick={handleAddStage} className="gap-2" disabled={createStage.isPending}>
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مرحلة' : 'Add Stage'}
        </Button>
      </div>

      {/* Visual Pipeline */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setSelectedStageId(stage.id); toggleExpand(stage.id); }}
              className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium whitespace-nowrap ${
                selectedStageId === stage.id 
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: stageTypeColors[stage.stage_type] || '#6366f1' }} />
              {language === 'ar' ? stage.name : (stage.name_en || stage.name)}
            </button>
            {idx < stages.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
        {stages.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">
            {language === 'ar' ? 'لا توجد مراحل. أضف مرحلة للبدء.' : 'No stages. Add one to start.'}
          </p>
        )}
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            {language === 'ar' ? 'المراحل' : 'Stages'}
          </h3>
          {stages.map((stage, idx) => (
            <Card
              key={stage.id}
              className={`p-3 cursor-pointer transition-all ${selectedStageId === stage.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSelectedStageId(stage.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: stageTypeColors[stage.stage_type] || '#6366f1' }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={stage.name}
                    onChange={e => handleUpdateStage(stage.id, 'name', e.target.value)}
                    className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0"
                    onClick={e => e.stopPropagation()}
                  />
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {STAGE_TYPES.find(s => s.value === stage.stage_type)?.[language === 'ar' ? 'label' : 'label_en'] || stage.stage_type}
                  </Badge>
                </div>
                <Select
                  value={stage.stage_type}
                  onValueChange={v => handleUpdateStage(stage.id, 'stage_type', v)}
                >
                  <SelectTrigger className="w-24 h-7 text-xs" onClick={e => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_TYPES.map(st => (
                      <SelectItem key={st.value} value={st.value}>
                        {language === 'ar' ? st.label : st.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0"
                  onClick={e => { e.stopPropagation(); handleDeleteStage(stage.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Stage Configuration */}
        <div className="lg:col-span-2">
          {selectedStageId ? (
            <StageConfig stageId={selectedStageId} language={language} />
          ) : (
            <Card className="p-12 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'اختر مرحلة لتكوين الحقول والقواعد' : 'Select a stage to configure fields and rules'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StageConfig({ stageId, language }: { stageId: string; language: string }) {
  const { data: fields = [] } = useStageFields(stageId);
  const createField = useCreateStageField();
  const deleteField = useDeleteStageField();
  const { data: rules = [] } = useAccountingRules(stageId);
  const createRule = useCreateAccountingRule();
  const deleteRule = useDeleteAccountingRule();

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const handleAddField = async () => {
    if (!newFieldLabel.trim()) return;
    const fieldName = newFieldLabel.replace(/\s+/g, '_').toLowerCase();
    try {
      await createField.mutateAsync({
        stage_id: stageId,
        field_name: fieldName,
        field_label: newFieldLabel,
        field_type: newFieldType,
        field_order: fields.length,
      });
      setNewFieldLabel('');
      setNewFieldType('text');
      toast.success(language === 'ar' ? 'تم إضافة الحقل' : 'Field added');
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  const handleAddRule = async () => {
    try {
      await createRule.mutateAsync({
        stage_id: stageId,
        trigger_on: 'enter',
        amount_source: 'field',
        description: language === 'ar' ? 'قاعدة جديدة' : 'New Rule',
      });
      toast.success(language === 'ar' ? 'تم إضافة القاعدة' : 'Rule added');
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Fields Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {language === 'ar' ? 'حقول المرحلة' : 'Stage Fields'}
          </h4>
        </div>

        {fields.length > 0 && (
          <div className="space-y-2 mb-4">
            {fields.map(field => (
              <div key={field.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                <span className="font-medium text-sm flex-1">{field.field_label}</span>
                <Badge variant="outline" className="text-xs">
                  {FIELD_TYPES.find(f => f.value === field.field_type)?.[language === 'ar' ? 'label' : 'label_en'] || field.field_type}
                </Badge>
                <Badge variant={field.is_required ? 'default' : 'secondary'} className="text-[10px]">
                  {field.is_required ? (language === 'ar' ? 'مطلوب' : 'Required') : (language === 'ar' ? 'اختياري' : 'Optional')}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                  onClick={() => deleteField.mutate({ id: field.id, stageId })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">{language === 'ar' ? 'اسم الحقل' : 'Field Label'}</label>
            <Input value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder={language === 'ar' ? 'مثال: الكمية' : 'e.g. Quantity'} className="h-9" />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">{language === 'ar' ? 'النوع' : 'Type'}</label>
            <Select value={newFieldType} onValueChange={setNewFieldType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(ft => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {language === 'ar' ? ft.label : ft.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleAddField} disabled={!newFieldLabel.trim() || createField.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Accounting Rules Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-green-600" />
            {language === 'ar' ? 'القواعد المحاسبية' : 'Accounting Rules'}
          </h4>
          <Button size="sm" variant="outline" onClick={handleAddRule} disabled={createRule.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            {language === 'ar' ? 'إضافة قاعدة' : 'Add Rule'}
          </Button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === 'ar' ? 'لا توجد قواعد محاسبية. أضف قاعدة لتوليد قيود تلقائية.' : 'No accounting rules. Add one to auto-generate journal entries.'}
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex-1">
                  <p className="text-sm font-medium">{rule.description || (language === 'ar' ? 'قاعدة محاسبية' : 'Accounting Rule')}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? `التفعيل: عند ${rule.trigger_on === 'enter' ? 'الدخول' : rule.trigger_on === 'exit' ? 'الخروج' : 'الموافقة'}` 
                      : `Trigger: on ${rule.trigger_on}`}
                    {' • '}
                    {language === 'ar' ? `المصدر: ${rule.amount_source === 'field' ? 'حقل' : rule.amount_source === 'fixed' ? 'ثابت' : 'معادلة'}`
                      : `Source: ${rule.amount_source}`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                  onClick={() => deleteRule.mutate({ id: rule.id, stageId })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
