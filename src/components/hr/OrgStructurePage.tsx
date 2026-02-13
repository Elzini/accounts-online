import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Users, GitFork, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function OrgStructurePage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', managerName: '', description: '' });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('departments').select('*').eq('company_id', companyId!).order('name'); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('departments').insert({ company_id: companyId!, name: form.name, manager_name: form.managerName || null, description: form.description || null, is_active: true }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); toast.success(t.org_added); setShowAdd(false); setForm({ name: '', managerName: '', description: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('departments').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.org_title}</h1><p className="text-muted-foreground">{t.org_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.org_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.org_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.org_dept_name}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>{t.org_manager}</Label><Input value={form.managerName} onChange={e => setForm(p => ({ ...p, managerName: e.target.value }))} /></div>
              <div><Label>{t.description}</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><GitFork className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{departments.length}</div><p className="text-sm text-muted-foreground">{t.org_departments}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{departments.filter((d: any) => d.is_active).length}</div><p className="text-sm text-muted-foreground">{t.org_active}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{departments.filter((d: any) => d.parent_id).length}</div><p className="text-sm text-muted-foreground">{t.org_sub_departments}</p></CardContent></Card>
      </div>
      {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : departments.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.org_no_departments}</p> : (
        <div className="space-y-3">
          {departments.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div><h3 className="font-semibold text-foreground">{d.name}</h3><p className="text-sm text-muted-foreground">{d.manager_name || t.org_no_manager}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.is_active ? 'default' : 'secondary'}>{d.is_active ? t.active : t.inactive}</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}