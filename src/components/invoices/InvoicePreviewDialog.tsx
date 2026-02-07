import { useRef, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZatcaInvoice } from './ZatcaInvoice';
import { Printer, Download, X, FileCode, Copy, Check } from 'lucide-react';
import { TaxSettings } from '@/services/accounting';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateZatcaXML, downloadXMLInvoice, generateInvoiceUUID, generateInvoiceHash, type ZatcaXMLInvoiceData } from '@/lib/zatcaXML';
import { toast } from 'sonner';

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
}

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoiceData;
}

export function InvoicePreviewDialog({ open, onOpenChange, data }: InvoicePreviewDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [uuidCopied, setUuidCopied] = useState(false);

  // Generate a stable UUID for this invoice
  const invoiceUUID = useMemo(() => generateInvoiceUUID(), [data.invoiceNumber]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `فاتورة_${data.invoiceNumber}`,
  });

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`فاتورة_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleExportXML = async () => {
    try {
      const taxRate = data.taxSettings?.tax_rate || 15;
      
      const xmlData: ZatcaXMLInvoiceData = {
        uuid: invoiceUUID,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        invoiceType: data.invoiceType,
        invoiceTypeCode: '388',
        sellerName: data.sellerName,
        sellerTaxNumber: data.sellerTaxNumber || data.taxSettings?.tax_number || '',
        sellerAddress: data.sellerAddress || data.taxSettings?.national_address || '',
        sellerCommercialRegister: data.taxSettings?.commercial_register || '',
        buyerName: data.buyerName,
        buyerTaxNumber: data.buyerTaxNumber,
        buyerIdNumber: data.buyerIdNumber,
        buyerAddress: data.buyerAddress,
        items: data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.unitPrice * item.quantity * (item.taxRate / 100),
          total: item.total,
        })),
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
        taxRate,
      };

      const xmlContent = generateZatcaXML(xmlData);
      
      // Generate hash for verification
      const hash = await generateInvoiceHash(xmlContent);
      console.log('Invoice Hash (SHA-256):', hash);

      downloadXMLInvoice(xmlContent, `ZATCA_Invoice_${data.invoiceNumber}`);
      toast.success('تم تصدير الفاتورة بصيغة XML بنجاح', {
        description: `UUID: ${invoiceUUID.substring(0, 8)}...`,
      });
    } catch (error) {
      console.error('Error exporting XML:', error);
      toast.error('فشل تصدير الفاتورة بصيغة XML');
    }
  };

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(invoiceUUID);
    setUuidCopied(true);
    toast.success('تم نسخ المعرف الفريد UUID');
    setTimeout(() => setUuidCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة الفاتورة</span>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportXML}>
                <FileCode className="w-4 h-4 ml-2" />
                تصدير XML
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
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
        
        <div className="border border-border rounded-lg overflow-hidden bg-muted p-4">
          <ZatcaInvoice ref={invoiceRef} data={{ ...data, uuid: invoiceUUID }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
