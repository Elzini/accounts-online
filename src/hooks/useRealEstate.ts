import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from './useCompanyId';
import { toast } from 'sonner';

// =================== Projects ===================
export function useREProjects() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-projects', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_projects')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useREProject(id: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_projects')
        .select('*')
        .eq('id', id!)
        .eq('company_id', companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!companyId,
  });
}

export function useSaveREProject() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (project: any) => {
      const payload = { ...project, company_id: companyId };
      if (project.id) {
        const { data, error } = await supabase.from('re_projects').update(payload).eq('id', project.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_projects').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-projects'] });
      toast.success('تم حفظ المشروع بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteREProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('re_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-projects'] });
      toast.success('تم حذف المشروع');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Project Phases ===================
export function useREProjectPhases(projectId: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-phases', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_project_phases')
        .select('*')
        .eq('project_id', projectId!)
        .eq('company_id', companyId!)
        .order('phase_order');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!companyId,
  });
}

export function useSaveREPhase() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (phase: any) => {
      const payload = { ...phase, company_id: companyId };
      if (phase.id) {
        const { data, error } = await supabase.from('re_project_phases').update(payload).eq('id', phase.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_project_phases').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['re-phases'] });
      toast.success('تم حفظ المرحلة');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Units ===================
export function useREUnits(projectId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-units', companyId, projectId],
    queryFn: async () => {
      let q = supabase
        .from('re_units')
        .select('*, re_projects(name), customers(name)')
        .eq('company_id', companyId!)
        .order('unit_number');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREUnit() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (unit: any) => {
      const payload = { ...unit, company_id: companyId };
      if (unit.id) {
        const { data, error } = await supabase.from('re_units').update(payload).eq('id', unit.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_units').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-units'] });
      toast.success('تم حفظ الوحدة');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Contractors ===================
export function useREContractors() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-contractors', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_contractors')
        .select('*')
        .eq('company_id', companyId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREContractor() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (c: any) => {
      const payload = { ...c, company_id: companyId };
      if (c.id) {
        const { data, error } = await supabase.from('re_contractors').update(payload).eq('id', c.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_contractors').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-contractors'] });
      toast.success('تم حفظ بيانات المقاول');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Work Orders ===================
export function useREWorkOrders(projectId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-work-orders', companyId, projectId],
    queryFn: async () => {
      let q = supabase
        .from('re_work_orders')
        .select('*, re_contractors(name), re_projects(name), re_project_phases(name)')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREWorkOrder() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (wo: any) => {
      const payload = { ...wo, company_id: companyId };
      if (wo.id) {
        const { data, error } = await supabase.from('re_work_orders').update(payload).eq('id', wo.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_work_orders').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-work-orders'] });
      toast.success('تم حفظ أمر العمل');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Progress Billings ===================
export function useREProgressBillings(projectId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-billings', companyId, projectId],
    queryFn: async () => {
      let q = supabase
        .from('re_progress_billings')
        .select('*, re_work_orders(title, order_number), re_contractors(name), re_projects(name)')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREBilling() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (b: any) => {
      const payload = { ...b, company_id: companyId };
      if (b.id) {
        const { data, error } = await supabase.from('re_progress_billings').update(payload).eq('id', b.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_progress_billings').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-billings'] });
      toast.success('تم حفظ المستخلص');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Installments ===================
export function useREInstallments(unitId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-installments', companyId, unitId],
    queryFn: async () => {
      let q = supabase
        .from('re_installments')
        .select('*, re_units(unit_number, re_projects(name)), customers(name)')
        .eq('company_id', companyId!)
        .order('due_date');
      if (unitId) q = q.eq('unit_id', unitId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

// =================== Dashboard Stats ===================
export function useREDashboardStats() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-dashboard-stats', companyId],
    queryFn: async () => {
      const [projectsRes, unitsRes, contractorsRes, billingsRes] = await Promise.all([
        supabase.from('re_projects').select('id, status, total_budget, total_spent, progress_percentage').eq('company_id', companyId!),
        supabase.from('re_units').select('id, status, price, sale_price, cost').eq('company_id', companyId!),
        supabase.from('re_contractors').select('id, is_active').eq('company_id', companyId!),
        supabase.from('re_progress_billings').select('id, net_amount, status').eq('company_id', companyId!),
      ]);

      const projects = projectsRes.data || [];
      const units = unitsRes.data || [];
      const contractors = contractorsRes.data || [];
      const billings = billingsRes.data || [];

      return {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'under_construction').length,
        totalUnits: units.length,
        availableUnits: units.filter(u => u.status === 'available').length,
        soldUnits: units.filter(u => u.status === 'sold').length,
        reservedUnits: units.filter(u => u.status === 'reserved').length,
        totalContractors: contractors.filter(c => c.is_active).length,
        totalBudget: projects.reduce((s, p) => s + Number(p.total_budget || 0), 0),
        totalSpent: projects.reduce((s, p) => s + Number(p.total_spent || 0), 0),
        totalSalesValue: units.filter(u => u.status === 'sold').reduce((s, u) => s + Number(u.sale_price || 0), 0),
        pendingBillings: billings.filter(b => b.status === 'submitted').length,
        avgProgress: projects.length ? projects.reduce((s, p) => s + Number(p.progress_percentage || 0), 0) / projects.length : 0,
      };
    },
    enabled: !!companyId,
  });
}
