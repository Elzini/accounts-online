import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, ExternalLink, MessageSquare, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmsProvider {
  id: string;
  name: string;
  nameAr: string;
  website: string;
  fields: { key: string; label: string; labelAr: string; type?: string }[];
  instructions: string[];
  instructionsAr: string[];
}

const SMS_PROVIDERS: SmsProvider[] = [
  {
    id: 'fourjawaly',
    name: '4Jawaly',
    nameAr: 'فور جوالي',
    website: 'https://www.4jawaly.com',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open 4Jawaly website', 'Purchase credit', 'Specify a sender name', 'Fill in the USERNAME, API KEY and sender name'],
    instructionsAr: ['افتح موقع فور جوالي', 'اشحن رصيد', 'حدد اسم المرسل', 'أدخل اسم المستخدم ومفتاح API واسم المرسل'],
  },
  {
    id: 'alghaddm',
    name: 'Alghaddm',
    nameAr: 'الغد',
    website: 'https://www.alghaddm.com',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Alghaddm website', 'Purchase credit', 'Purchase a phone number or specify a sender name', 'Fill in the AUTH ID, AUTH TOKEN and the phone/name'],
    instructionsAr: ['افتح موقع الغد', 'اشحن رصيد', 'حدد رقم هاتف أو اسم مرسل', 'أدخل معرف المصادقة والتوكن ورقم الهاتف/الاسم'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    nameAr: 'تويليو',
    website: 'https://www.twilio.com',
    fields: [
      { key: 'account_sid', label: 'Account SID', labelAr: 'Account SID' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'auth_token', label: 'Auth Token', labelAr: 'Auth Token' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Twilio Website', 'Purchase credit', 'Purchase a phone number', 'Specify a sender name and verify it with Twilio customer support (Optional)', 'Fill in the ACCOUNT SID, AUTH TOKEN and the phone/name', 'Or you can create an API key from Programmable SMS > Tools > API Keys'],
    instructionsAr: ['افتح موقع Twilio', 'اشحن رصيد', 'اشترِ رقم هاتف', 'حدد اسم مرسل وتحقق منه مع دعم Twilio (اختياري)', 'أدخل ACCOUNT SID و AUTH TOKEN ورقم الهاتف/الاسم', 'أو يمكنك إنشاء مفتاح API من Programmable SMS > Tools > API Keys'],
  },
  {
    id: 'plivo',
    name: 'Plivo',
    nameAr: 'بليفو',
    website: 'https://www.plivo.com',
    fields: [
      { key: 'auth_id', label: 'Auth ID', labelAr: 'Auth ID' },
      { key: 'auth_token', label: 'Auth Token', labelAr: 'Auth Token' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Plivo Website', 'Purchase credit', 'Purchase a phone number', 'Specify a send name and verify it with Plivo customer support (Optional)', 'Fill in the AUTH ID, AUTH TOKEN and the phone/name'],
    instructionsAr: ['افتح موقع Plivo', 'اشحن رصيد', 'اشترِ رقم هاتف', 'حدد اسم مرسل وتحقق منه مع دعم Plivo (اختياري)', 'أدخل AUTH ID و AUTH TOKEN ورقم الهاتف/الاسم'],
  },
  {
    id: 'mobily',
    name: 'Mobily.ws',
    nameAr: 'موبايلي',
    website: 'https://www.mobily.ws',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'password', label: 'Password', labelAr: 'كلمة المرور', type: 'password' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Mobily.ws website', 'Purchase credit', 'Specify a sender name', 'Fill in USERNAME, PASSWORD and sender name'],
    instructionsAr: ['افتح موقع Mobily.ws', 'اشحن رصيد', 'حدد اسم المرسل', 'أدخل اسم المستخدم وكلمة المرور واسم المرسل'],
  },
  {
    id: 'mobilenet',
    name: 'Mobile.net',
    nameAr: 'موبايل نت',
    website: 'https://www.mobile.net.sa',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'password', label: 'Password', labelAr: 'كلمة المرور', type: 'password' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Mobile.net website', 'Purchase credit', 'Fill in USERNAME, PASSWORD and sender name'],
    instructionsAr: ['افتح موقع Mobile.net', 'اشحن رصيد', 'أدخل اسم المستخدم وكلمة المرور واسم المرسل'],
  },
  {
    id: 'hisms',
    name: 'Hi SMS',
    nameAr: 'هاي SMS',
    website: 'https://www.hisms.ws',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'password', label: 'Password', labelAr: 'كلمة المرور', type: 'password' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Hi SMS website', 'Purchase credit', 'Specify a sender name', 'Fill in USERNAME, PASSWORD and sender name'],
    instructionsAr: ['افتح موقع Hi SMS', 'اشحن رصيد', 'حدد اسم المرسل', 'أدخل اسم المستخدم وكلمة المرور واسم المرسل'],
  },
  {
    id: 'hawasms',
    name: 'Hawa SMS',
    nameAr: 'هوا SMS',
    website: 'https://www.hawasms.com',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'password', label: 'Password', labelAr: 'كلمة المرور', type: 'password' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Hawa SMS Website', 'Purchase credit', 'Purchase a phone number or specify a sender name', 'Fill in the AUTH ID, AUTH TOKEN and the phone/name'],
    instructionsAr: ['افتح موقع Hawa SMS', 'اشحن رصيد', 'حدد رقم هاتف أو اسم مرسل', 'أدخل معرف المصادقة والتوكن ورقم الهاتف/الاسم'],
  },
  {
    id: 'jawalbsms',
    name: 'Jawalbsms',
    nameAr: 'جوال بي SMS',
    website: 'https://www.jawalbsms.ws',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Jawalbsms website', 'Purchase credit', 'Fill in USERNAME, API KEY and sender name'],
    instructionsAr: ['افتح موقع Jawalbsms', 'اشحن رصيد', 'أدخل اسم المستخدم ومفتاح API واسم المرسل'],
  },
  {
    id: 'taqnyat',
    name: 'Taqnyat',
    nameAr: 'تقنيات',
    website: 'https://www.taqnyat.sa',
    fields: [
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Taqnyat website', 'Purchase credit', 'Fill in API KEY and sender name'],
    instructionsAr: ['افتح موقع تقنيات', 'اشحن رصيد', 'أدخل مفتاح API واسم المرسل'],
  },
  {
    id: 'msegat',
    name: 'Msegat',
    nameAr: 'مسجات',
    website: 'https://www.msegat.com',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Msegat website', 'Purchase credit', 'Fill in USERNAME, API KEY and sender name'],
    instructionsAr: ['افتح موقع مسجات', 'اشحن رصيد', 'أدخل اسم المستخدم ومفتاح API واسم المرسل'],
  },
  {
    id: 'malath',
    name: 'Malath',
    nameAr: 'ملاذ التميز',
    website: 'https://www.malath.net.sa',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Malath website', 'Purchase credit', 'Fill in USERNAME, API KEY and sender name'],
    instructionsAr: ['افتح موقع ملاذ التميز', 'اشحن رصيد', 'أدخل اسم المستخدم ومفتاح API واسم المرسل'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameAr: 'واتساب',
    website: 'https://business.whatsapp.com',
    fields: [
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API' },
      { key: 'phone_id', label: 'Phone Number ID', labelAr: 'معرف رقم الهاتف' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open WhatsApp Business API', 'Set up a business account', 'Get API Key and Phone Number ID'],
    instructionsAr: ['افتح WhatsApp Business API', 'أنشئ حساب أعمال', 'احصل على مفتاح API ومعرف رقم الهاتف'],
  },
  {
    id: 'mora',
    name: 'Mora Telecom',
    nameAr: 'مورا تيليكوم',
    website: 'https://www.mora.sa',
    fields: [
      { key: 'username', label: 'Username', labelAr: 'اسم المستخدم' },
      { key: 'password', label: 'Password', labelAr: 'كلمة المرور', type: 'password' },
      { key: 'sender', label: 'Sender Name', labelAr: 'من' },
    ],
    instructions: ['Open Mora website', 'Purchase credit', 'Fill in USERNAME, PASSWORD and sender name'],
    instructionsAr: ['افتح موقع Mora', 'اشحن رصيد', 'أدخل اسم المستخدم وكلمة المرور واسم المرسل'],
  },
];

export function SmsProvidersSettings() {
  const { t, language, direction } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<SmsProvider | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: savedConfigs = [] } = useQuery({
    queryKey: ['sms-provider-configs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('sms_provider_configs')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { provider: string; config: Record<string, string>; sender: string }) => {
      if (!companyId) throw new Error('No company');
      const existing = savedConfigs.find((c: any) => c.provider === params.provider);
      if (existing) {
        const { error } = await supabase.from('sms_provider_configs')
          .update({ config: params.config, sender_name: params.sender, is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sms_provider_configs')
          .insert({ company_id: companyId, provider: params.provider, config: params.config, sender_name: params.sender, is_active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-provider-configs'] });
      toast.success(language === 'ar' ? 'تم حفظ إعدادات المزود بنجاح' : 'Provider settings saved successfully');
      setSelectedProvider(null);
    },
    onError: () => toast.error(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings'),
  });

  const isAr = language === 'ar';
  const getConfig = (providerId: string) => savedConfigs.find((c: any) => c.provider === providerId);

  const openProviderConfig = (provider: SmsProvider) => {
    const existing = getConfig(provider.id);
    const existingConfig = (existing?.config as Record<string, string>) || {};
    const data: Record<string, string> = {};
    provider.fields.forEach(f => { data[f.key] = existingConfig[f.key] || ''; });
    setFormData(data);
    setSelectedProvider(provider);
  };

  const handleSave = () => {
    if (!selectedProvider) return;
    const sender = formData.sender || '';
    const config = { ...formData };
    delete config.sender;
    saveMutation.mutate({ provider: selectedProvider.id, config, sender });
  };

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? 'إعدادات الـ SMS' : 'SMS Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'اختر مزود خدمة الرسائل النصية وقم بتكوين حسابك' : 'Select an SMS provider and configure your account'}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {isAr
            ? 'يمكنك إرسال رسائل نصية عبر النظام باستخدام أحد مزودي الرسائل النصية عبر الإنترنت التاليين. الخطوات بسيطة: فقط قم بفتح حساب على أي من مزودي الرسائل النصية التاليين، ثم بتكوين حسابك وشراء رصيد للرسائل النصية، اختر المزود وأدخل بيانات حسابك هنا.'
            : 'You can send SMS messages through the system using any of the following SMS providers. The steps are simple: just open an account with any provider below, configure your account and purchase SMS credit, then select the provider and enter your account details here.'}
        </p>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {SMS_PROVIDERS.map((provider) => {
          const config = getConfig(provider.id);
          const active = config?.is_active;
          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group relative ${active ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => openProviderConfig(provider)}
            >
              <CardContent className="pt-6 pb-4 flex flex-col items-center text-center gap-2">
                <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center text-2xl font-bold text-muted-foreground mb-1">
                  {provider.name.substring(0, 2).toUpperCase()}
                </div>
                <p className="font-semibold text-sm text-foreground">{provider.name}</p>
                {active && (
                  <Badge variant="default" className="text-[10px] px-2 py-0">
                    {isAr ? 'مفعّل' : 'Active'}
                  </Badge>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="default" className="gap-1" onClick={(e) => { e.stopPropagation(); openProviderConfig(provider); }}>
                    <Settings className="w-3 h-3" />
                    {isAr ? 'إعداد' : 'Configure'}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); window.open(provider.website, '_blank'); }}>
                    <ExternalLink className="w-3 h-3" />
                    {isAr ? 'الموقع' : 'Website'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl" dir={direction}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                {selectedProvider?.name}
              </DialogTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedProvider(null)}>
                  {isAr ? 'تغيير المزود' : 'Change Gateway'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-5">
              {/* Instructions */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    {(isAr ? selectedProvider.instructionsAr : selectedProvider.instructions).map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedProvider.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isAr ? field.labelAr : field.label}
                      </Label>
                      <Input
                        type={field.type || 'text'}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                  ))}
                </div>

                {/* Provider Logo placeholder */}
                <div className="flex items-center justify-center">
                  <div className="w-48 h-32 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground/30">
                      {selectedProvider.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending
                  ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                  : (isAr ? 'حفظ' : 'Save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
