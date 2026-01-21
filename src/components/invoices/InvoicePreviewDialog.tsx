import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZatcaInvoice } from './ZatcaInvoice';
import { Printer, Download, X } from 'lucide-react';
import { TaxSettings } from '@/services/accounting';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`فاتورة_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة الفاتورة</span>
            <div className="flex gap-2">
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
        
        <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
          <ZatcaInvoice ref={invoiceRef} data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
