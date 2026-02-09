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

const STATUS_CONFIG = {
  todo: { label: 'قيد الانتظار', icon: Circle, color: 'bg-muted/50 border-muted-foreground/20', headerColor: 'bg-muted' },
  in_progress: { label: 'قيد التنفيذ', icon: Clock, color: 'bg-primary/5 border-primary/20', headerColor: 'bg-primary/10' },
  done: { label: 'مكتمل', icon: CheckCircle2, color: 'bg-green-500/5 border-green-500/20', headerColor: 'bg-green-500/10' },
};

const PRIORITY_CONFIG = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'عاجلة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function TasksPage() {
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
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تحميل المهام', variant: 'destructive' });
    } else {
      setTasks((data || []) as Task[]);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openNew = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '', category: '', assigned_to: '' });
    setShowDialog(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
      category: task.category || '',
      assigned_to: task.assigned_to || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'خطأ', description: 'عنوان المهمة مطلوب', variant: 'destructive' });
      return;
    }
    if (!user || !company) return;

    const taskData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      category: form.category.trim() || null,
      assigned_to: form.assigned_to.trim() || null,
    };

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
      if (error) {
        toast({ title: 'خطأ', description: 'فشل في تحديث المهمة', variant: 'destructive' });
        return;
      }
      toast({ title: 'تم', description: 'تم تحديث المهمة بنجاح' });
    } else {
      const { error } = await supabase.from('tasks').insert({ ...taskData, user_id: user.id, company_id: company.id });
      if (error) {
        toast({ title: 'خطأ', description: 'فشل في إضافة المهمة', variant: 'destructive' });
        return;
      }
      toast({ title: 'تم', description: 'تم إضافة المهمة بنجاح' });
    }
    setShowDialog(false);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف المهمة', variant: 'destructive' });
      return;
    }
    toast({ title: 'تم', description: 'تم حذف المهمة' });
    fetchTasks();
  };

  const updateStatus = async (taskId: string, newStatus: Task['status']) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تحديث الحالة', variant: 'destructive' });
      return;
    }
    fetchTasks();
  };

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverColumn(null); };
  const handleDragOver = (e: React.DragEvent, status: string) => { e.preventDefault(); setDragOverColumn(status); };
  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTask) {
      updateStatus(draggedTask, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const columns: Task['status'][] = ['todo', 'in_progress', 'done'];

  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

  const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">إدارة المهام</h1>
          <p className="text-sm text-muted-foreground mt-1">تنظيم وترتيب مهام العمل</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          مهمة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي المهام</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{getTasksByStatus('in_progress').length}</p>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{getTasksByStatus('done').length}</p>
            <p className="text-xs text-muted-foreground">مكتملة</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{tasks.filter(t => isOverdue(t)).length}</p>
            <p className="text-xs text-muted-foreground">متأخرة</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(status => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const columnTasks = getTasksByStatus(status);

          return (
            <div
              key={status}
              className={cn(
                'rounded-xl border-2 border-dashed transition-all min-h-[300px]',
                config.color,
                dragOverColumn === status && 'ring-2 ring-primary scale-[1.01]'
              )}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={cn('flex items-center justify-between p-3 rounded-t-lg', config.headerColor)}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{config.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
              </div>

              <div className="p-2 space-y-2">
                {columnTasks.map(task => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'cursor-grab active:cursor-grabbing transition-all hover:shadow-md border',
                      draggedTask === task.id && 'opacity-50 scale-95',
                      isOverdue(task) && 'border-red-300 dark:border-red-800'
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn('font-medium text-sm flex-1', task.status === 'done' && 'line-through text-muted-foreground')}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(task)} className="p-1 hover:bg-muted rounded transition-colors">
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={cn('text-[10px] px-1.5 py-0', PRIORITY_CONFIG[task.priority].color)}>
                          {PRIORITY_CONFIG[task.priority].label}
                        </Badge>
                        {task.due_date && (
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-0.5', isOverdue(task) && 'border-red-400 text-red-600')}>
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(task.due_date).toLocaleDateString('ar-SA')}
                          </Badge>
                        )}
                        {task.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.category}</Badge>
                        )}
                      </div>

                      {task.assigned_to && (
                        <p className="text-[10px] text-muted-foreground">← {task.assigned_to}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs">لا توجد مهام</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'تعديل المهمة' : 'مهمة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان *</label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان المهمة" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الوصف</label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف المهمة" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الأولوية</label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v as Task['priority'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحالة</label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v as Task['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">قيد الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="done">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">تاريخ الاستحقاق</label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">التصنيف</label>
                <Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder="مثال: محاسبة" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">مُسند إلى</label>
                <Input value={form.assigned_to} onChange={(e) => setForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder="اسم الشخص" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {editingTask ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
