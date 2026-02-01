import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CustomReport, ReportColumn, ReportFilter, ReportSorting } from '@/services/systemControl';
import { toast } from 'sonner';

interface CustomReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: CustomReport | null;
}

export function CustomReportPreviewDialog({
  open,
  onOpenChange,
  report,
}: CustomReportPreviewDialogProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && report) {
      fetchReportData();
    }
  }, [open, report]);

  const fetchReportData = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get visible columns
      const visibleColumns = report.columns
        .filter(c => c.visible)
        .sort((a, b) => a.order - b.order)
        .map(c => c.field);

      // Build query
      let query = supabase
        .from(report.source_table as any)
        .select(visibleColumns.join(','));

      // Apply filters
      if (report.filters && report.filters.length > 0) {
        report.filters.forEach((filter: ReportFilter) => {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'greater':
              query = query.gt(filter.field, filter.value);
              break;
            case 'less':
              query = query.lt(filter.field, filter.value);
              break;
            case 'in':
              if (Array.isArray(filter.value)) {
                query = query.in(filter.field, filter.value);
              }
              break;
          }
        });
      }

      // Apply sorting
      if (report.sorting && report.sorting.length > 0) {
        report.sorting.forEach((sort: ReportSorting) => {
          query = query.order(sort.field, { ascending: sort.direction === 'asc' });
        });
      }

      // Limit results
      query = query.limit(1000);

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData((result as unknown as Record<string, unknown>[]) || []);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getVisibleColumns = () => {
    if (!report) return [];
    return report.columns
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order);
  };

  const formatCellValue = (value: unknown, field: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Date fields
    if (field.includes('date') && typeof value === 'string') {
      try {
        return format(new Date(value), 'dd/MM/yyyy', { locale: ar });
      } catch {
        return String(value);
      }
    }
    
    // Currency fields
    if (field.includes('price') || field.includes('amount') || field.includes('salary') || field.includes('profit') || field.includes('commission')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR',
        }).format(num);
      }
    }

    return String(value);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !report) return;

    const columns = getVisibleColumns();
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${report.name}</title>
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${report.name}</h1>
        ${report.description ? `<p style="text-align: center; color: #666;">${report.description}</p>` : ''}
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td>${formatCellValue(row[col.field], col.field)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="text-align: center; margin-top: 20px; color: #999;">
          تم إنشاء التقرير في ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleExportCSV = () => {
    if (!report || data.length === 0) return;

    const columns = getVisibleColumns();
    
    // Create CSV content
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.field];
        const formatted = formatCellValue(value, col.field);
        // Escape quotes and wrap in quotes if contains comma
        if (formatted.includes(',') || formatted.includes('"')) {
          return `"${formatted.replace(/"/g, '""')}"`;
        }
        return formatted;
      }).join(',')
    ).join('\n');

    const csv = `\uFEFF${headers}\n${rows}`; // BOM for UTF-8

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير التقرير');
  };

  if (!report) return null;

  const columns = getVisibleColumns();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{report.name}</DialogTitle>
              {report.description && (
                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={data.length === 0}>
                <FileDown className="w-4 h-4 ml-2" />
                تصدير CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={data.length === 0}>
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchReportData} className="mt-4">
                إعادة المحاولة
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد بيانات للعرض
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.field} style={{ width: col.width }}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((col) => (
                      <TableCell key={col.field}>
                        {formatCellValue(row[col.field], col.field)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>عدد السجلات: {data.length}</span>
          <span>
            {data.length >= 1000 && 'تم عرض أول 1000 سجل'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
