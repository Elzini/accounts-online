import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, AlertCircle, X, Files, ArrowLeftRight, Eye } from 'lucide-react';
import { InvoiceReconciliation } from './InvoiceReconciliation';
import { useAIInvoiceImport } from './purchase-invoice-ai/useAIInvoiceImport';

// Re-export types for backward compatibility
export type { ParsedInvoiceData, BatchParsedResult } from './purchase-invoice-ai/types';

interface PurchaseInvoiceAIImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any) => void;
  onBatchImport?: (results: any[], costCenterId?: string | null) => void;
}

export function PurchaseInvoiceAIImport({ open, onOpenChange, onImport, onBatchImport }: PurchaseInvoiceAIImportProps) {
  const hook = useAIInvoiceImport({ onImport, onBatchImport, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={hook.handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            استيراد فواتير مشتريات بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            ارفع فاتورة واحدة أو عدة فواتير (حتى 40+) وسيتم استخراج البيانات تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          {!hook.parsedData && hook.batchResults.length === 0 && !hook.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                onClick={() => hook.fileInputRef.current?.click()}
              >
                <input ref={hook.fileInputRef} type="file" accept=".pdf,image/*" onChange={hook.handleSingleFileSelect} className="hidden" />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">رفع فاتورة واحدة</p>
                <p className="text-xs text-muted-foreground mt-1">PDF أو صورة</p>
              </div>
              <div
                className="border-2 border-dashed border-accent/50 rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                onClick={() => hook.batchFileInputRef.current?.click()}
              >
                <input ref={hook.batchFileInputRef} type="file" accept=".pdf,image/*" multiple onChange={hook.handleBatchFileSelect} className="hidden" />
                <Files className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">رفع عدة فواتير دفعة واحدة</p>
                <p className="text-xs text-muted-foreground mt-1">اختر عدة ملفات PDF أو صور</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {hook.isLoading && (
            <div className="p-8 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              {hook.isBatchMode ? (
                <>
                  <p className="text-sm font-medium">جاري تحليل الفواتير بالذكاء الاصطناعي...</p>
                  <div className="max-w-xs mx-auto space-y-2">
                    <Progress value={(hook.progress / hook.totalFiles) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{hook.progress} من {hook.totalFiles} فاتورة</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">جاري تحليل الفاتورة بالذكاء الاصطناعي...</p>
                  <p className="text-xs text-muted-foreground">{hook.fileName}</p>
                </>
              )}
            </div>
          )}

          {/* Single parsed result */}
          {hook.parsedData && !hook.isBatchMode && (
            <SingleInvoicePreview
              data={hook.parsedData}
              formatCurrency={hook.formatCurrency}
              onReset={() => { hook.setParsedData(null); }}
              onConfirm={hook.handleConfirmImport}
            />
          )}

          {/* Reconciliation View */}
          {hook.reconciliationResults && !hook.selectedBatchResult && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => hook.setReconciliationResults(null)} className="gap-1">
                ← العودة لنتائج التحليل
              </Button>

              {hook.costCenters.filter(cc => cc.is_active).length > 0 && (
                <CostCenterSelector costCenters={hook.costCenters} value={hook.selectedCostCenterId} onChange={hook.setSelectedCostCenterId} />
              )}

              <InvoiceReconciliation
                results={hook.reconciliationResults}
                formatCurrency={hook.formatCurrency}
                onImportSelected={hook.handleImportFromReconciliation}
                onViewDetails={(result) => hook.setSelectedBatchIndex(result.index)}
                onUpdateExisting={hook.handleUpdateExisting}
                onClose={hook.handleClose}
              />
            </div>
          )}

          {/* Batch results */}
          {!hook.isLoading && hook.isBatchMode && hook.batchResults.length > 0 && !hook.selectedBatchResult && !hook.reconciliationResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  تم تحليل {hook.batchResults.filter(r => r.success).length} فاتورة بنجاح
                  {hook.batchErrors.length > 0 && ` | فشل ${hook.batchErrors.length}`}
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                {hook.batchResults.filter(r => r.success).map((result) => (
                  <BatchInvoiceCard
                    key={result.index}
                    result={result}
                    formatCurrency={hook.formatCurrency}
                    onPreview={() => hook.setSelectedBatchIndex(result.index)}
                    onImportSingle={() => hook.handleImportSingleFromBatch(result)}
                  />
                ))}
                {hook.batchErrors.map((err) => (
                  <div key={`err-${err.index}`} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex items-center gap-3">
                    <Badge variant="destructive" className="text-xs shrink-0"><X className="w-3 h-3 ml-1" />فشل</Badge>
                    <span className="text-xs truncate">{err.fileName}</span>
                    <span className="text-xs text-destructive">{err.error}</span>
                  </div>
                ))}
              </div>

              {hook.costCenters.filter(cc => cc.is_active).length > 0 && (
                <CostCenterSelector costCenters={hook.costCenters} value={hook.selectedCostCenterId} onChange={hook.setSelectedCostCenterId} />
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={hook.handleClose}>إغلاق</Button>
                <Button variant="secondary" onClick={hook.handleReconcile} disabled={hook.isReconciling} className="gap-2">
                  {hook.isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  مطابقة مع فواتير النظام
                </Button>
                {onBatchImport && (
                  <Button onClick={hook.handleConfirmBatchImport} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    استيراد الكل ({hook.batchResults.filter(r => r.success).length} فاتورة)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Batch single preview */}
          {hook.selectedBatchResult && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => hook.setSelectedBatchIndex(null)} className="gap-1">
                ← العودة للقائمة
              </Button>
              <SingleInvoicePreview
                data={hook.selectedBatchResult.data}
                formatCurrency={hook.formatCurrency}
                onReset={() => hook.setSelectedBatchIndex(null)}
                onConfirm={() => hook.handleImportSingleFromBatch(hook.selectedBatchResult!)}
                confirmLabel="استيراد هذه الفاتورة"
                resetLabel="العودة للقائمة"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────

function CostCenterSelector({ costCenters, value, onChange }: { costCenters: any[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      <Label className="text-sm font-medium whitespace-nowrap">مركز التكلفة:</Label>
      <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
        <SelectTrigger className="h-9 text-xs max-w-[250px]">
          <SelectValue placeholder="اختر مركز التكلفة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">بدون مركز تكلفة</SelectItem>
          {costCenters.filter(cc => cc.is_active).map((cc) => (
            <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SingleInvoicePreview({ data, formatCurrency, onReset, onConfirm, confirmLabel = 'اعتماد وتعبئة النموذج', resetLabel = 'رفع فاتورة أخرى' }: {
  data: any; formatCurrency: (val: number) => string; onReset: () => void; onConfirm: () => void; confirmLabel?: string; resetLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">تم استخراج البيانات بنجاح - يرجى المراجعة قبل الاعتماد</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
        <div><p className="text-xs text-muted-foreground">المورد</p><p className="font-bold text-sm">{data.supplier_name}</p></div>
        <div><p className="text-xs text-muted-foreground">رقم الفاتورة</p><p className="font-bold text-sm">{data.invoice_number}</p></div>
        <div><p className="text-xs text-muted-foreground">التاريخ</p><p className="text-sm">{data.invoice_date}</p></div>
        {data.supplier_tax_number && <div><p className="text-xs text-muted-foreground">الرقم الضريبي</p><p className="text-sm font-mono">{data.supplier_tax_number}</p></div>}
        {data.supplier_phone && <div><p className="text-xs text-muted-foreground">الهاتف</p><p className="text-sm">{data.supplier_phone}</p></div>}
        {data.supplier_address && <div><p className="text-xs text-muted-foreground">العنوان</p><p className="text-sm">{data.supplier_address}</p></div>}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-center">الكمية</TableHead>
              <TableHead className="text-left">سعر الوحدة</TableHead>
              <TableHead className="text-left">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="text-right text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="text-right">{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-left font-mono">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell className="text-left font-mono font-medium">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-start gap-1 p-4 bg-muted/30 rounded-lg border">
        {data.subtotal != null && <div className="flex justify-between w-full text-sm"><span>المجموع قبل الضريبة:</span><span className="font-mono">{formatCurrency(data.subtotal)}</span></div>}
        {data.discount != null && data.discount > 0 && <div className="flex justify-between w-full text-sm text-red-600"><span>خصم:</span><span className="font-mono">-{formatCurrency(data.discount)}</span></div>}
        {data.vat_amount != null && <div className="flex justify-between w-full text-sm"><span>ضريبة القيمة المضافة ({data.vat_rate || 15}%):</span><span className="font-mono">{formatCurrency(data.vat_amount)}</span></div>}
        <div className="flex justify-between w-full text-base font-bold border-t pt-2 mt-1"><span>الإجمالي:</span><span className="font-mono">{formatCurrency(data.total_amount)}</span></div>
      </div>
      {data.notes && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-yellow-600" /><span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">ملاحظات</span></div>
          <p className="text-sm">{data.notes}</p>
        </div>
      )}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onReset}>{resetLabel}</Button>
        <Button onClick={onConfirm} className="gap-2"><CheckCircle className="w-4 h-4" />{confirmLabel}</Button>
      </div>
    </div>
  );
}

function BatchInvoiceCard({ result, formatCurrency, onPreview, onImportSingle }: {
  result: any; formatCurrency: (val: number) => string; onPreview: () => void; onImportSingle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const data = result.data;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-16 rounded border bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
          {result.thumbnailUrl ? <img src={result.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">#{result.index + 1}</span>
            <span className="text-sm font-bold truncate">{data.supplier_name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{data.invoice_number}</span>
            <span>{data.invoice_date}</span>
            <span>{data.items?.length || 0} أصناف</span>
          </div>
        </div>
        <div className="text-left shrink-0 space-y-0.5">
          <div className="text-[10px] text-muted-foreground">صافي: <span className="font-mono">{formatCurrency(data.subtotal || (data.total_amount - (data.vat_amount || 0)))}</span></div>
          <div className="text-[10px] text-muted-foreground">ضريبة: <span className="font-mono">{formatCurrency(data.vat_amount || 0)}</span></div>
          <div className="text-sm font-bold font-mono text-primary">{formatCurrency(data.total_amount)}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onPreview}><Eye className="w-3 h-3" /></Button>
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={onImportSingle}>استيراد</Button>
        </div>
      </div>
      {expanded && data.items && data.items.length > 0 && (
        <div className="border-t bg-muted/10 p-2">
          <table className="w-full text-[11px]">
            <thead><tr className="text-muted-foreground"><th className="text-right p-1 font-medium">#</th><th className="text-right p-1 font-medium">الوصف</th><th className="text-center p-1 font-medium">الكمية</th><th className="text-left p-1 font-medium">السعر</th><th className="text-left p-1 font-medium">الإجمالي</th></tr></thead>
            <tbody>
              {data.items.map((item: any, i: number) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="p-1 text-right text-muted-foreground">{i + 1}</td>
                  <td className="p-1 text-right">{item.description}</td>
                  <td className="p-1 text-center">{item.quantity}</td>
                  <td className="p-1 text-left font-mono">{formatCurrency(item.unit_price)}</td>
                  <td className="p-1 text-left font-mono font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
