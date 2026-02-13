import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, FileText, Globe, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export function CMSPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', page_type: 'page', meta_title: '', meta_description: '' });

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['cms-pages', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addPage = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase.from('cms_pages').insert({
        company_id: companyId!, title: form.title, slug, content: form.content, excerpt: form.excerpt,
        page_type: form.page_type, meta_title: form.meta_title, meta_description: form.meta_description, status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); toast.success(t.cms_page_created); setShowAdd(false); setForm({ title: '', slug: '', content: '', excerpt: '', page_type: 'page', meta_title: '', meta_description: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('cms_pages').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); toast.success(t.mod_deleted); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'published') updates.published_at = new Date().toISOString();
      const { error } = await supabase.from('cms_pages').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cms-pages'] }); toast.success(t.cms_status_updated); },
  });

  const statusLabels: Record<string, string> = { draft: t.cms_draft, published: t.cms_published, archived: t.cms_archived };
  const typeLabels: Record<string, string> = { page: t.cms_type_page, post: t.cms_type_post, landing: t.cms_type_landing };
  const filtered = pages.filter((p: any) => p.title?.includes(search) || p.slug?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.cms_title}</h1><p className="text-muted-foreground">{t.cms_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.cms_new_page}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t.cms_new_page}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.cms_page_title}</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div><Label>{t.cms_slug}</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" /></div>
              </div>
              <div><Label>{t.cms_page_type}</Label>
                <Select value={form.page_type} onValueChange={v => setForm(p => ({ ...p, page_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t.cms_excerpt}</Label><Textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} /></div>
              <div><Label>{t.cms_content}</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={8} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.cms_meta_title}</Label><Input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} /></div>
                <div><Label>{t.cms_meta_desc}</Label><Input value={form.meta_description} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addPage.mutate()} disabled={!form.title || addPage.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{pages.length}</div><p className="text-sm text-muted-foreground">{t.cms_total_pages}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Globe className="w-6 h-6 mx-auto mb-1 text-green-600" /><div className="text-2xl font-bold">{pages.filter((p: any) => p.status === 'published').length}</div><p className="text-sm text-muted-foreground">{t.cms_published}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Edit className="w-6 h-6 mx-auto mb-1 text-yellow-600" /><div className="text-2xl font-bold">{pages.filter((p: any) => p.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{t.cms_draft}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Eye className="w-6 h-6 mx-auto mb-1 text-blue-600" /><div className="text-2xl font-bold">{pages.filter((p: any) => p.page_type === 'post').length}</div><p className="text-sm text-muted-foreground">{t.cms_posts}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.mod_no_data}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t.cms_page_title}</TableHead><TableHead>{t.cms_slug}</TableHead><TableHead>{t.cms_page_type}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="font-mono text-sm">/{p.slug}</TableCell>
                    <TableCell>{typeLabels[p.page_type] || p.page_type}</TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={v => updateStatus.mutate({ id: p.id, status: v })}>
                        <SelectTrigger className="h-7 w-24"><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></SelectTrigger>
                        <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{p.published_at ? new Date(p.published_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePage.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
