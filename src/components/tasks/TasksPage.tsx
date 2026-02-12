import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Calendar, Flag, CheckCircle2, Circle, Clock, AlertTriangle, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  category: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export function TasksPage() {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const STATUS_CONFIG = {
    todo: { label: t.tasks_status_todo, icon: Circle, color: 'bg-muted/50 border-muted-foreground/20', headerColor: 'bg-muted' },
    in_progress: { label: t.tasks_status_in_progress, icon: Clock, color: 'bg-primary/5 border-primary/20', headerColor: 'bg-primary/10' },
    done: { label: t.tasks_status_done, icon: CheckCircle2, color: 'bg-green-500/5 border-green-500/20', headerColor: 'bg-green-500/10' },
  };

  const PRIORITY_CONFIG = {
    low: { label: t.tasks_priority_low, color: 'bg-muted text-muted-foreground' },
    medium: { label: t.tasks_priority_medium, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    high: { label: t.tasks_priority_high, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    urgent: { label: t.tasks_priority_urgent, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], status: 'todo' as Task['status'], due_date: '', category: '', assigned_to: '' });
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();

  const fetchTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في تحميل المهام' : 'Failed to load tasks', variant: 'destructive' }); }
    else { setTasks((data || []) as Task[]); }
    setIsLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('tasks-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, () => { fetchTasks(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openNew = () => { setEditingTask(null); setForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '', category: '', assigned_to: '' }); setShowDialog(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, due_date: task.due_date || '', category: task.category || '', assigned_to: task.assigned_to || '' }); setShowDialog(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'عنوان المهمة مطلوب' : 'Task title is required', variant: 'destructive' }); return; }
    if (!user || !company) return;
    const taskData = { title: form.title.trim(), description: form.description.trim() || null, priority: form.priority, status: form.status, due_date: form.due_date || null, category: form.category.trim() || null, assigned_to: form.assigned_to.trim() || null };
    if (editingTask) {
      const { error } = await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
      if (error) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في تحديث المهمة' : 'Failed to update task', variant: 'destructive' }); return; }
      toast({ title: language === 'ar' ? 'تم' : 'Done', description: language === 'ar' ? 'تم تحديث المهمة بنجاح' : 'Task updated successfully' });
    } else {
      const { error } = await supabase.from('tasks').insert({ ...taskData, user_id: user.id, company_id: company.id });
      if (error) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في إضافة المهمة' : 'Failed to add task', variant: 'destructive' }); return; }
      toast({ title: language === 'ar' ? 'تم' : 'Done', description: language === 'ar' ? 'تم إضافة المهمة بنجاح' : 'Task added successfully' });
    }
    setShowDialog(false); fetchTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في حذف المهمة' : 'Failed to delete task', variant: 'destructive' }); return; }
    toast({ title: language === 'ar' ? 'تم' : 'Done', description: language === 'ar' ? 'تم حذف المهمة' : 'Task deleted' }); fetchTasks();
  };

  const updateStatus = async (taskId: string, newStatus: Task['status']) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) { toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status', variant: 'destructive' }); return; }
    fetchTasks();
  };

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverColumn(null); };
  const handleDragOver = (e: React.DragEvent, status: string) => { e.preventDefault(); setDragOverColumn(status); };
  const handleDrop = (e: React.DragEvent, status: Task['status']) => { e.preventDefault(); if (draggedTask) { updateStatus(draggedTask, status); } setDraggedTask(null); setDragOverColumn(null); };

  const columns: Task['status'][] = ['todo', 'in_progress', 'done'];
  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);
  const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.tasks_title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.tasks_subtitle}</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />{t.tasks_new}</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-foreground">{tasks.length}</p><p className="text-xs text-muted-foreground">{t.tasks_total}</p></CardContent></Card>
        <Card className="border"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{getTasksByStatus('in_progress').length}</p><p className="text-xs text-muted-foreground">{t.tasks_in_progress}</p></CardContent></Card>
        <Card className="border"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{getTasksByStatus('done').length}</p><p className="text-xs text-muted-foreground">{t.tasks_completed}</p></CardContent></Card>
        <Card className="border"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{tasks.filter(t => isOverdue(t)).length}</p><p className="text-xs text-muted-foreground">{t.tasks_overdue}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(status => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const columnTasks = getTasksByStatus(status);
          return (
            <div key={status} className={cn('rounded-xl border-2 border-dashed transition-all min-h-[300px]', config.color, dragOverColumn === status && 'ring-2 ring-primary scale-[1.01]')} onDragOver={(e) => handleDragOver(e, status)} onDrop={(e) => handleDrop(e, status)}>
              <div className={cn('flex items-center justify-between p-3 rounded-t-lg', config.headerColor)}>
                <div className="flex items-center gap-2"><StatusIcon className="w-4 h-4" /><span className="font-semibold text-sm">{config.label}</span></div>
                <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
              </div>
              <div className="p-2 space-y-2">
                {columnTasks.map(task => (
                  <Card key={task.id} draggable onDragStart={() => handleDragStart(task.id)} onDragEnd={handleDragEnd} className={cn('cursor-grab active:cursor-grabbing transition-all hover:shadow-md border', draggedTask === task.id && 'opacity-50 scale-95', isOverdue(task) && 'border-red-300 dark:border-red-800')}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn('font-medium text-sm flex-1', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(task)} className="p-1 hover:bg-muted rounded transition-colors"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3 h-3 text-destructive" /></button>
                        </div>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={cn('text-[10px] px-1.5 py-0', PRIORITY_CONFIG[task.priority].color)}>{PRIORITY_CONFIG[task.priority].label}</Badge>
                        {task.due_date && <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-0.5', isOverdue(task) && 'border-red-400 text-red-600')}><Calendar className="w-2.5 h-2.5" />{new Date(task.due_date).toLocaleDateString(locale)}</Badge>}
                        {task.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.category}</Badge>}
                      </div>
                      {task.assigned_to && <p className="text-[10px] text-muted-foreground">← {task.assigned_to}</p>}
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && <div className="text-center py-8 text-muted-foreground"><p className="text-xs">{t.tasks_no_tasks}</p></div>}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingTask ? t.tasks_edit_title : t.tasks_new_title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">{t.tasks_title_label}</label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t.tasks_title_placeholder} /></div>
            <div><label className="text-sm font-medium mb-1 block">{t.tasks_description_label}</label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t.tasks_desc_placeholder} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t.tasks_priority}</label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v as Task['priority'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.tasks_priority_low}</SelectItem>
                    <SelectItem value="medium">{t.tasks_priority_medium}</SelectItem>
                    <SelectItem value="high">{t.tasks_priority_high}</SelectItem>
                    <SelectItem value="urgent">{t.tasks_priority_urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t.status}</label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v as Task['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t.tasks_status_todo}</SelectItem>
                    <SelectItem value="in_progress">{t.tasks_status_in_progress}</SelectItem>
                    <SelectItem value="done">{t.tasks_status_done}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">{t.tasks_due_date}</label><Input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">{t.tasks_category}</label><Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder={t.tasks_category_placeholder} /></div>
              <div><label className="text-sm font-medium mb-1 block">{t.tasks_assigned_to}</label><Input value={form.assigned_to} onChange={(e) => setForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder={t.tasks_assigned_placeholder} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" />{editingTask ? t.tasks_update : t.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
