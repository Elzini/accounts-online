import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Code, Key, BookOpen, Activity, Copy, Plus, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function DeveloperApiPage() {
  const { t } = useLanguage();
  const [showKey, setShowKey] = useState(false);

  const endpoints = [
    { method: 'GET', path: '/api/v1/customers', description: t.nav_customers || 'Customers List', auth: true, rateLimit: '100/min' },
    { method: 'POST', path: '/api/v1/customers', description: `${t.add} ${t.nav_customers || 'Customer'}`, auth: true, rateLimit: '50/min' },
    { method: 'GET', path: '/api/v1/invoices', description: 'Invoices List', auth: true, rateLimit: '100/min' },
    { method: 'POST', path: '/api/v1/invoices', description: 'Create Invoice', auth: true, rateLimit: '30/min' },
    { method: 'GET', path: '/api/v1/products', description: 'Products List', auth: true, rateLimit: '100/min' },
    { method: 'GET', path: '/api/v1/reports/sales', description: 'Sales Report', auth: true, rateLimit: '20/min' },
    { method: 'GET', path: '/api/v1/journal-entries', description: 'Journal Entries', auth: true, rateLimit: '50/min' },
    { method: 'POST', path: '/api/v1/webhooks', description: 'Register Webhook', auth: true, rateLimit: '10/min' },
  ];

  const webhooks = [
    { id: '1', event: 'invoice.created', url: 'https://example.com/webhook/invoices', status: 'active', lastTriggered: '2024-01-18 14:30' },
    { id: '2', event: 'payment.received', url: 'https://example.com/webhook/payments', status: 'active', lastTriggered: '2024-01-17 10:15' },
    { id: '3', event: 'customer.updated', url: 'https://example.com/webhook/customers', status: 'inactive', lastTriggered: null },
  ];

  const methodColors: Record<string, string> = { GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', PUT: 'bg-yellow-100 text-yellow-800', DELETE: 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.dev_api_title}</h1><p className="text-muted-foreground">{t.dev_api_subtitle}</p></div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info(t.dev_api_docs)}><ExternalLink className="w-4 h-4" />{t.dev_api_docs}</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4" />{t.dev_api_key}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={showKey ? 'sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' : '••••••••••••••••••••••••••••••••••••'} readOnly className="font-mono text-sm" />
            <Button size="icon" variant="ghost" onClick={() => setShowKey(!showKey)}>{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
            <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText('sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'); toast.success(t.dev_api_copied); }}><Copy className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm"><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints" className="gap-1"><Code className="w-3 h-3" />{t.dev_api_endpoints}</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1"><Activity className="w-3 h-3" />{t.dev_api_webhooks}</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1"><BookOpen className="w-3 h-3" />{t.dev_api_examples}</TabsTrigger>
        </TabsList>
        <TabsContent value="endpoints" className="mt-4">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead className="w-20">{t.dev_api_method}</TableHead><TableHead>{t.dev_api_path}</TableHead><TableHead>{t.dev_api_description}</TableHead><TableHead>{t.dev_api_rate_limit}</TableHead></TableRow></TableHeader>
              <TableBody>
                {endpoints.map((ep, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge className={methodColors[ep.method]}>{ep.method}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{ep.path}</TableCell>
                    <TableCell>{ep.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ep.rateLimit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.dev_api_registered_webhooks}</CardTitle>
              <Button size="sm" className="gap-1"><Plus className="w-3 h-3" />{t.dev_api_add_webhook}</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t.dev_api_event}</TableHead><TableHead>{t.dev_api_url}</TableHead><TableHead>{t.dev_api_last_triggered}</TableHead><TableHead>{t.status}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {webhooks.map(wh => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-mono text-sm">{wh.event}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{wh.url}</TableCell>
                      <TableCell>{wh.lastTriggered || '-'}</TableCell>
                      <TableCell><Badge variant={wh.status === 'active' ? 'default' : 'secondary'}>{wh.status === 'active' ? t.dev_api_webhook_active : t.dev_api_webhook_inactive}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t.dev_api_example_title}</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto" dir="ltr">{`curl -X GET "https://api.example.com/v1/customers" \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json"

// Response
{
  "data": [
    {
      "id": "cust_123",
      "name": "Tech Company",
      "email": "info@tech.sa",
      "phone": "+966512345678",
      "balance": 25000
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20
  }
}`}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}