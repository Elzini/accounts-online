import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, Plus, Trash2, Eye, EyeOff, Globe, Code2, BookOpen, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  permissions: string[];
}

export function ApiManagementPage() {
  const { t, direction, language } = useLanguage();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase as any)
        .from('api_keys')
        .select('id, name, key_preview, is_active, created_at, last_used_at, request_count, permissions')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ApiKey[];
    },
    enabled: !!companyId,
  });

  const generateKey = useMutation({
    mutationFn: async (name: string) => {
      const rawKey = `elk_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const keyPreview = `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`;

      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from('api_keys')
        .insert({
          name,
          key_hash: keyHash,
          key_preview: keyPreview,
          company_id: companyId,
          user_id: user?.id,
          permissions: ['read', 'write'],
        });

      if (error) throw error;
      return rawKey;
    },
    onSuccess: (key) => {
      setGeneratedKey(key);
      setShowKey(true);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success(t.api_toast_generated);
    },
    onError: () => toast.error(t.api_toast_failed),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success(t.api_toast_deleted);
    },
  });

  const toggleKey = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from('api_keys').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-gateway/v1`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.api_toast_copied);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.api_title}</h1>
          <p className="text-muted-foreground">{t.api_subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2"><Key className="w-4 h-4" /> {t.api_tab_keys}</TabsTrigger>
          <TabsTrigger value="docs" className="gap-2"><BookOpen className="w-4 h-4" /> {t.api_tab_docs}</TabsTrigger>
          <TabsTrigger value="examples" className="gap-2"><Code2 className="w-4 h-4" /> {t.api_tab_examples}</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> {t.api_generate_new}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Input
                placeholder={t.api_key_name_placeholder}
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={() => newKeyName && generateKey.mutate(newKeyName)}
                disabled={!newKeyName || generateKey.isPending}
              >
                <Key className="w-4 h-4 me-2" />
                {t.api_generate_btn}
              </Button>
            </CardContent>
          </Card>

          {generatedKey && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-destructive" />
                  <span className="font-bold text-destructive">{t.api_new_key_alert}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.api_copy_warning}
                </p>
                <div className="flex items-center gap-2 bg-background rounded-lg p-3 font-mono text-sm">
                  <code className="flex-1 break-all">{showKey ? generatedKey : '••••••••••••••••••••'}</code>
                  <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t.api_active_keys}</CardTitle>
              <CardDescription>{apiKeys.length} {t.api_requests_count}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">{t.loading}</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t.api_no_keys}</p>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? t.active : t.inactive}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>🔑 {key.key_preview}</span>
                          <span>📊 {key.request_count} {t.api_requests_count}</span>
                          {key.last_used_at && <span>⏱️ {t.api_last_used}: {new Date(key.last_used_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKey.mutate({ id: key.id, active: !key.is_active })}
                        >
                          {key.is_active ? t.api_disable : t.api_enable}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteKey.mutate(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-6" dir="ltr">
          <Card>
            <CardHeader>
              <CardTitle>{t.api_documentation}</CardTitle>
              <CardDescription>Elzini Public REST API v1</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h3>{t.api_base_url}</h3>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <code className="text-sm flex-1">{baseUrl}</code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(baseUrl)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <h3>{t.api_authentication}</h3>
              <p>Include your API key in the request headers:</p>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`x-api-key: elk_your_api_key_here`}
              </pre>
              <p>Or use a Bearer token (JWT from user login):</p>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`Authorization: Bearer your_jwt_token`}
              </pre>

              <h3>{t.api_resources}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['customers', 'suppliers', 'cars', 'sales', 'journal-entries', 'account-categories', 'expenses', 'vouchers', 'fiscal-years', 'employees'].map(r => (
                  <Badge key={r} variant="outline" className="justify-center py-1">{r}</Badge>
                ))}
              </div>

              <h3>{t.api_pagination}</h3>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`GET /customers?page=1&limit=50&order_by=created_at&order_dir=desc`}
              </pre>

              <h3>{t.api_methods}</h3>
              <table className="w-full">
                <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><Badge>GET</Badge></td><td><code>/{'{resource}'}</code></td><td>List all records</td></tr>
                  <tr><td><Badge>GET</Badge></td><td><code>/{'{resource}'}/{'{id}'}</code></td><td>Get single record</td></tr>
                  <tr><td><Badge variant="secondary">POST</Badge></td><td><code>/{'{resource}'}</code></td><td>Create record</td></tr>
                  <tr><td><Badge variant="outline">PUT</Badge></td><td><code>/{'{resource}'}/{'{id}'}</code></td><td>Update record</td></tr>
                  <tr><td><Badge variant="destructive">DELETE</Badge></td><td><code>/{'{resource}'}/{'{id}'}</code></td><td>Delete record</td></tr>
                </tbody>
              </table>

              <h3>{t.api_response_format}</h3>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="mt-6 space-y-4" dir="ltr">
          <Card>
            <CardHeader>
              <CardTitle>{t.api_tab_examples}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">List Customers</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`curl -H "x-api-key: elk_your_key" \\
  "${baseUrl}/customers?page=1&limit=10"`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Create a Customer</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`curl -X POST \\
  -H "x-api-key: elk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "أحمد محمد", "phone": "0501234567"}' \\
  "${baseUrl}/customers"`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">JavaScript / Fetch</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('${baseUrl}/customers', {
  headers: { 'x-api-key': 'elk_your_key' }
});
const { data, pagination } = await response.json();`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Python</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`import requests

response = requests.get(
    '${baseUrl}/customers',
    headers={'x-api-key': 'elk_your_key'}
)
data = response.json()`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
