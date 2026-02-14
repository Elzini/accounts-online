import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, XCircle, FileText, Send, Shield, AlertTriangle, Loader2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useZatcaConfig, useCallZatcaAPI, useCreateZatcaInvoiceLog } from '@/hooks/useZatcaIntegration';
import { generateZatcaXML, generateInvoiceHashBase64, generateInvoiceUUID } from '@/lib/zatcaXML';
import { useTaxSettings } from '@/hooks/useAccounting';

// ZATCA Conformance Test Cases per official spec
const CONFORMANCE_TESTS = [
  { id: 'STD-001', name: 'فاتورة ضريبية قياسية (B2B)', type: 'clearance', invoiceTypeCode: '388' as const, subType: 'standard' },
  { id: 'STD-002', name: 'إشعار دائن قياسي', type: 'clearance', invoiceTypeCode: '381' as const, subType: 'standard' },
  { id: 'STD-003', name: 'إشعار مدين قياسي', type: 'clearance', invoiceTypeCode: '383' as const, subType: 'standard' },
  { id: 'SIM-001', name: 'فاتورة ضريبية مبسطة (B2C)', type: 'reporting', invoiceTypeCode: '388' as const, subType: 'simplified' },
  { id: 'SIM-002', name: 'إشعار دائن مبسط', type: 'reporting', invoiceTypeCode: '381' as const, subType: 'simplified' },
  { id: 'SIM-003', name: 'إشعار مدين مبسط', type: 'reporting', invoiceTypeCode: '383' as const, subType: 'simplified' },
];

