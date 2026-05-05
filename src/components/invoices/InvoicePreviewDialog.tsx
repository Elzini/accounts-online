import { useRef, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZatcaInvoice } from './ZatcaInvoice';
import { Printer, Download, X, FileCode, FileJson, Copy, Check, Send, LayoutTemplate } from 'lucide-react';
import { TaxSettings } from '@/services/accounting';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateZatcaXML, downloadXMLInvoice, generateInvoiceUUID, generateInvoiceHash, type ZatcaXMLInvoiceData } from '@/lib/zatcaXML';
import { generateZatcaJSONString, downloadJSONInvoice } from '@/lib/zatcaJSON';
import { toast } from 'sonner';
import { InvoiceTemplateSelector } from './InvoiceTemplateSelector';
import { InvoiceLabelCustomizer } from './InvoiceLabelCustomizer';
import { InvoiceTemplate1, InvoiceTemplate2, InvoiceTemplate3, InvoiceTemplate4, InvoiceTemplate5, InvoiceTemplate6, InvoiceTemplate7 } from './templates';
import { InvoiceTemplateName, InvoiceTemplateData, InvoiceCustomLabels, defaultInvoiceLabels } from './templates/types';
import { getZatcaPhase2DisplayState } from '@/lib/zatcaPhase2Status';
import { useZatcaConfigStatus } from '@/hooks/useZatcaConfigStatus';
import { ShieldCheck, ShieldAlert, KeyRound, QrCode, Activity } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface InvoiceSettings {
  template?: 'modern' | 'classic' | 'minimal';
  primary_color?: string;
  show_logo?: boolean;
  show_qr?: boolean;
  show_terms?: boolean;
  terms_text?: string;
  footer_text?: string;
}

interface InvoiceData {
  invoiceNumber: string | number;
  invoiceDate: string;
  invoiceType: 'sale' | 'purchase';
  sellerName: string;
  sellerTaxNumber: string;
  sellerAddress: string;
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerIdNumber?: string;
  buyerTaxNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxSettings?: TaxSettings | null;
  companyLogoUrl?: string | null;
  invoiceSettings?: InvoiceSettings | null;
  salesmanName?: string;
  branchName?: string;
  paymentMethod?: string;
  uuid?: string;
  officialQrData?: string | null;
  zatcaStatus?: string | null;
}

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoiceData;
}

