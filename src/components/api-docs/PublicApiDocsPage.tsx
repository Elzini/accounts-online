import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Code2, ChevronDown, Copy, ExternalLink, Lock, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: Record<string, any>;
  response?: Record<string, any>;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500',
  POST: 'bg-blue-500',
  PUT: 'bg-amber-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500',
};

const API_GROUPS: Record<string, { label: string; endpoints: ApiEndpoint[] }> = {
  auth: {
    label: 'المصادقة',
    endpoints: [
      {
        method: 'POST', path: '/auth/token', summary: 'الحصول على رمز الوصول',
        description: 'استخدم مفتاح API للحصول على رمز JWT للمصادقة',
        auth: false,
        body: { api_key: 'your-api-key-here' },
        response: { access_token: 'eyJhbG...', expires_in: 3600, token_type: 'Bearer' },
      },
    ],
  },
  customers: {
    label: 'العملاء',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/customers', summary: 'قائمة العملاء',
        description: 'استرجاع قائمة العملاء مع الفلترة والترقيم',
        auth: true,
        params: [
          { name: 'page', type: 'number', required: false, description: 'رقم الصفحة (افتراضي: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'عدد النتائج (افتراضي: 25، أقصى: 100)' },
          { name: 'search', type: 'string', required: false, description: 'بحث بالاسم أو الهاتف' },
        ],
        response: { data: [{ id: 'uuid', name: 'أحمد', phone: '05xx', balance: 0 }], total: 100, page: 1 },
      },
      {
        method: 'POST', path: '/api/v1/customers', summary: 'إنشاء عميل',
        description: 'إضافة عميل جديد',
        auth: true,
        body: { name: 'أحمد محمد', phone: '0512345678', tax_number: '300000000000003' },
        response: { id: 'uuid', name: 'أحمد محمد', created_at: '2024-01-01T00:00:00Z' },
      },
      {
        method: 'GET', path: '/api/v1/customers/:id', summary: 'تفاصيل عميل',
        description: 'استرجاع تفاصيل عميل محدد',
        auth: true,
        params: [{ name: 'id', type: 'uuid', required: true, description: 'معرف العميل' }],
        response: { id: 'uuid', name: 'أحمد', phone: '05xx', balance: 1500, invoices_count: 12 },
      },
    ],
  },
  invoices: {
    label: 'الفواتير',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/invoices', summary: 'قائمة الفواتير',
        description: 'استرجاع الفواتير مع الفلترة بالتاريخ والحالة',
        auth: true,
        params: [
          { name: 'status', type: 'string', required: false, description: 'draft | issued | paid | cancelled' },
          { name: 'from_date', type: 'date', required: false, description: 'تاريخ البداية (YYYY-MM-DD)' },
          { name: 'to_date', type: 'date', required: false, description: 'تاريخ النهاية' },
          { name: 'customer_id', type: 'uuid', required: false, description: 'فلتر بالعميل' },
        ],
        response: { data: [{ id: 'uuid', invoice_number: 'INV-001', total: 1150, status: 'issued' }], total: 50 },
      },
      {
        method: 'POST', path: '/api/v1/invoices', summary: 'إنشاء فاتورة',
        description: 'إنشاء فاتورة بيع جديدة',
        auth: true,
        body: {
          customer_id: 'uuid', items: [{ item_id: 'uuid', quantity: 2, unit_price: 500 }],
          discount: 0, notes: 'ملاحظات',
        },
        response: { id: 'uuid', invoice_number: 'INV-002', total: 1150, status: 'draft' },
      },
    ],
  },
  inventory: {
    label: 'المخزون',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/items', summary: 'قائمة الأصناف',
        description: 'استرجاع أصناف المخزون مع الكميات',
        auth: true,
        params: [
          { name: 'category', type: 'string', required: false, description: 'فلتر بالتصنيف' },
          { name: 'low_stock', type: 'boolean', required: false, description: 'فقط الأصناف تحت الحد الأدنى' },
        ],
        response: { data: [{ id: 'uuid', item_name: 'قلم', item_code: 'PEN01', quantity_on_hand: 50, selling_price: 5 }] },
      },
      {
        method: 'PATCH', path: '/api/v1/items/:id/stock', summary: 'تعديل الكمية',
        description: 'تعديل كمية المخزون (إضافة أو سحب)',
        auth: true,
        body: { adjustment: 10, reason: 'استلام بضاعة' },
        response: { new_quantity: 60, adjustment: 10 },
      },
    ],
  },
  reports: {
    label: 'التقارير',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/reports/sales', summary: 'تقرير المبيعات',
        description: 'ملخص المبيعات لفترة محددة',
        auth: true,
        params: [
          { name: 'from_date', type: 'date', required: true, description: 'تاريخ البداية' },
          { name: 'to_date', type: 'date', required: true, description: 'تاريخ النهاية' },
        ],
        response: { total_sales: 150000, total_tax: 22500, invoices_count: 45, top_items: [] },
      },
      {
        method: 'GET', path: '/api/v1/reports/trial-balance', summary: 'ميزان المراجعة',
        description: 'ميزان المراجعة لفترة مالية محددة',
        auth: true,
        params: [{ name: 'fiscal_year_id', type: 'uuid', required: false, description: 'السنة المالية' }],
        response: { accounts: [{ code: '1101', name: 'الصندوق', debit: 50000, credit: 30000 }] },
      },
    ],
  },
};

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <Button
        variant="ghost" size="icon"
        className="absolute top-2 left-2 h-6 w-6"
        onClick={() => { navigator.clipboard.writeText(code); toast.success('تم النسخ'); }}
      >
        <Copy className="w-3 h-3" />
      </Button>
      <pre className="bg-muted rounded-lg p-3 text-sm overflow-x-auto" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <Badge className={`${METHOD_COLORS[endpoint.method]} text-white font-mono text-xs min-w-16`}>
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono flex-1 text-right" dir="ltr">{endpoint.path}</code>
          <span className="text-sm text-muted-foreground">{endpoint.summary}</span>
          {endpoint.auth && <Lock className="w-4 h-4 text-muted-foreground" />}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">المعاملات (Parameters)</h4>
              <div className="space-y-1">
                {endpoint.params.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{p.name}</code>
                    <Badge variant="outline" className="text-xs">{p.type}</Badge>
                    {p.required && <Badge variant="destructive" className="text-xs">مطلوب</Badge>}
                    <span className="text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.body && (
            <div>
              <h4 className="text-sm font-medium mb-2">جسم الطلب (Request Body)</h4>
              <CodeBlock code={JSON.stringify(endpoint.body, null, 2)} />
            </div>
          )}

          {endpoint.response && (
            <div>
              <h4 className="text-sm font-medium mb-2">الاستجابة (Response)</h4>
              <CodeBlock code={JSON.stringify(endpoint.response, null, 2)} />
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">مثال cURL</h4>
            <CodeBlock
              language="bash"
              code={`curl -X ${endpoint.method} \\
  "https://api.elzini.com${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"${endpoint.body ? ` \\
  -d '${JSON.stringify(endpoint.body)}'` : ''}`}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PublicApiDocsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="w-6 h-6" />
          توثيق API المطورين
        </h1>
        <p className="text-muted-foreground">واجهة برمجة التطبيقات RESTful للتكامل مع الأنظمة الخارجية</p>
      </div>

      {/* Auth Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> المصادقة</CardTitle>
          <CardDescription>جميع الطلبات تتطلب رمز وصول Bearer Token</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-2">الخطوة 1: أنشئ مفتاح API من الإعدادات → مفاتيح API</p>
            <p className="font-medium mb-2">الخطوة 2: استخدم المفتاح للحصول على رمز وصول</p>
            <CodeBlock code={`POST /auth/token
Content-Type: application/json

{
  "api_key": "your-api-key-here"
}

// Response:
{
  "access_token": "eyJhbG...",
  "expires_in": 3600
}`} />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-2">الخطوة 3: أرفق الرمز مع كل طلب</p>
            <CodeBlock code={`Authorization: Bearer eyJhbG...`} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg border">
              <p className="text-lg font-bold text-primary">100</p>
              <p className="text-xs text-muted-foreground">طلب/دقيقة</p>
            </div>
            <div className="p-2 rounded-lg border">
              <p className="text-lg font-bold text-primary">JSON</p>
              <p className="text-xs text-muted-foreground">صيغة البيانات</p>
            </div>
            <div className="p-2 rounded-lg border">
              <p className="text-lg font-bold text-primary">v1</p>
              <p className="text-xs text-muted-foreground">إصدار API</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Tabs defaultValue="customers">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {Object.entries(API_GROUPS).map(([key, group]) => (
            <TabsTrigger key={key} value={key}>{group.label}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(API_GROUPS).map(([key, group]) => (
          <TabsContent key={key} value={key} className="space-y-2">
            {group.endpoints.map((ep, i) => (
              <EndpointCard key={i} endpoint={ep} />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle>رموز الأخطاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            {[
              { code: 200, desc: 'نجاح' },
              { code: 201, desc: 'تم الإنشاء بنجاح' },
              { code: 400, desc: 'بيانات غير صالحة' },
              { code: 401, desc: 'غير مصرح - رمز الوصول مفقود أو منتهي' },
              { code: 403, desc: 'ممنوع - لا تملك صلاحية' },
              { code: 404, desc: 'غير موجود' },
              { code: 429, desc: 'تجاوز حد الطلبات' },
              { code: 500, desc: 'خطأ داخلي في الخادم' },
            ].map(e => (
              <div key={e.code} className="flex items-center gap-3">
                <Badge variant={e.code < 300 ? 'default' : e.code < 500 ? 'secondary' : 'destructive'}>{e.code}</Badge>
                <span>{e.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
