import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

export interface AdvancedProject {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  start_date: string | null;
  end_date: string | null;
  manager_name: string | null;
  team_size: number;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  assignee: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export function useAdvancedProjects() {
  const companyId = useCompanyId();
  const [projects, setProjects] = useState<AdvancedProject[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('advanced_projects')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) { toast.error('خطأ في تحميل المشاريع'); console.error(error); }
    else setProjects(data || []);
    setLoading(false);
  }, [companyId]);

  const fetchTasks = useCallback(async (projectId?: string) => {
    if (!companyId) return;
    let query = supabase
      .from('project_tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) { toast.error('خطأ في تحميل المهام'); console.error(error); }
    else setTasks(data || []);
  }, [companyId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = async (project: Partial<AdvancedProject>) => {
    if (!companyId) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('advanced_projects').insert({
      company_id: companyId,
      name: project.name || '',
      description: project.description,
      status: project.status || 'planning',
      budget: project.budget || 0,
      start_date: project.start_date,
      end_date: project.end_date,
      manager_name: project.manager_name,
      team_size: project.team_size || 0,
      created_by: userData?.user?.id,
    });
    if (error) { toast.error('خطأ في إنشاء المشروع'); console.error(error); }
    else { toast.success('تم إنشاء المشروع بنجاح'); fetchProjects(); }
  };

  const updateProject = async (id: string, updates: Partial<AdvancedProject>) => {
    const { error } = await supabase.from('advanced_projects').update(updates).eq('id', id);
    if (error) { toast.error('خطأ في تحديث المشروع'); console.error(error); }
    else { toast.success('تم تحديث المشروع'); fetchProjects(); }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('advanced_projects').delete().eq('id', id);
    if (error) { toast.error('خطأ في حذف المشروع'); console.error(error); }
    else { toast.success('تم حذف المشروع'); fetchProjects(); }
  };

  const addTask = async (task: Partial<ProjectTask>) => {
    if (!companyId) return;
    const { error } = await supabase.from('project_tasks').insert({
      company_id: companyId,
      project_id: task.project_id!,
      title: task.title || '',
      assignee: task.assignee,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date,
      notes: task.notes,
    });
    if (error) { toast.error('خطأ في إنشاء المهمة'); console.error(error); }
    else { toast.success('تم إنشاء المهمة'); fetchTasks(task.project_id); recalcProgress(task.project_id!); }
  };

  const updateTask = async (id: string, updates: Partial<ProjectTask>, projectId: string) => {
    const { error } = await supabase.from('project_tasks').update(updates).eq('id', id);
    if (error) { toast.error('خطأ في تحديث المهمة'); console.error(error); }
    else { toast.success('تم تحديث المهمة'); fetchTasks(projectId); recalcProgress(projectId); }
  };

  const deleteTask = async (id: string, projectId: string) => {
    const { error } = await supabase.from('project_tasks').delete().eq('id', id);
    if (error) { toast.error('خطأ في حذف المهمة'); console.error(error); }
    else { toast.success('تم حذف المهمة'); fetchTasks(projectId); recalcProgress(projectId); }
  };

  const recalcProgress = async (projectId: string) => {
    const { data } = await supabase
      .from('project_tasks')
      .select('status')
      .eq('project_id', projectId);
    if (!data || data.length === 0) return;
    const done = data.filter(t => t.status === 'completed').length;
    const progress = Math.round((done / data.length) * 100);
    await supabase.from('advanced_projects').update({ progress }).eq('id', projectId);
    fetchProjects();
  };

  return { projects, tasks, loading, fetchProjects, fetchTasks, addProject, updateProject, deleteProject, addTask, updateTask, deleteTask };
}