export function InvoicePreviewDialog({ open, onOpenChange, data }: InvoicePreviewDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [uuidCopied, setUuidCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateName>('default');
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [customLabels, setCustomLabels] = useState<InvoiceCustomLabels>({ ...defaultInvoiceLabels });
  const [plateNumber, setPlateNumber] = useState('');
  const [retentionRate, setRetentionRate] = useState<number>(10);

  const invoiceUUID = useMemo(() => data.uuid || generateInvoiceUUID(), [data.uuid, data.invoiceNumber]);
  const zatcaConfig = useZatcaConfigStatus();
  const phase2State = useMemo(() => getZatcaPhase2DisplayState({
    officialQrData: data.officialQrData,
    zatcaStatus: data.zatcaStatus,
    hasComplianceCsid: zatcaConfig.hasComplianceCsid,
    hasProductionCsid: zatcaConfig.hasProductionCsid,
    onboardingStatus: zatcaConfig.onboardingStatus,
  }), [data.officialQrData, data.zatcaStatus, zatcaConfig.hasComplianceCsid, zatcaConfig.hasProductionCsid, zatcaConfig.onboardingStatus]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `فاتورة_${data.invoiceNumber}`,
  });

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`فاتورة_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const buildInvoiceData = (): ZatcaXMLInvoiceData => {
    const taxRate = data.taxSettings?.tax_rate || 15;
    return {
      uuid: invoiceUUID, invoiceNumber: data.invoiceNumber, invoiceDate: data.invoiceDate,
      invoiceType: data.invoiceType, invoiceTypeCode: '388',
      sellerName: data.sellerName, sellerTaxNumber: data.sellerTaxNumber || data.taxSettings?.tax_number || '',
      sellerAddress: data.sellerAddress || data.taxSettings?.national_address || '',
      sellerCommercialRegister: data.taxSettings?.commercial_register || '',
      buyerName: data.buyerName, buyerTaxNumber: data.buyerTaxNumber, buyerIdNumber: data.buyerIdNumber, buyerAddress: data.buyerAddress,
      items: data.items.map(item => ({
        description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, taxRate: item.taxRate,
        taxAmount: item.unitPrice * item.quantity * (item.taxRate / 100), total: item.total,
      })),
      subtotal: data.subtotal, taxAmount: data.taxAmount, total: data.total, taxRate,
    };
  };

  const handleExportXML = async () => {
    try {
      const xmlData = buildInvoiceData();
      const xmlContent = generateZatcaXML(xmlData);
      const hash = await generateInvoiceHash(xmlContent);
      console.log('Invoice Hash (SHA-256):', hash);
      downloadXMLInvoice(xmlContent, `ZATCA_Invoice_${data.invoiceNumber}`);
      toast.success('تم تصدير الفاتورة بصيغة XML بنجاح', { description: `UUID: ${invoiceUUID.substring(0, 8)}...` });
    } catch (error) { console.error('Error exporting XML:', error); toast.error('فشل تصدير الفاتورة بصيغة XML'); }
  };

  const handleExportJSON = async () => {
    try {
      const jsonData = buildInvoiceData();
      const jsonContent = generateZatcaJSONString(jsonData);
      downloadJSONInvoice(jsonContent, `ZATCA_Invoice_${data.invoiceNumber}`);
      toast.success('تم تصدير الفاتورة بصيغة JSON بنجاح', { description: `UUID: ${invoiceUUID.substring(0, 8)}...` });
    } catch (error) { console.error('Error exporting JSON:', error); toast.error('فشل تصدير الفاتورة بصيغة JSON'); }
  };

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(invoiceUUID);
    setUuidCopied(true);
    toast.success('تم نسخ المعرف الفريد UUID');
    setTimeout(() => setUuidCopied(false), 2000);
  };

  // Convert data to template format
  const templateData: InvoiceTemplateData = {
    invoiceNumber: data.invoiceNumber, invoiceDate: data.invoiceDate, invoiceType: data.invoiceType,
    sellerName: data.sellerName, sellerTaxNumber: data.sellerTaxNumber, sellerAddress: data.sellerAddress,
    buyerName: data.buyerName, buyerPhone: data.buyerPhone, buyerAddress: data.buyerAddress,
    buyerTaxNumber: data.buyerTaxNumber, buyerIdNumber: data.buyerIdNumber,
    items: data.items, subtotal: data.subtotal, taxAmount: data.taxAmount, total: data.total,
    taxSettings: data.taxSettings, companyLogoUrl: data.companyLogoUrl, uuid: invoiceUUID,
    officialQrData: data.officialQrData, zatcaStatus: data.zatcaStatus,
    sellerCommercialRegister: data.taxSettings?.commercial_register,
    voucherNumber: (data as any).voucherNumber,
    salesmanName: data.salesmanName || '',
    branchName: data.branchName || '',
    paymentMethod: data.paymentMethod || 'cash',
    notes: (data as any).notes || '',
    paidAmount: (data as any).paidAmount || 0,
    buyerCommercialRegister: (data as any).buyerCommercialRegister || '',
    poDetails: (data as any).poDetails || '',
    projectReference: (data as any).projectReference || '',
    customLabels,
    plateNumber,
    retentionRate,
    retentionAmount: data.subtotal * (retentionRate / 100),
    totalDue: data.total - (data.subtotal * (retentionRate / 100)),
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'template1': return <InvoiceTemplate1 ref={invoiceRef} data={templateData} />;
      case 'template2': return <InvoiceTemplate2 ref={invoiceRef} data={templateData} />;
      case 'template3': return <InvoiceTemplate3 ref={invoiceRef} data={templateData} />;
      case 'template4': return <InvoiceTemplate4 ref={invoiceRef} data={templateData} />;
      case 'template5': return <InvoiceTemplate5 ref={invoiceRef} data={templateData} />;
      case 'template6': return <InvoiceTemplate6 ref={invoiceRef} data={templateData} />;
      case 'template7': return <InvoiceTemplate7 ref={invoiceRef} data={templateData} />;
      default: return <ZatcaInvoice ref={invoiceRef} data={{ ...data, uuid: invoiceUUID, paymentMethod: templateData.paymentMethod, customLabels, plateNumber }} />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>معاينة الفاتورة</span>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setTemplateSelectorOpen(true)}>
                  <LayoutTemplate className="w-4 h-4 ml-2" />
                  نموذج
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportXML}>
                  <FileCode className="w-4 h-4 ml-2" />
                  XML
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON}>
                  <FileJson className="w-4 h-4 ml-2" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 ml-2" />
                  PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* UUID Display */}
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm" dir="ltr">
            <span className="text-muted-foreground font-medium">UUID:</span>
            <code className="text-xs font-mono flex-1 truncate">{invoiceUUID}</code>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyUUID}>
              {uuidCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={phase2State.isPhase2Approved
                  ? 'bg-black text-white hover:bg-black/90 font-bold'
                  : phase2State.normalizedStatus === 'rejected' || phase2State.normalizedStatus === 'failed' || phase2State.normalizedStatus === 'error' || phase2State.normalizedStatus === 'invalid'
                    ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                    : 'bg-secondary text-secondary-foreground'}
              >
                {phase2State.label}
              </Badge>
              <p className="text-xs text-muted-foreground">{phase2State.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Signature source */}
              <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded px-2 py-1.5">
                {phase2State.signatureSource === 'official' && phase2State.hasProductionCsid ? (
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                ) : phase2State.signatureSource === 'local' ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">نوع التوقيع</span>
                  <span className="font-medium">{phase2State.signatureLabel}</span>
                </div>
              </div>

              {/* CSID status */}
              <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded px-2 py-1.5">
                <KeyRound className={`w-4 h-4 shrink-0 ${phase2State.hasProductionCsid ? 'text-green-600' : phase2State.hasComplianceCsid ? 'text-amber-600' : 'text-destructive'}`} />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">شهادة الشركة</span>
                  <span className="font-medium">{phase2State.csidLabel}</span>
                </div>
              </div>

              {/* QR presence */}
              <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded px-2 py-1.5">
                <QrCode className={`w-4 h-4 shrink-0 ${phase2State.hasOfficialQr ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">باركود ZATCA المحفوظ</span>
                  <span className="font-medium">{phase2State.hasOfficialQr ? 'موجود (zatca_qr)' : 'غير موجود'}</span>
                </div>
              </div>

              {/* Status & onboarding */}
              <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded px-2 py-1.5">
                <Activity className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">حالة الفاتورة / التسجيل</span>
                  <span className="font-medium">
                    {phase2State.normalizedStatus || 'غير مُرسلة'} · {phase2State.onboardingLabel}
                  </span>
                </div>
              </div>
            </div>

            {!phase2State.hasProductionCsid && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1.5">
                ⚠️ هذه الشركة لم تُكمل التسجيل في ZATCA (لا توجد Production CSID). الباركود الناتج سيظهر في تطبيق ZATCA الرسمي كـ "متوافق" فقط وليس "معتمد".
              </p>
            )}
          </div>

          <InvoiceLabelCustomizer labels={customLabels} onChange={setCustomLabels} />

          {/* Plate Number Input */}
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">{customLabels.plateNumberLabel || 'رقم اللوحة'}:</label>
            <input
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="أدخل رقم اللوحة"
              className="flex-1 h-7 text-xs bg-transparent border-0 border-b border-input focus:outline-none focus:border-primary px-1"
              dir="auto"
            />
          </div>

          {selectedTemplate === 'template6' && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <label className="text-xs font-medium text-amber-900 whitespace-nowrap">نسبة الاحتجاز Retention %:</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={retentionRate}
                onChange={(e) => setRetentionRate(Number(e.target.value) || 0)}
                className="w-24 h-7 text-xs bg-white border border-amber-300 rounded px-2 focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
              <span className="text-xs text-amber-800">
                = {(data.subtotal * (retentionRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
              </span>
              <span className="text-xs text-amber-700 mr-auto">
                المستحق: {(data.total - data.subtotal * (retentionRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
              </span>
            </div>
          )}

          <div className="border border-border rounded-lg overflow-hidden bg-muted p-4">
            {renderTemplate()}
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceTemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={setSelectedTemplate}
      />
    </>
  );
}
