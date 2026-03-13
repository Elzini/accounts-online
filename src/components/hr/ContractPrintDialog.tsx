import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';

interface ContractPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

export function ContractPrintDialog({ open, onOpenChange, contract }: ContractPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { company } = useCompany();
  const companyId = useCompanyId();
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const { data: taxSettings } = useQuery({
    queryKey: ['tax-settings-print', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('tax_number, company_name_ar, national_address, commercial_register, city, postal_code, building_number')
        .eq('company_id', companyId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!companyId,
  });

  const typeLabels: Record<string, string> = {
    'full-time': 'دوام كامل',
    'part-time': 'دوام جزئي',
    temporary: 'مؤقت',
  };

  const durationUnitLabels: Record<string, string> = {
    year: 'سنة',
    month: 'شهر',
    day: 'يوم',
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `عقد_عمل_${contract?.employee_name || ''}`,
  });

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`عقد_عمل_${contract?.employee_name || ''}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  if (!contract) return null;

  const salary = Number(contract.salary || 0);
  const housing = Number(contract.housing_allowance || 0);
  const transport = Number(contract.transport_allowance || 0);
  const otherAllowances: any[] = contract.other_allowances_json || [];
  const deductionsList: any[] = contract.deductions_json || [];
  const totalOther = otherAllowances.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalDeductions = deductionsList.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalSalary = salary + housing + transport + totalOther;
  const netSalary = totalSalary - totalDeductions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0" dir="rtl">
        <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة عقد العمل</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4 ml-1" />
                طباعة
              </Button>
              <Button variant="default" size="sm" onClick={handleExportPdf}>
                <Download className="h-4 w-4 ml-1" />
                تصدير PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-muted/30">
          <div
            ref={printRef}
            dir="rtl"
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            style={{ fontFamily: 'Cairo, Arial, sans-serif', minHeight: '100%' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2">عقد عمل</h1>
                  <div className="text-blue-100 text-sm">
                    {contract.contract_code && `رقم العقد: ${contract.contract_code} | `}
                    نوع العقد: {typeLabels[contract.contract_type] || contract.contract_type}
                  </div>
                </div>
                <div className="text-left text-sm text-blue-100">
                  <div className="font-bold text-white text-base">{taxSettings?.company_name_ar || company?.name || ''}</div>
                  {taxSettings?.tax_number && <div>الرقم الضريبي: {taxSettings.tax_number}</div>}
                  {taxSettings?.commercial_register && <div>السجل التجاري: {taxSettings.commercial_register}</div>}
                  {taxSettings?.national_address && <div>العنوان: {taxSettings.national_address}</div>}
                  {taxSettings?.city && <div>المدينة: {taxSettings.city}</div>}
                  {company?.phone && <div>هاتف: {company.phone}</div>}
                  <div className="mt-1">تاريخ الطباعة: {currentDate}</div>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">بيانات الموظف</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">اسم الموظف:</span>
                  <span>{contract.employee_name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">المسمى الوظيفي:</span>
                  <span>{contract.position || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">القسم:</span>
                  <span>{contract.department || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">المستوى الوظيفي:</span>
                  <span>{contract.job_level || '-'}</span>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">تفاصيل العقد</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">تاريخ البداية:</span>
                  <span>{contract.start_date || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">تاريخ النهاية:</span>
                  <span>{contract.end_date || '-'}</span>
                </div>
                {contract.duration_type === 'duration' && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-600">مدة العقد:</span>
                    <span>{contract.duration_value} {durationUnitLabels[contract.duration_unit] || contract.duration_unit}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">تجديد تلقائي:</span>
                  <span>{contract.auto_renew ? 'نعم' : 'لا'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">تاريخ المباشرة:</span>
                  <span>{contract.join_date || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">نهاية فترة التجربة:</span>
                  <span>{contract.probation_end_date || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">تاريخ التوقيع:</span>
                  <span>{contract.signing_date || '-'}</span>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">البيانات المالية</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">العملة:</span>
                  <span>{contract.currency || 'SAR'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">دورة الدفع:</span>
                  <span>{contract.pay_cycle === 'monthly' ? 'شهري' : 'أسبوعي'}</span>
                </div>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-3 text-right font-semibold border border-blue-700">البند</th>
                    <th className="p-3 text-right font-semibold border border-blue-700 w-40">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="p-3 border border-gray-200 font-medium">الراتب الأساسي</td>
                    <td className="p-3 border border-gray-200">{formatNumber(salary)} {contract.currency || 'SAR'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">بدل السكن</td>
                    <td className="p-3 border border-gray-200">{formatNumber(housing)} {contract.currency || 'SAR'}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 border border-gray-200">بدل النقل</td>
                    <td className="p-3 border border-gray-200">{formatNumber(transport)} {contract.currency || 'SAR'}</td>
                  </tr>
                  {otherAllowances.map((a: any, i: number) => (
                    <tr key={`a-${i}`} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-3 border border-gray-200">{a.name || 'بدل إضافي'}</td>
                      <td className="p-3 border border-gray-200">{formatNumber(Number(a.amount || 0))} {contract.currency || 'SAR'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50">
                    <td className="p-3 font-bold border border-blue-200">إجمالي الراتب</td>
                    <td className="p-3 font-bold border border-blue-200 text-blue-600">{formatNumber(totalSalary)} {contract.currency || 'SAR'}</td>
                  </tr>
                  {deductionsList.length > 0 && deductionsList.map((d: any, i: number) => (
                    <tr key={`d-${i}`} className="bg-red-50">
                      <td className="p-3 border border-red-200 text-destructive">خصم: {d.name || '-'}</td>
                      <td className="p-3 border border-red-200 text-destructive">-{formatNumber(Number(d.amount || 0))} {contract.currency || 'SAR'}</td>
                    </tr>
                  ))}
                  {deductionsList.length > 0 && (
                    <tr className="bg-green-50">
                      <td className="p-3 font-bold border border-green-200">صافي الراتب</td>
                      <td className="p-3 font-bold border border-green-200 text-green-600">{formatNumber(netSalary)} {contract.currency || 'SAR'}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Description */}
            {contract.description && (
              <div className="px-6 py-4 border-b">
                <div className="bg-gray-50 rounded-lg p-4 border-r-4 border-blue-500">
                  <div className="font-bold mb-2 text-gray-700">وصف العقد:</div>
                  <div className="text-gray-600 text-sm">{contract.description}</div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-1">توقيع الموظف</div>
                  <div className="text-xs text-muted-foreground mb-2">{contract.employee_name}</div>
                  <div className="border-b border-gray-300 pb-16"></div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-1">توقيع صاحب العمل</div>
                  <div className="text-xs text-muted-foreground mb-2">{company?.name || ''}</div>
                  <div className="border-b border-gray-300 pb-16"></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 text-center text-xs text-muted-foreground border-t">
              <div className="flex justify-between items-center">
                <span>تم إنشاء هذا العقد آلياً</span>
                <span>
                  <Badge variant={contract.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                    {contract.status === 'active' ? '✓ ساري' : '⏳ منتهي'}
                  </Badge>
                </span>
                <span>{new Date().toLocaleString('ar-SA')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

