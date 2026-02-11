import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseInvoice } from './PurchaseInvoice';
import { Printer, Download, LayoutTemplate } from 'lucide-react';
import { TaxSettings } from '@/services/accounting';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceTemplateSelector } from './InvoiceTemplateSelector';
import { InvoiceTemplate1, InvoiceTemplate2, InvoiceTemplate3, InvoiceTemplate4 } from './templates';
import { InvoiceTemplateName, InvoiceTemplateData } from './templates/types';

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
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateName>('default');
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `فاتورة_مشتريات_${data.invoiceNumber}`,
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
      pdf.save(`فاتورة_مشتريات_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Convert purchase data to template format
  const templateData: InvoiceTemplateData = {
    invoiceNumber: data.invoiceNumber, invoiceDate: data.invoiceDate, invoiceType: 'purchase',
    sellerName: data.supplierName, sellerTaxNumber: data.supplierTaxNumber, sellerAddress: data.supplierAddress,
    sellerPhone: data.supplierPhone,
    buyerName: data.companyName, buyerTaxNumber: data.companyTaxNumber, buyerAddress: data.companyAddress,
    items: data.items, subtotal: data.subtotal, taxAmount: data.taxAmount, total: data.total,
    taxSettings: data.taxSettings, companyLogoUrl: data.companyLogoUrl,
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'template1': return <InvoiceTemplate1 ref={invoiceRef} data={templateData} />;
      case 'template2': return <InvoiceTemplate2 ref={invoiceRef} data={templateData} />;
      case 'template3': return <InvoiceTemplate3 ref={invoiceRef} data={templateData} />;
      case 'template4': return <InvoiceTemplate4 ref={invoiceRef} data={templateData} />;
      default: return <PurchaseInvoice ref={invoiceRef} data={data} />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>معاينة فاتورة المشتريات</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTemplateSelectorOpen(true)}>
                  <LayoutTemplate className="w-4 h-4 ml-2" />
                  نموذج
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
          
          <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
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
