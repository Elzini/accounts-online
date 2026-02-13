import { useState } from 'react';
import { ArrowLeft, Plus, Play, CheckCircle, Clock, XCircle, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useWorkflowTemplate,
  useWorkflowStages,
  useWorkflowInstances,
  useCreateWorkflowInstance,
  useUpdateWorkflowInstance,
  useInstanceStages,
  useCreateInstanceStage,
  useUpdateInstanceStage,
  useStageFields,
} from '@/hooks/useWorkflows';
import { WorkflowInstance } from '@/services/workflows';
import { toast } from 'sonner';

interface Props {
  workflowId: string;
  onBack: () => void;
}

export function WorkflowRunner({ workflowId, onBack }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: template } = useWorkflowTemplate(workflowId);
  const { data: stages = [] } = useWorkflowStages(workflowId);
  const { data: instances = [] } = useWorkflowInstances(workflowId);
  const createInstance = useCreateWorkflowInstance();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);

  const handleStartNew = async () => {
    if (!newTitle.trim() || stages.length === 0) return;
    try {
      const firstStage = stages[0];
      const inst = await createInstance.mutateAsync({
        workflow_id: workflowId,
        title: newTitle,
        current_stage_id: firstStage.id,
        started_by: user?.id,
        status: 'active',
      });
      setShowNew(false);
      setNewTitle('');
      setSelectedInstance(inst.id);
      toast.success(language === 'ar' ? 'تم بدء الدورة' : 'Workflow started');
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  const statusIcons: Record<string, any> = {
    active: <Clock className="w-4 h-4 text-blue-500" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    cancelled: <XCircle className="w-4 h-4 text-red-500" />,
  };

  const statusLabels: Record<string, Record<string, string>> = {
    active: { ar: 'جاري', en: 'Active' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' },
    paused: { ar: 'متوقف', en: 'Paused' },
  };

  if (selectedInstance) {
    return <InstanceView instanceId={selectedInstance} stages={stages} onBack={() => setSelectedInstance(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? template?.name || '' : template?.name_en || template?.name || ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? `${instances.length} عملية` : `${instances.length} instances`}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2" disabled={stages.length === 0}>
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'بدء دورة جديدة' : 'Start New'}
        </Button>
      </div>

      {stages.length === 0 && (
        <Card className="p-6 text-center border-destructive/50">
          <p className="text-destructive font-medium">
            {language === 'ar' ? 'يجب تصميم المراحل أولاً قبل تشغيل الدورة' : 'Design stages first before running'}
          </p>
        </Card>
      )}

      {instances.length === 0 ? (
        <Card className="p-12 text-center">
          <Play className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد عمليات جارية' : 'No running instances'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {instances.map(inst => (
            <Card key={inst.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedInstance(inst.id)}>
              <div className="flex items-center gap-4">
                {statusIcons[inst.status] || <Clock className="w-4 h-4" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{inst.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {inst.reference_number} • {new Date(inst.started_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <Badge variant={inst.status === 'active' ? 'default' : inst.status === 'completed' ? 'secondary' : 'destructive'}>
                  {statusLabels[inst.status]?.[language === 'ar' ? 'ar' : 'en'] || inst.status}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'بدء دورة جديدة' : 'Start New Instance'}</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">{language === 'ar' ? 'العنوان' : 'Title'}</label>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: شحنة برتقال - يناير 2026' : 'e.g. Orange Shipment - Jan 2026'} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleStartNew} disabled={!newTitle.trim() || createInstance.isPending}>
              {language === 'ar' ? 'بدء' : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstanceView({ instanceId, stages, onBack }: { instanceId: string; stages: any[]; onBack: () => void }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: instanceStages = [] } = useInstanceStages(instanceId);
  const updateInstance = useUpdateWorkflowInstance();
  const createInstStage = useCreateInstanceStage();
  const updateInstStage = useUpdateInstanceStage();

  // Find current instance info from the parent's instances (we'll use instanceStages data)
  const [stageData, setStageData] = useState<Record<string, string>>({});
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const currentStage = stages[activeStageIdx];

  const handleCompleteStage = async () => {
    if (!currentStage) return;
    try {
      // Create instance stage record
      await createInstStage.mutateAsync({
        instance_id: instanceId,
        stage_id: currentStage.id,
        stage_data: stageData,
        status: 'completed',
        entered_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
      });

      // Move to next stage or complete
      if (activeStageIdx < stages.length - 1) {
        const nextStage = stages[activeStageIdx + 1];
        await updateInstance.mutateAsync({
          id: instanceId,
          updates: { current_stage_id: nextStage.id },
        });
        setActiveStageIdx(activeStageIdx + 1);
        setStageData({});
        toast.success(language === 'ar' ? 'تم الانتقال للمرحلة التالية' : 'Moved to next stage');
      } else {
        await updateInstance.mutateAsync({
          id: instanceId,
          updates: { status: 'completed', completed_at: new Date().toISOString() },
        });
        toast.success(language === 'ar' ? 'تم إكمال الدورة بنجاح!' : 'Workflow completed!');
        onBack();
      }
    } catch {
      toast.error(language === 'ar' ? 'خطأ' : 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {language === 'ar' ? 'تنفيذ الدورة' : 'Execute Workflow'}
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeStageIdx;
          const isCurrent = idx === activeStageIdx;
          return (
            <div key={stage.id} className="flex items-center gap-1 shrink-0">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                isCurrent ? 'bg-primary text-primary-foreground shadow-md' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {language === 'ar' ? stage.name : (stage.name_en || stage.name)}
              </div>
              {idx < stages.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Current Stage Form */}
      {currentStage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1">
            {language === 'ar' ? currentStage.name : (currentStage.name_en || currentStage.name)}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {language === 'ar' ? `المرحلة ${activeStageIdx + 1} من ${stages.length}` : `Stage ${activeStageIdx + 1} of ${stages.length}`}
          </p>

          <StageDynamicForm stageId={currentStage.id} data={stageData} onChange={setStageData} language={language} />

          <div className="flex justify-end mt-6 pt-4 border-t gap-2">
            <Button onClick={handleCompleteStage} className="gap-2" disabled={createInstStage.isPending}>
              {activeStageIdx < stages.length - 1 ? (
                <>
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {language === 'ar' ? 'إتمام الدورة' : 'Complete'}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Completed Stages History */}
      {instanceStages.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
            {language === 'ar' ? 'المراحل المنجزة' : 'Completed Stages'}
          </h4>
          <div className="space-y-2">
            {instanceStages.map(is => {
              const stage = stages.find(s => s.id === is.stage_id);
              return (
                <Card key={is.id} className="p-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stage ? (language === 'ar' ? stage.name : stage.name_en || stage.name) : 'Stage'}</p>
                      <p className="text-xs text-muted-foreground">
                        {is.completed_at && new Date(is.completed_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                    {is.stage_data && Object.keys(is.stage_data).length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {Object.keys(is.stage_data).length} {language === 'ar' ? 'حقل' : 'fields'}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StageDynamicForm({ stageId, data, onChange, language }: {
  stageId: string;
  data: Record<string, string>;
  onChange: (d: Record<string, string>) => void;
  language: string;
}) {
  const { data: fields = [] } = useStageFields(stageId);

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">
          {language === 'ar' ? 'لا توجد حقول لهذه المرحلة. يمكن إضافتها من المصمم.' : 'No fields for this stage. Add them from the designer.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(field => (
        <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
          <label className="text-sm font-medium mb-1 block">
            {field.field_label}
            {field.is_required && <span className="text-destructive mr-1">*</span>}
          </label>
          {field.field_type === 'textarea' ? (
            <Textarea
              value={data[field.field_name] || ''}
              onChange={e => onChange({ ...data, [field.field_name]: e.target.value })}
              rows={3}
            />
          ) : field.field_type === 'checkbox' ? (
            <input
              type="checkbox"
              checked={data[field.field_name] === 'true'}
              onChange={e => onChange({ ...data, [field.field_name]: e.target.checked ? 'true' : 'false' })}
              className="h-4 w-4"
            />
          ) : (
            <Input
              type={field.field_type === 'number' || field.field_type === 'currency' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
              value={data[field.field_name] || ''}
              onChange={e => onChange({ ...data, [field.field_name]: e.target.value })}
              required={field.is_required}
            />
          )}
        </div>
      ))}
    </div>
  );
}
