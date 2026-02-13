import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutGrid, BarChart3, Calendar, Users, CheckCircle, Trash2, Edit, Eye } from 'lucide-react';
import { useAdvancedProjects, AdvancedProject, ProjectTask } from '@/hooks/useAdvancedProjects';

export function AdvancedProjectsPage() {
  const { projects, tasks, loading, fetchTasks, addProject, updateProject, deleteProject, addTask, updateTask, deleteTask } = useAdvancedProjects();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AdvancedProject | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<AdvancedProject>>({});
  const [editingTask, setEditingTask] = useState<Partial<ProjectTask>>({});
  const [viewProjectId, setViewProjectId] = useState<string | null>(null);

  const openNewProject = () => { setEditingProject({}); setSelectedProject(null); setShowProjectDialog(true); };
  const openEditProject = (p: AdvancedProject) => { setEditingProject(p); setSelectedProject(p); setShowProjectDialog(true); };
  const openNewTask = (projectId: string) => { setEditingTask({ project_id: projectId }); setShowTaskDialog(true); };

  const handleSaveProject = async () => {
    if (!editingProject.name) return;
    if (selectedProject) await updateProject(selectedProject.id, editingProject);
    else await addProject(editingProject);
    setShowProjectDialog(false);
  };

  const handleSaveTask = async () => {
    if (!editingTask.title || !editingTask.project_id) return;
    await addTask(editingTask);
    setShowTaskDialog(false);
  };

  const viewProject = (id: string) => { setViewProjectId(id); fetchTasks(id); };

  const statusLabel: Record<string, string> = { planning: 'تخطيط', active: 'نشط', completed: 'مكتمل', on_hold: 'معلق' };
  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { planning: 'outline', active: 'default', completed: 'secondary', on_hold: 'destructive' };
  const priorityLabel: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'عالي' };
  const taskStatusLabel: Record<string, string> = { pending: 'قيد الانتظار', in_progress: 'قيد التنفيذ', review: 'مراجعة', completed: 'مكتمل' };

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const totalTeam = projects.reduce((s, p) => s + (p.team_size || 0), 0);
  const completedCount = projects.filter(p => p.status === 'completed').length;

  const activeView = viewProjectId ? projects.find(p => p.id === viewProjectId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المشاريع المتقدمة</h1>
          <p className="text-muted-foreground">إنشاء وتتبع المشاريع والمهام</p>
        </div>
        <Button className="gap-2" onClick={openNewProject}><Plus className="w-4 h-4" />مشروع جديد</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><LayoutGrid className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{projects.length}</div><p className="text-sm text-muted-foreground">المشاريع</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{completedCount}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{totalTeam}</div><p className="text-sm text-muted-foreground">أعضاء الفريق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{totalBudget.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الميزانية</p></CardContent></Card>
      </div>

      {/* Main content */}
      {activeView ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setViewProjectId(null)}>← رجوع</Button>
            <h2 className="text-xl font-bold">{activeView.name}</h2>
            <Badge variant={statusVariant[activeView.status]}>{statusLabel[activeView.status] || activeView.status}</Badge>
          </div>
          {activeView.description && <p className="text-muted-foreground">{activeView.description}</p>}
          <div className="flex items-center gap-4">
            <Progress value={activeView.progress} className="flex-1 h-3" />
            <span className="text-sm font-bold">{activeView.progress}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الميزانية: {Number(activeView.budget).toLocaleString()} ر.س | المصروف: {Number(activeView.spent).toLocaleString()} ر.س</span>
            <Button size="sm" className="gap-1" onClick={() => openNewTask(activeView.id)}><Plus className="w-3 h-3" />مهمة جديدة</Button>
          </div>

          {/* Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['pending', 'in_progress', 'review', 'completed'] as const).map(status => {
              const colTasks = tasks.filter(t => t.status === status);
              const colors: Record<string, string> = { pending: 'bg-muted', in_progress: 'bg-blue-50 dark:bg-blue-950', review: 'bg-yellow-50 dark:bg-yellow-950', completed: 'bg-green-50 dark:bg-green-950' };
              return (
                <div key={status} className={`rounded-lg p-3 ${colors[status]}`}>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    {taskStatusLabel[status]}
                    <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <Card key={task.id} className={`border-r-4 ${task.priority === 'high' ? 'border-r-destructive' : task.priority === 'medium' ? 'border-r-yellow-500' : 'border-r-green-500'}`}>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.assignee && <p className="text-xs text-muted-foreground mt-1">{task.assignee}</p>}
                          <div className="flex items-center gap-1 mt-2">
                            <Badge variant="outline" className="text-[10px]">{priorityLabel[task.priority]}</Badge>
                            <div className="flex-1" />
                            {/* Status change buttons */}
                            {status !== 'completed' && (
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                const next: Record<string, string> = { pending: 'in_progress', in_progress: 'review', review: 'completed' };
                                updateTask(task.id, { status: next[status] }, activeView.id);
                              }}>
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteTask(task.id, activeView.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">جاري التحميل...</CardContent></Card>
          ) : projects.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد مشاريع. أنشئ مشروعك الأول!</CardContent></Card>
          ) : (
            projects.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {p.start_date && `${p.start_date}`}{p.end_date && ` → ${p.end_date}`}
                        {p.manager_name && ` • مدير: ${p.manager_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[p.status]}>{statusLabel[p.status] || p.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => viewProject(p.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditProject(p)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProject(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1"><Progress value={p.progress} className="h-2" /></div>
                    <span className="text-sm font-medium">{p.progress}%</span>
                    <span className="text-sm text-muted-foreground">{p.team_size} أعضاء</span>
                    <span className="text-sm text-muted-foreground">{Number(p.budget).toLocaleString()} ر.س</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedProject ? 'تعديل المشروع' : 'مشروع جديد'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>اسم المشروع *</Label><Input value={editingProject.name || ''} onChange={e => setEditingProject(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>الوصف</Label><Textarea value={editingProject.description || ''} onChange={e => setEditingProject(prev => ({ ...prev, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الحالة</Label>
                <Select value={editingProject.status || 'planning'} onValueChange={v => setEditingProject(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">تخطيط</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="on_hold">معلق</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الميزانية</Label><Input type="number" value={editingProject.budget || ''} onChange={e => setEditingProject(prev => ({ ...prev, budget: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>تاريخ البداية</Label><Input type="date" value={editingProject.start_date || ''} onChange={e => setEditingProject(prev => ({ ...prev, start_date: e.target.value }))} /></div>
              <div><Label>تاريخ النهاية</Label><Input type="date" value={editingProject.end_date || ''} onChange={e => setEditingProject(prev => ({ ...prev, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>مدير المشروع</Label><Input value={editingProject.manager_name || ''} onChange={e => setEditingProject(prev => ({ ...prev, manager_name: e.target.value }))} /></div>
              <div><Label>عدد الفريق</Label><Input type="number" value={editingProject.team_size || ''} onChange={e => setEditingProject(prev => ({ ...prev, team_size: Number(e.target.value) }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveProject}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>مهمة جديدة</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>عنوان المهمة *</Label><Input value={editingTask.title || ''} onChange={e => setEditingTask(prev => ({ ...prev, title: e.target.value }))} /></div>
            <div><Label>المسؤول</Label><Input value={editingTask.assignee || ''} onChange={e => setEditingTask(prev => ({ ...prev, assignee: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الأولوية</Label>
                <Select value={editingTask.priority || 'medium'} onValueChange={v => setEditingTask(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>تاريخ الاستحقاق</Label><Input type="date" value={editingTask.due_date || ''} onChange={e => setEditingTask(prev => ({ ...prev, due_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask}>إضافة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
