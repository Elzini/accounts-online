import { useState } from 'react';
import { Plus, Settings2, Play, Trash2, Edit, Eye, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkflowTemplates, useCreateWorkflowTemplate, useDeleteWorkflowTemplate } from '@/hooks/useWorkflows';
import { WorkflowTemplate } from '@/services/workflows';
import { WorkflowDesigner } from './WorkflowDesigner';
import { WorkflowRunner } from './WorkflowRunner';
import { toast } from 'sonner';

export function WorkflowsPage() {
  const { t, language } = useLanguage();
  const { data: templates = [], isLoading } = useWorkflowTemplates();
  const createTemplate = useCreateWorkflowTemplate();
  const deleteTemplate = useDeleteWorkflowTemplate();

  const [showCreate, setShowCreate] = useState(false);
  const [designingId, setDesigningId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTemplate.mutateAsync({
        name: newName,
        name_en: newNameEn || undefined,
        description: newDesc || undefined,
        icon: 'FileText',
        color: '#3b82f6',
      });
      setShowCreate(false);
      setNewName('');
      setNewNameEn('');
      setNewDesc('');
      toast.success(language === 'ar' ? 'تم إنشاء الدورة المستندية' : 'Workflow created');
    } catch {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'Error creating workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Delete this workflow?')) return;
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    } catch {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'Error');
    }
  };

  if (designingId) {
    return <WorkflowDesigner workflowId={designingId} onBack={() => setDesigningId(null)} />;
  }

  if (runningId) {
    return <WorkflowRunner workflowId={runningId} onBack={() => setRunningId(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'محرك الدورات المستندية' : 'Document Cycle Engine'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'تصميم وتشغيل دورات مستندية مخصصة مع ربط محاسبي تلقائي' : 'Design and run custom document workflows with auto accounting'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'دورة جديدة' : 'New Workflow'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {language === 'ar' ? 'لا توجد دورات مستندية' : 'No workflows yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'أنشئ أول دورة مستندية مخصصة لعملك' : 'Create your first custom document workflow'}
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إنشاء دورة' : 'Create Workflow'}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="p-5 hover:shadow-lg transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tmpl.color + '20' }}>
                  <FileText className="w-5 h-5" style={{ color: tmpl.color }} />
                </div>
                <Badge variant={tmpl.is_active ? 'default' : 'secondary'}>
                  {tmpl.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Inactive')}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {language === 'ar' ? tmpl.name : (tmpl.name_en || tmpl.name)}
              </h3>
              {tmpl.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tmpl.description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-3 border-t">
                <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setDesigningId(tmpl.id)}>
                  <Edit className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'تصميم' : 'Design'}
                </Button>
                <Button size="sm" className="gap-1 flex-1" onClick={() => setRunningId(tmpl.id)}>
                  <Play className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'تشغيل' : 'Run'}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(tmpl.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إنشاء دورة مستندية جديدة' : 'Create New Workflow'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={language === 'ar' ? 'مثال: دورة تصدير حاصلات زراعية' : 'e.g. Agricultural Export Cycle'} />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <Input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="Agricultural Export Cycle" />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t.cancel}</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createTemplate.isPending}>
              {createTemplate.isPending ? '...' : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