export function ZatcaSandboxPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [invoiceXml, setInvoiceXml] = useState('');
  const [testType, setTestType] = useState('clearance');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [activeTab, setActiveTab] = useState('conformance');
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string; response?: any }>>({});

  const { data: zatcaConfig } = useZatcaConfig();
  const { data: taxSettings } = useTaxSettings();
  const callZatcaAPI = useCallZatcaAPI();
  const createLog = useCreateZatcaInvoiceLog();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['zatca-sandbox', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zatca_sandbox_tests')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Generate a sample invoice XML for testing
  const generateTestInvoice = (test: typeof CONFORMANCE_TESTS[0]) => {
    const uuid = generateInvoiceUUID();
    const isStandard = test.subType === 'standard';
    
    const xmlData = {
      uuid,
      invoiceNumber: `TEST-${test.id}-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      invoiceType: 'sale' as const,
      invoiceTypeCode: test.invoiceTypeCode,
      sellerName: taxSettings?.company_name_ar || 'شركة اختبار',
      sellerTaxNumber: taxSettings?.tax_number || '300000000000003',
      sellerAddress: taxSettings?.national_address || '',
      sellerCity: taxSettings?.city || 'الرياض',
      sellerPostalCode: taxSettings?.postal_code || '12345',
      sellerBuildingNumber: taxSettings?.building_number || '1234',
      sellerCommercialRegister: taxSettings?.commercial_register || '',
      sellerCountry: 'SA',
      sellerStreet: taxSettings?.national_address || 'شارع الاختبار',
      sellerDistrict: 'حي الاختبار',
      buyerName: isStandard ? 'شركة العميل للاختبار' : 'عميل نقدي',
      buyerTaxNumber: isStandard ? '300000000000004' : undefined,
      buyerAddress: 'الرياض',
      buyerCity: 'الرياض',
      buyerPostalCode: '12345',
      items: [
        {
          description: 'منتج اختبار 1',
          quantity: 2,
          unitPrice: 100,
          taxRate: 15,
          taxAmount: 30,
          total: 230,
          unitCode: 'PCE',
        },
        {
          description: 'خدمة اختبار 2',
          quantity: 1,
          unitPrice: 500,
          taxRate: 15,
          taxAmount: 75,
          total: 575,
          unitCode: 'PCE',
        },
      ],
      subtotal: 700,
      taxAmount: 105,
      total: 805,
      taxRate: 15,
      currency: 'SAR',
      paymentMethod: 'cash',
    };

    return { xml: generateZatcaXML(xmlData), uuid, invoiceNumber: xmlData.invoiceNumber };
  };

  // Run a single conformance test
  const runConformanceTest = async (test: typeof CONFORMANCE_TESTS[0]) => {
    if (!zatcaConfig?.compliance_csid) {
      toast.error('يجب الحصول على Compliance CSID أولاً من إعدادات ZATCA');
      return;
    }

    setRunningTests(prev => new Set(prev).add(test.id));

    try {
      const { xml, uuid, invoiceNumber } = generateTestInvoice(test);
      const invoiceHash = await generateInvoiceHashBase64(xml);
      const invoiceBase64 = btoa(unescape(encodeURIComponent(xml)));

      const result = await callZatcaAPI.mutateAsync({
        action: test.type === 'clearance' ? 'compliance' : 'compliance',
        environment: (zatcaConfig.environment as 'sandbox' | 'simulation' | 'production') || 'sandbox',
        csid: zatcaConfig.compliance_csid,
        csidSecret: zatcaConfig.private_key || '',
        invoice: invoiceBase64,
        invoiceHash,
        uuid,
      });

      const status = result?.success ? 'success' : 'error';
      const message = result?.success
        ? `✅ اجتاز الاختبار بنجاح`
        : `❌ فشل: ${result?.error || 'خطأ غير معروف'}`;

      setTestResults(prev => ({
        ...prev,
        [test.id]: { status, message, response: result?.data },
      }));

      // Log to database
      await supabase.from('zatca_sandbox_tests').insert({
        company_id: companyId!,
        test_name: `${test.id}: ${test.name}`,
        invoice_type: test.type,
        request_payload: { xml: xml.substring(0, 500), uuid, invoiceHash },
        response_payload: result?.data || null,
        status,
        error_message: status === 'error' ? message : null,
      });

      queryClient.invalidateQueries({ queryKey: ['zatca-sandbox'] });

      if (status === 'success') {
        toast.success(`${test.id}: ${test.name} - نجح ✅`);
      } else {
        toast.error(`${test.id}: ${test.name} - فشل ❌`);
      }
    } catch (err: any) {
      const message = err?.message || 'خطأ في الاتصال';
      setTestResults(prev => ({
        ...prev,
        [test.id]: { status: 'error', message },
      }));
      toast.error(`${test.id}: ${message}`);
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(test.id);
        return next;
      });
    }
  };

  // Run all conformance tests sequentially
  const runAllTests = async () => {
    for (const test of CONFORMANCE_TESTS) {
      await runConformanceTest(test);
    }
  };

  // Manual test submission
  const submitManualTest = async () => {
    if (!invoiceXml.trim()) {
      toast.error('يرجى إدخال XML الفاتورة');
      return;
    }

    if (!zatcaConfig?.compliance_csid) {
      // Fallback: save as local simulation
      await supabase.from('zatca_sandbox_tests').insert({
        company_id: companyId!,
        test_name: invoiceNo || `MANUAL-${Date.now()}`,
        invoice_type: testType,
        request_payload: { xml: invoiceXml.substring(0, 1000) },
        status: 'pending',
        error_message: 'لم يتم الإرسال - يلزم تفعيل CSID أولاً',
      });
      queryClient.invalidateQueries({ queryKey: ['zatca-sandbox'] });
      toast.warning('تم الحفظ كمسودة - يلزم تفعيل CSID للإرسال الفعلي');
      return;
    }

    try {
      const uuid = generateInvoiceUUID();
      const invoiceHash = await generateInvoiceHashBase64(invoiceXml);
      const invoiceBase64 = btoa(unescape(encodeURIComponent(invoiceXml)));

      const result = await callZatcaAPI.mutateAsync({
        action: testType as any,
        environment: (zatcaConfig.environment as any) || 'sandbox',
        csid: zatcaConfig.compliance_csid,
        csidSecret: zatcaConfig.private_key || '',
        invoice: invoiceBase64,
        invoiceHash,
        uuid,
      });

      const status = result?.success ? 'success' : 'error';

      await supabase.from('zatca_sandbox_tests').insert({
        company_id: companyId!,
        test_name: invoiceNo || `MANUAL-${Date.now()}`,
        invoice_type: testType,
        request_payload: { xml: invoiceXml.substring(0, 1000), uuid },
        response_payload: result?.data || null,
        status,
        error_message: status === 'error' ? (result?.error || 'خطأ') : null,
      });

      queryClient.invalidateQueries({ queryKey: ['zatca-sandbox'] });
      if (status === 'success') toast.success('تم الإرسال بنجاح ✅');
      else toast.error(`فشل الإرسال: ${result?.error}`);
    } catch (err: any) {
      toast.error(err?.message || 'خطأ في الإرسال');
    }
  };

  const totalTests = logs.length;
  const successTests = logs.filter((l: any) => l.status === 'success').length;
  const failedTests = logs.filter((l: any) => l.status === 'error').length;
  const successRate = totalTests > 0 ? ((successTests / totalTests) * 100).toFixed(0) : '0';

  const hasCSID = !!zatcaConfig?.compliance_csid;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.zatca_sb_title}</h1>
          <p className="text-muted-foreground">{t.zatca_sb_subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 ${hasCSID ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}`}>
            <Shield className="w-3 h-3" />
            {hasCSID ? 'CSID مفعّل' : t.zatca_sb_simulation}
          </Badge>
        </div>
      </div>

      {/* CSID Warning */}
      {!hasCSID && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-yellow-700">لم يتم تفعيل CSID بعد</p>
              <p className="text-sm text-muted-foreground mt-1">
                لتشغيل اختبارات التوافق الحقيقية مع بوابة ZATCA، يجب أولاً الحصول على Compliance CSID من صفحة إعدادات ZATCA.
                يمكنك حالياً حفظ الاختبارات كمسودات.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalTests}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_tests}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{successTests}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_successful}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{failedTests}</div><p className="text-sm text-muted-foreground">{t.zatca_sb_failed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{successRate}%</div><p className="text-sm text-muted-foreground">{t.zatca_sb_success_rate}</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conformance"><Shield className="w-3 h-3 mr-1" />اختبارات التوافق</TabsTrigger>
          <TabsTrigger value="test"><Play className="w-3 h-3 mr-1" />{t.zatca_sb_new_test}</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="w-3 h-3 mr-1" />{t.zatca_sb_logs}</TabsTrigger>
        </TabsList>

        {/* Conformance Tests Tab */}
        <TabsContent value="conformance" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">اختبارات التوافق الرسمية</CardTitle>
                  <CardDescription>6 اختبارات مطلوبة من الهيئة لاعتماد الحل كمزود خدمات فوترة إلكترونية</CardDescription>
                </div>
                <Button onClick={runAllTests} disabled={!hasCSID || runningTests.size > 0} className="gap-2">
                  {runningTests.size > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  تشغيل جميع الاختبارات
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">الرمز</TableHead>
                    <TableHead>الاختبار</TableHead>
                    <TableHead className="w-28">النوع</TableHead>
                    <TableHead className="w-28">الحالة</TableHead>
                    <TableHead className="w-40">النتيجة</TableHead>
                    <TableHead className="w-28">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONFORMANCE_TESTS.map((test) => {
                    const result = testResults[test.id];
                    const isRunning = runningTests.has(test.id);
                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-mono font-bold">{test.id}</TableCell>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {test.type === 'clearance' ? 'Clearance' : 'Reporting'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isRunning ? (
                            <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />جاري...</Badge>
                          ) : result ? (
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status === 'success' ? '✅ نجح' : '❌ فشل'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">لم يُختبر</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                          {result?.message || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runConformanceTest(test)}
                            disabled={!hasCSID || isRunning}
                          >
                            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Conformance Summary */}
              {Object.keys(testResults).length > 0 && (
                <div className="mt-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium mb-2">ملخص اختبارات التوافق</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      ✅ نجح: {Object.values(testResults).filter(r => r.status === 'success').length}
                    </span>
                    <span className="text-destructive">
                      ❌ فشل: {Object.values(testResults).filter(r => r.status === 'error').length}
                    </span>
                    <span className="text-muted-foreground">
                      ⏳ متبقي: {CONFORMANCE_TESTS.length - Object.keys(testResults).length}
                    </span>
                  </div>
                  {Object.values(testResults).every(r => r.status === 'success') && Object.keys(testResults).length === CONFORMANCE_TESTS.length && (
                    <p className="mt-2 text-green-600 font-medium">🎉 جميع اختبارات التوافق ناجحة! النظام جاهز لتقديم طلب الاعتماد.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Test Tab */}
        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t.zatca_sb_send_test}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.zatca_sb_operation_type}</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clearance">{t.zatca_sb_clearance}</SelectItem>
                      <SelectItem value="reporting">{t.zatca_sb_reporting}</SelectItem>
                      <SelectItem value="compliance">Compliance CSID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.zatca_sb_invoice_no}</Label>
                  <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-XXX" />
                </div>
              </div>
              <div>
                <Label>{t.zatca_sb_xml}</Label>
                <Textarea
                  placeholder={t.zatca_sb_xml_placeholder}
                  value={invoiceXml}
                  onChange={e => setInvoiceXml(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <Button className="gap-2" onClick={submitManualTest} disabled={callZatcaAPI.isPending}>
                {callZatcaAPI.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t.zatca_sb_send}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">{t.loading}</p>
              ) : logs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t.zatca_sb_no_tests}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.zatca_sb_type}</TableHead>
                      <TableHead>{t.zatca_sb_name}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.description}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell><Badge variant="outline">{l.invoice_type}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{l.test_name}</TableCell>
                        <TableCell>{new Date(l.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === 'success' ? 'default' : l.status === 'pending' ? 'secondary' : 'destructive'}>
                            {l.status === 'success' ? t.zatca_sb_status_success : l.status === 'pending' ? 'مسودة' : t.zatca_sb_status_error}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{l.error_message || t.zatca_sb_success_msg}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
