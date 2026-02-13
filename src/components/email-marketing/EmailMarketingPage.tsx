import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Trash2, Mail, Users, Send, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function EmailMarketingPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', subject: '', body: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', list_name: '' });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['email-campaigns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_campaigns').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['email-contacts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_contacts').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('email_campaigns').insert({
        company_id: companyId!, name: campaignForm.name, subject: campaignForm.subject, body: campaignForm.body, status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-campaigns'] }); toast.success(t.em_campaign_created); setShowAddCampaign(false); setCampaignForm({ name: '', subject: '', body: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('email_contacts').insert({
        company_id: companyId!, email: contactForm.email, name: contactForm.name, list_name: contactForm.list_name || 'default',
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-contacts'] }); toast.success(t.em_contact_added); setShowAddContact(false); setContactForm({ name: '', email: '', list_name: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('email_campaigns').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-campaigns'] }); toast.success(t.mod_deleted); },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('email_contacts').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-contacts'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-foreground">{t.em_title}</h1><p className="text-muted-foreground">{t.em_subtitle}</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Mail className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{campaigns.length}</div><p className="text-sm text-muted-foreground">{t.em_total_campaigns}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{contacts.length}</div><p className="text-sm text-muted-foreground">{t.em_total_contacts}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Send className="w-6 h-6 mx-auto mb-1 text-green-600" /><div className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'sent').length}</div><p className="text-sm text-muted-foreground">{t.em_sent_campaigns}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-6 h-6 mx-auto mb-1 text-blue-600" /><div className="text-2xl font-bold">{campaigns.reduce((s: number, c: any) => s + (c.opened_count || 0), 0)}</div><p className="text-sm text-muted-foreground">{t.em_total_opens}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList><TabsTrigger value="campaigns">{t.em_campaigns}</TabsTrigger><TabsTrigger value="contacts">{t.em_contacts}</TabsTrigger></TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div>
            <Dialog open={showAddCampaign} onOpenChange={setShowAddCampaign}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.em_new_campaign}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t.em_new_campaign}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>{t.name}</Label><Input value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>{t.em_subject}</Label><Input value={campaignForm.subject} onChange={e => setCampaignForm(p => ({ ...p, subject: e.target.value }))} /></div>
                  <div><Label>{t.em_body}</Label><Textarea value={campaignForm.body} onChange={e => setCampaignForm(p => ({ ...p, body: e.target.value }))} rows={5} /></div>
                  <Button className="w-full" onClick={() => addCampaign.mutate()} disabled={!campaignForm.name || addCampaign.isPending}>{t.save}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-4">
            {loadingCampaigns ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : campaigns.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.mod_no_data}</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.em_subject}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.em_recipients}</TableHead><TableHead>{t.em_opens}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {campaigns.filter((c: any) => c.name?.includes(search)).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.subject || '-'}</TableCell>
                      <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell>{c.recipients_count || 0}</TableCell>
                      <TableCell>{c.opened_count || 0}</TableCell>
                      <TableCell>
                        {c.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCampaign.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} className="max-w-xs" /></div>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.em_add_contact}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t.em_add_contact}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>{t.name}</Label><Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>{t.email}</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><Label>{t.em_list}</Label><Input value={contactForm.list_name} onChange={e => setContactForm(p => ({ ...p, list_name: e.target.value }))} placeholder="default" /></div>
                  <Button className="w-full" onClick={() => addContact.mutate()} disabled={!contactForm.email || addContact.isPending}>{t.save}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-4">
            {loadingContacts ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : contacts.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.mod_no_data}</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.email}</TableHead><TableHead>{t.em_list}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contacts.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name || '-'}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.list_name}</TableCell>
                      <TableCell><Badge variant={c.is_subscribed ? 'default' : 'secondary'}>{c.is_subscribed ? t.em_subscribed : t.em_unsubscribed}</Badge></TableCell>
                      <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteContact.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
