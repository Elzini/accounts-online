import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Shield, CheckCircle, FileText, Server, Lock, Code, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useZatcaConfig } from '@/hooks/useZatcaIntegration';

export function ZatcaTechnicalDocPage() {
  const { direction } = useLanguage();
  const { data: taxSettings } = useTaxSettings();
  const { data: zatcaConfig } = useZatcaConfig();

  const generateDocHTML = () => {
    const companyName = taxSettings?.company_name_ar || '[اسم المنشأة]';
    const vatNumber = taxSettings?.tax_number || '[الرقم الضريبي]';
    const crNumber = taxSettings?.commercial_register || '[السجل التجاري]';
    const env = zatcaConfig?.environment || 'sandbox';

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>الوثيقة التقنية - ${companyName} - اعتماد مزود حلول ZATCA</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; line-height: 1.8; color: #1a1a1a; direction: rtl; }
  h1 { color: #1a5276; border-bottom: 3px solid #2980b9; padding-bottom: 10px; }
  h2 { color: #2c3e50; margin-top: 30px; border-right: 4px solid #2980b9; padding-right: 12px; }
  h3 { color: #34495e; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
  th { background: #2980b9; color: white; }
  tr:nth-child(even) { background: #f8f9fa; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  .badge-green { background: #d5f5e3; color: #1e8449; }
  .badge-blue { background: #d6eaf8; color: #1a5276; }
  .code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; direction: ltr; display: inline-block; }
  .section { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; border: 1px solid #e8e8e8; }
  .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .stamp { border: 2px solid #2980b9; padding: 15px; text-align: center; border-radius: 8px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header-info">
  <div>
    <h1>📋 الوثيقة التقنية لاعتماد مزود حلول الفوترة الإلكترونية</h1>
    <p><strong>اسم المنشأة:</strong> ${companyName}</p>
    <p><strong>الرقم الضريبي:</strong> ${vatNumber}</p>
    <p><strong>السجل التجاري:</strong> ${crNumber}</p>
    <p><strong>تاريخ الإعداد:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
  </div>
</div>

<h2>1. نظرة عامة على الحل</h2>
<div class="section">
  <table>
    <tr><th>البند</th><th>التفاصيل</th></tr>
    <tr><td>اسم الحل</td><td>Elzini ERP - نظام إدارة الأعمال المتكامل</td></tr>
    <tr><td>الإصدار</td><td>7.0</td></tr>
    <tr><td>نوع الحل</td><td>SaaS (خدمة سحابية)</td></tr>
    <tr><td>البنية التحتية</td><td>Cloud-native مع عزل كامل للمستأجرين</td></tr>
    <tr><td>التقنيات</td><td>React, TypeScript, Supabase (PostgreSQL), Edge Functions (Deno)</td></tr>
    <tr><td>التشفير</td><td>AES-256-GCM للبيانات الحساسة + ECDSA P-256 للتوقيع الرقمي</td></tr>
    <tr><td>الاستضافة</td><td>Lovable Cloud (مراكز بيانات متوافقة مع متطلبات حماية البيانات)</td></tr>
  </table>
</div>

<h2>2. التوافق مع متطلبات ZATCA المرحلة الثانية</h2>

<h3>2.1 معيار الفوترة الإلكترونية</h3>
<div class="section">
  <table>
    <tr><th>المتطلب</th><th>التنفيذ</th><th>الحالة</th></tr>
    <tr><td>UBL 2.1 XML Format</td><td>توليد فواتير XML كاملة التوافق مع مواصفات UBL 2.1</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Invoice Type Codes</td><td>388 (فاتورة ضريبية)، 381 (إشعار دائن)، 383 (إشعار مدين)</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Standard vs Simplified</td><td>0100000 (قياسية B2B) و 0200000 (مبسطة B2C)</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Tax Category</td><td>S (Standard Rate)، VAT scheme</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Document Currency</td><td>SAR (مع دعم عملات إضافية)</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Payment Means Codes</td><td>10 (نقدي)، 42 (تحويل)، 30 (حوالة)</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>JSON Format Support</td><td>تصدير JSON متوازي مع كل حقول UBL 2.1</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
  </table>
</div>

<h3>2.2 التوقيع الرقمي والتشفير</h3>
<div class="section">
  <table>
    <tr><th>المتطلب</th><th>التنفيذ</th><th>الحالة</th></tr>
    <tr><td>ECDSA P-256 Key Generation</td><td>Web Crypto API - توليد مفاتيح secp256r1</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>SHA-256 Invoice Hashing</td><td>crypto.subtle.digest مع إخراج Hex و Base64</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Digital Signature (ECDSA)</td><td>توقيع رقمي كامل مع التحقق (sign + verify)</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>CSR Generation</td><td>توليد طلب توقيع شهادة مع جميع حقول ZATCA المطلوبة</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Key Export (PEM)</td><td>PKCS#8 (خاص) + SPKI (عام) بتنسيق PEM</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
    <tr><td>Previous Invoice Hash (PIH)</td><td>ربط تسلسلي ديناميكي بين الفواتير</td><td><span class="badge badge-green">✅ مكتمل</span></td></tr>
  </table>
</div>

<h3>2.3 رمز الاستجابة السريعة (QR Code)</h3>
<div class="section">
  <table>
    <tr><th>Tag</th><th>الوصف</th><th>التنسيق</th><th>الحالة</th></tr>
    <tr><td>1</td><td>اسم البائع</td><td>UTF-8</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>2</td><td>الرقم الضريبي</td><td>15 رقم يبدأ بـ 3</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>3</td><td>التاريخ والوقت</td><td>yyyy-MM-ddTHH:mm:ssZ</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>4</td><td>إجمالي الفاتورة</td><td>رقمي (منزلتين)</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>5</td><td>مبلغ الضريبة</td><td>رقمي (منزلتين)</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>6</td><td>Hash الفاتورة</td><td>SHA-256 Base64</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>7</td><td>التوقيع الرقمي</td><td>ECDSA Base64</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>8</td><td>المفتاح العام</td><td>ECDSA Public Key</td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>9</td><td>توقيع الشهادة</td><td>Certificate Sig</td><td><span class="badge badge-green">✅</span></td></tr>
  </table>
  <p>الترميز: TLV (Tag-Length-Value) → Base64 وفق مواصفات ZATCA</p>
</div>

<h3>2.4 واجهات التكامل (APIs)</h3>
<div class="section">
  <table>
    <tr><th>العملية</th><th>Endpoint</th><th>الحالة</th></tr>
    <tr><td>الحصول على Compliance CSID</td><td><span class="code">/compliance</span></td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>فحص التوافق</td><td><span class="code">/compliance/invoices</span></td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>إرسال فاتورة مبسطة (Reporting)</td><td><span class="code">/invoices/reporting/single</span></td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>اعتماد فاتورة قياسية (Clearance)</td><td><span class="code">/invoices/clearance/single</span></td><td><span class="badge badge-green">✅</span></td></tr>
    <tr><td>الحصول على Production CSID</td><td><span class="code">/production/csids</span></td><td><span class="badge badge-green">✅</span></td></tr>
  </table>
  <p>البيئات المدعومة: Sandbox، Simulation، Production</p>
  <p>المصادقة: Basic Auth (CSID:Secret) مع Accept-Version V2</p>
</div>

<h2>3. البنية الأمنية</h2>
<div class="section">
  <table>
    <tr><th>الطبقة</th><th>التنفيذ</th></tr>
    <tr><td>عزل المستأجرين</td><td>نطاقات فرعية مستقلة + أنظمة قاعدة بيانات منفصلة لكل مستأجر</td></tr>
    <tr><td>التشفير أثناء النقل</td><td>TLS 1.3 لجميع الاتصالات</td></tr>
    <tr><td>التشفير أثناء التخزين</td><td>AES-256-GCM للحقول الحساسة (IBAN، أرقام الهوية)</td></tr>
    <tr><td>إدارة المفاتيح</td><td>سجل مفاتيح التشفير مع دعم التدوير التلقائي (BYOK)</td></tr>
    <tr><td>التحكم بالوصول</td><td>Row Level Security (RLS) على جميع الجداول</td></tr>
    <tr><td>سجل المراجعة</td><td>تسجيل غير قابل للتعديل مع ربط تسلسلي (Hash Chain)</td></tr>
    <tr><td>اختبار الاختراق</td><td>فحص آلي من 10 نقاط لعزل المستأجرين</td></tr>
  </table>
</div>

<h2>4. البنية التقنية للفوترة الإلكترونية</h2>
<div class="section">
  <pre style="direction:ltr;text-align:left;background:#f4f4f4;padding:15px;border-radius:8px;font-size:12px;overflow-x:auto;">
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/TS)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ XML Gen  │  │ QR Gen   │  │ CSR Gen  │  │ Signing │ │
│  │ (UBL2.1) │  │ (TLV)    │  │ (ECDSA)  │  │ (SHA256)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┴─────────────┴─────────────┘      │
│                          │                               │
├──────────────────────────┼───────────────────────────────┤
│                    Edge Functions                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              zatca-api (Deno)                     │   │
│  │  • Compliance CSID     • Clearance               │   │
│  │  • Reporting           • Production CSID          │   │
│  └──────────────────────────┬───────────────────────┘   │
├─────────────────────────────┼───────────────────────────┤
│                    ZATCA Gateway                        │
│  • Sandbox:    gw-fatoora.zatca.gov.sa/developer-portal │
│  • Simulation: gw-fatoora.zatca.gov.sa/simulation       │
│  • Production: gw-fatoora.zatca.gov.sa/core             │
└─────────────────────────────────────────────────────────┘
  </pre>
</div>

<h2>5. اختبارات التوافق</h2>
<div class="section">
  <table>
    <tr><th>رمز الاختبار</th><th>الوصف</th><th>نوع العملية</th></tr>
    <tr><td>STD-001</td><td>فاتورة ضريبية قياسية (B2B)</td><td>Clearance</td></tr>
    <tr><td>STD-002</td><td>إشعار دائن قياسي</td><td>Clearance</td></tr>
    <tr><td>STD-003</td><td>إشعار مدين قياسي</td><td>Clearance</td></tr>
    <tr><td>SIM-001</td><td>فاتورة ضريبية مبسطة (B2C)</td><td>Reporting</td></tr>
    <tr><td>SIM-002</td><td>إشعار دائن مبسط</td><td>Reporting</td></tr>
    <tr><td>SIM-003</td><td>إشعار مدين مبسط</td><td>Reporting</td></tr>
  </table>
  <p>البيئة الحالية: <span class="badge badge-blue">${env}</span></p>
</div>

<h2>6. معلومات الاتصال</h2>
<div class="section">
  <p><strong>المنشأة:</strong> ${companyName}</p>
  <p><strong>الرقم الضريبي:</strong> ${vatNumber}</p>
  <p><strong>السجل التجاري:</strong> ${crNumber}</p>
</div>

<div class="stamp">
  <p><strong>تم إعداد هذه الوثيقة آلياً بواسطة نظام Elzini ERP</strong></p>
  <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')} | الإصدار: 7.0</p>
</div>
</body>
</html>`;

    return html;
  };

  const downloadDoc = () => {
    const html = generateDocHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZATCA-Technical-Document-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printDoc = () => {
    const html = generateDocHTML();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const features = [
    { icon: Code, title: 'XML UBL 2.1', desc: 'توليد فواتير XML متوافقة بالكامل مع معيار UBL 2.1' },
    { icon: Lock, title: 'ECDSA P-256', desc: 'توقيع رقمي وتوليد CSR بمنحنى secp256r1' },
    { icon: Shield, title: 'QR Code TLV', desc: 'رمز استجابة سريع بترميز TLV يدعم Tags 1-9' },
    { icon: Server, title: 'ZATCA API Integration', desc: 'تكامل كامل مع بوابة فاتورة (Sandbox/Simulation/Production)' },
    { icon: Globe, title: 'Multi-tenant Security', desc: 'عزل كامل للمستأجرين مع تشفير AES-256-GCM' },
    { icon: FileText, title: 'Audit Trail', desc: 'سجل مراجعة غير قابل للتعديل مع ربط تسلسلي' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الوثائق التقنية</h1>
          <p className="text-muted-foreground">وثيقة اعتماد مزود حلول الفوترة الإلكترونية لدى هيئة الزكاة والضريبة والجمارك</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printDoc} className="gap-2">
            <FileText className="w-4 h-4" />
            طباعة
          </Button>
          <Button onClick={downloadDoc} className="gap-2">
            <Download className="w-4 h-4" />
            تحميل الوثيقة
          </Button>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <Card key={i}>
            <CardContent className="pt-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
              <Badge variant="default" className="mr-auto shrink-0 text-xs">✅</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Info Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بيانات المنشأة في الوثيقة</CardTitle>
          <CardDescription>تأكد من تعبئة إعدادات الضريبة قبل تحميل الوثيقة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">اسم المنشأة</p>
              <p className="font-medium">{taxSettings?.company_name_ar || <span className="text-destructive">غير محدد</span>}</p>
            </div>
            <div>
              <p className="text-muted-foreground">الرقم الضريبي</p>
              <p className="font-medium font-mono" dir="ltr">{taxSettings?.tax_number || <span className="text-destructive">غير محدد</span>}</p>
            </div>
            <div>
              <p className="text-muted-foreground">السجل التجاري</p>
              <p className="font-medium font-mono" dir="ltr">{taxSettings?.commercial_register || <span className="text-destructive">غير محدد</span>}</p>
            </div>
            <div>
              <p className="text-muted-foreground">بيئة ZATCA</p>
              <Badge variant="outline">{zatcaConfig?.environment || 'غير مفعّل'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
