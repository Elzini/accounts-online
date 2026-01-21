import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseInvoice } from './PurchaseInvoice';
import { Printer, Download } from 'lucide-react';
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

interface PurchaseInvoiceData {
  invoiceNumber: string | number;
  invoiceDate: string;
  supplierName: string;
  supplierTaxNumber?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  companyName: string;
  companyTaxNumber?: string;
  companyAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxSettings?: TaxSettings | null;
  companyLogoUrl?: string | null;
}

interface PurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PurchaseInvoiceData;
}

export function PurchaseInvoiceDialog({ open, onOpenChange, data }: PurchaseInvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `فاتورة_مشتريات_${data.invoiceNumber}`,
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
      pdf.save(`فاتورة_مشتريات_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة فاتورة المشتريات</span>
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
          <PurchaseInvoice ref={invoiceRef} data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
