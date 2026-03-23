import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Send, FileText, Bell, Phone, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const MESSAGE_TEMPLATES = {
  invoice_reminder: {
    ar: 'مرحباً {name}، نود تذكيركم بأن الفاتورة رقم {invoice_number} بمبلغ {amount} ريال مستحقة بتاريخ {due_date}. يرجى المبادرة بالسداد. شكراً لتعاملكم معنا.',
    en: 'Hello {name}, this is a reminder that invoice #{invoice_number} for {amount} SAR is due on {due_date}. Please arrange payment. Thank you.',
  },
  payment_received: {
    ar: 'مرحباً {name}، نفيدكم باستلام دفعة بمبلغ {amount} ريال. رصيدكم الحالي: {balance} ريال. شكراً لكم.',
    en: 'Hello {name}, we confirm receipt of payment of {amount} SAR. Current balance: {balance} SAR. Thank you.',
  },
  statement: {
    ar: 'مرحباً {name}، مرفق كشف حسابكم حتى تاريخ {date}. إجمالي المستحق: {balance} ريال. للاستفسار تواصل معنا.',
    en: 'Hello {name}, attached is your account statement as of {date}. Total due: {balance} SAR. Contact us for inquiries.',
  },
  overdue: {
    ar: '⚠️ تنبيه: الفاتورة رقم {invoice_number} بمبلغ {amount} ريال متأخرة عن السداد بـ {days} يوم. يرجى السداد العاجل لتجنب أي إجراءات إضافية.',
    en: '⚠️ Alert: Invoice #{invoice_number} for {amount} SAR is overdue by {days} days. Please arrange urgent payment.',
  },
};

export function WhatsAppIntegration() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const companyId = useCompanyId();
  const [selectedTemplate, setSelectedTemplate] = useState('invoice_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['whatsapp-customers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('company_id', companyId)
        .not('phone', 'is', null)
        .order('name');
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['whatsapp-suppliers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('suppliers')
        .select('id, name, phone')
        .eq('company_id', companyId)
        .not('phone', 'is', null)
        .order('name');
      return data || [];
    },
    enabled: !!companyId,
  });

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
    if (cleaned.startsWith('5')) cleaned = '966' + cleaned;
    if (!cleaned.startsWith('+') && !cleaned.startsWith('966')) cleaned = '966' + cleaned;
    cleaned = cleaned.replace('+', '');
    return cleaned;
  };

  const getWhatsAppUrl = (phone: string, message: string) => {
    const formattedPhone = formatPhone(phone);
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const sendWhatsApp = (phone: string, message: string) => {
    window.open(getWhatsAppUrl(phone, message), '_blank');
  };

  const getTemplateText = () => {
    const templates = MESSAGE_TEMPLATES[selectedTemplate as keyof typeof MESSAGE_TEMPLATES];
    return templates ? templates[isRtl ? 'ar' : 'en'] : '';
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(getTemplateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(isRtl ? 'تم نسخ القالب' : 'Template copied');
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <MessageSquare className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{isRtl ? 'تكامل واتساب' : 'WhatsApp Integration'}</h2>
          <p className="text-sm text-muted-foreground">{isRtl ? 'إرسال إشعارات وتذكيرات عبر واتساب' : 'Send notifications and reminders via WhatsApp'}</p>
        </div>
      </div>

      <Tabs defaultValue="quick-send">
        <TabsList>
          <TabsTrigger value="quick-send">{isRtl ? 'إرسال سريع' : 'Quick Send'}</TabsTrigger>
          <TabsTrigger value="templates">{isRtl ? 'القوالب' : 'Templates'}</TabsTrigger>
          <TabsTrigger value="contacts">{isRtl ? 'جهات الاتصال' : 'Contacts'}</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-send">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isRtl ? 'إرسال رسالة' : 'Send Message'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="05XXXXXXXX" dir="ltr" />
                </div>
                <div>
                  <Label>{isRtl ? 'اختر قالب' : 'Select Template'}</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice_reminder">{isRtl ? 'تذكير فاتورة' : 'Invoice Reminder'}</SelectItem>
                      <SelectItem value="payment_received">{isRtl ? 'تأكيد سداد' : 'Payment Received'}</SelectItem>
                      <SelectItem value="statement">{isRtl ? 'كشف حساب' : 'Statement'}</SelectItem>
                      <SelectItem value="overdue">{isRtl ? 'تنبيه تأخر' : 'Overdue Alert'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRtl ? 'الرسالة' : 'Message'}</Label>
                  <Textarea 
                    value={customMessage || getTemplateText()} 
                    onChange={(e) => setCustomMessage(e.target.value)} 
                    rows={5} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => sendWhatsApp(phoneNumber, customMessage || getTemplateText())}
                    disabled={!phoneNumber}
                  >
                    <Send className="h-4 w-4 me-2" />
                    {isRtl ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
                  </Button>
                  <Button variant="outline" onClick={copyTemplate}>
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isRtl ? 'إرسال سريع للعملاء' : 'Quick Send to Customers'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {customers.slice(0, 20).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-600"
                        onClick={() => sendWhatsApp(c.phone, getTemplateText().replace('{name}', c.name))}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MESSAGE_TEMPLATES).map(([key, templates]) => {
              const labels: Record<string, { ar: string; en: string }> = {
                invoice_reminder: { ar: 'تذكير فاتورة', en: 'Invoice Reminder' },
                payment_received: { ar: 'تأكيد سداد', en: 'Payment Received' },
                statement: { ar: 'كشف حساب', en: 'Account Statement' },
                overdue: { ar: 'تنبيه تأخر', en: 'Overdue Alert' },
              };
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {labels[key]?.[isRtl ? 'ar' : 'en'] || key}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{templates[isRtl ? 'ar' : 'en']}</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                      navigator.clipboard.writeText(templates[isRtl ? 'ar' : 'en']);
                      toast.success(isRtl ? 'تم النسخ' : 'Copied');
                    }}>
                      <Copy className="h-3 w-3 me-1" /> {isRtl ? 'نسخ' : 'Copy'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">{isRtl ? 'العملاء' : 'Customers'}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isRtl ? 'الهاتف' : 'Phone'}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell dir="ltr">{c.phone}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="text-green-600" onClick={() => sendWhatsApp(c.phone, '')}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">{isRtl ? 'الموردين' : 'Suppliers'}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isRtl ? 'الهاتف' : 'Phone'}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell dir="ltr">{s.phone}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="text-green-600" onClick={() => sendWhatsApp(s.phone, '')}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
