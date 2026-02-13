import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, XCircle, FileText, Send, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function ZatcaSandboxPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [invoiceXml, setInvoiceXml] = useState('');
  const [testType, setTestType] = useState('clearance');
  const [invoiceNo, setInvoiceNo] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['zatca-sandbox', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('zatca_sandbox_tests').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('zatca_sandbox_tests').insert({
        company_id: companyId!, test_name: invoiceNo || `TEST-${logs.length + 1}`,
        invoice_type: testType, request_payload: invoiceXml ? { xml: invoiceXml } : null,
        status: Math.random() > 0.2 ? 'success' : 'error',
        error_message: Math.random() > 0.2 ? null : t.zatca_sb_digital_sig_error,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['zatca-sandbox'] }); toast.success(t.zatca_sb_sent); },
    onError: () => toast.error(t.mod_error),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.zatca_sb_title}</h1><p className="text-muted-foreground">{t.zatca_sb_subtitle}</p></div>
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Shield className="w-3 h-3" />{t.zatca_sb_simulation}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{logs.length}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_tests}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{logs.filter((l: any) => l.status === 'success').length}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_successful}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{logs.filter((l: any) => l.status === 'error').length}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_failed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{logs.length > 0 ? ((logs.filter((l: any) => l.status === 'success').length / logs.length) * 100).toFixed(0) : 0}%</div><p className="text-sm text-muted-foreground">{t.zatca_sb_success_rate}</p></CardContent></Card>
      </div>
      <Tabs defaultValue="test">
        <TabsList><TabsTrigger value="test"><Play className="w-3 h-3 mr-1" />{t.zatca_sb_new_test}</TabsTrigger><TabsTrigger value="logs"><FileText className="w-3 h-3 mr-1" />{t.zatca_sb_logs}</TabsTrigger></TabsList>
        <TabsContent value="test" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">{t.zatca_sb_send_test}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.zatca_sb_operation_type}</Label><Select value={testType} onValueChange={setTestType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="clearance">{t.zatca_sb_clearance}</SelectItem><SelectItem value="reporting">{t.zatca_sb_reporting}</SelectItem><SelectItem value="compliance">Compliance CSID</SelectItem></SelectContent></Select></div>
                <div><Label>{t.zatca_sb_invoice_no}</Label><Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-XXX" /></div>
              </div>
              <div><Label>{t.zatca_sb_xml}</Label><Textarea placeholder={t.zatca_sb_xml_placeholder} value={invoiceXml} onChange={e => setInvoiceXml(e.target.value)} rows={6} className="font-mono text-xs" /></div>
              <Button className="gap-2" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}><Send className="w-4 h-4" />{t.zatca_sb_send}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <Card><CardContent className="pt-6">
            {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : logs.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.zatca_sb_no_tests}</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t.zatca_sb_type}</TableHead><TableHead>{t.zatca_sb_name}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.description}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell><Badge variant="outline">{l.invoice_type}</Badge></TableCell>
                      <TableCell className="font-mono">{l.test_name}</TableCell>
                      <TableCell>{new Date(l.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                      <TableCell><Badge variant={l.status === 'success' ? 'default' : 'destructive'}>{l.status === 'success' ? t.zatca_sb_status_success : t.zatca_sb_status_error}</Badge></TableCell>
                      <TableCell className="text-sm">{l.error_message || t.zatca_sb_success_msg}</TableCell>
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