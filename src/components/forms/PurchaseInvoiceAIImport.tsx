import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, AlertCircle, X, Files, ArrowLeftRight, Eye, Pencil, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { InvoiceReconciliation } from './InvoiceReconciliation';
import { useAIInvoiceImport } from './purchase-invoice-ai/useAIInvoiceImport';
import { EditBatchInvoiceDialog } from './purchase-invoice-ai/EditBatchInvoiceDialog';
import { BatchTimelinePanel } from './purchase-invoice-ai/BatchTimelinePanel';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingResult = editingIndex !== null ? hook.batchResults.find(r => r.index === editingIndex) ?? null : null;

  return (
    <Dialog open={open} onOpenChange={hook.handleClose}>
      <DialogContent className={hook.selectedBatchResult ? "max-w-6xl max-h-[90vh] overflow-y-auto" : "max-w-4xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            استيراد فواتير مشتريات بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            ارفع فاتورة واحدة أو عدة فواتير (حتى 500) وسيتم استخراج البيانات تلقائياً
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

              {/* Live timeline panel أثناء المعالجة */}
              {hook.isBatchMode && hook.batchTimeline.length > 0 && (
                <div className="mt-4 text-right">
                  <BatchTimelinePanel entries={hook.batchTimeline} />
                </div>
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
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => hook.setReconciliationResults(null)} className="gap-1">
                  ← العودة لنتائج التحليل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={hook.handleReconcile}
                  disabled={hook.isReconciling || hook.batchResults.length === 0}
                  className="gap-2"
                  title="إعادة تشغيل فحص التحقق/التكرار باستخدام نفس البيانات المُحلَّلة (بدون إعادة رفع الملفات)"
                >
                  {hook.isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  إعادة فحص التحقق
                </Button>
              </div>

              {hook.batchTimeline.length > 0 && (
                <BatchTimelinePanel entries={hook.batchTimeline} defaultCollapsed />
              )}

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
              {/* Batch execution timeline */}
              {hook.batchTimeline.length > 0 && (
                <BatchTimelinePanel entries={hook.batchTimeline} defaultCollapsed />
              )}

              {/* Summary Card */}
              {(() => {
                const successResults = hook.batchResults.filter(r => r.success);
                const totalSubtotal = successResults.reduce((sum, r) => sum + (r.data.subtotal || (r.data.total_amount - (r.data.vat_amount || 0))), 0);
                const totalVAT = successResults.reduce((sum, r) => sum + (r.data.vat_amount || 0), 0);
                const totalAmount = successResults.reduce((sum, r) => sum + r.data.total_amount, 0);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">عدد الفواتير</p>
                      <p className="text-lg font-bold text-primary">{successResults.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">الإجمالي قبل الضريبة</p>
                      <p className="text-lg font-bold">{hook.formatCurrency(totalSubtotal)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">إجمالي الضريبة</p>
                      <p className="text-lg font-bold text-warning">{hook.formatCurrency(totalVAT)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">الإجمالي شامل الضريبة</p>
                      <p className="text-lg font-bold text-success">{hook.formatCurrency(totalAmount)}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg border border-success/30">
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
                    onEdit={() => setEditingIndex(result.index)}
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
                onEdit={() => setEditingIndex(hook.selectedBatchResult!.index)}
                attachmentFile={hook.selectedBatchResult.fileObject}
                attachmentThumbnail={hook.selectedBatchResult.thumbnailUrl}
                attachmentName={hook.selectedBatchResult.fileName}
                confirmLabel="استيراد هذه الفاتورة"
                resetLabel="العودة للقائمة"
              />
            </div>
          )}
        </div>
      </DialogContent>
      <EditBatchInvoiceDialog
        open={editingIndex !== null}
        onOpenChange={(o) => { if (!o) setEditingIndex(null); }}
        result={editingResult}
        onSave={(updated) => { hook.handleUpdateBatchResult(updated); setEditingIndex(null); }}
      />
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

function SingleInvoicePreview({ data, formatCurrency, onReset, onConfirm, onEdit, attachmentFile, attachmentThumbnail, attachmentName, confirmLabel = 'اعتماد وتعبئة النموذج', resetLabel = 'رفع فاتورة أخرى' }: {
  data: any; formatCurrency: (val: number) => string; onReset: () => void; onConfirm: () => void; onEdit?: () => void;
  attachmentFile?: File; attachmentThumbnail?: string; attachmentName?: string;
  confirmLabel?: string; resetLabel?: string;
}) {
  // Build attachment URL (image thumbnail or PDF object URL)
  const isPdf = attachmentFile?.type === 'application/pdf' || attachmentName?.toLowerCase().endsWith('.pdf');
  const isImage = attachmentFile?.type?.startsWith('image/') || !!attachmentThumbnail;
  const pdfUrl = isPdf && attachmentFile ? URL.createObjectURL(attachmentFile) : undefined;
  const hasAttachment = !!(attachmentThumbnail || pdfUrl);
  
  // Zoom state for image
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5;
  const maxZoom = 3;
  const zoomStep = 0.25;
  
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg border border-success/30">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">تم استخراج البيانات بنجاح - يرجى المراجعة قبل الاعتماد</span>
      </div>

      <div className={hasAttachment ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
        {/* Attachment preview side */}
        {hasAttachment && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">📎 صورة الفاتورة الأصلية</p>
              {attachmentName && <p className="text-[10px] text-muted-foreground truncate max-w-[180px]" title={attachmentName}>{attachmentName}</p>}
            </div>
            <div className="border rounded-lg overflow-hidden bg-muted/20 sticky top-0" style={{ maxHeight: '600px' }}>
              {isImage && attachmentThumbnail && (
                <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
                  {/* Zoom Controls */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= minZoom}
                      title="تصغير"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium px-2 min-w-[50px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= maxZoom}
                      title="تكبير"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={handleResetZoom}
                      disabled={zoomLevel === 1}
                    >
                      إعادة
                    </Button>
                  </div>
                  <img 
                    src={attachmentThumbnail} 
                    alt="فاتورة" 
                    className="w-full h-auto object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  />
                </div>
              )}
              {isPdf && pdfUrl && (
                <iframe src={pdfUrl} className="w-full h-[600px]" title="فاتورة PDF" />
              )}
            </div>
          </div>
        )}

        {/* Data side */}
        <div className="space-y-4">
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
            {data.discount != null && data.discount > 0 && <div className="flex justify-between w-full text-sm text-destructive"><span>خصم:</span><span className="font-mono">-{formatCurrency(data.discount)}</span></div>}
            {data.vat_amount != null && <div className="flex justify-between w-full text-sm"><span>ضريبة القيمة المضافة ({data.vat_rate || 15}%):</span><span className="font-mono">{formatCurrency(data.vat_amount)}</span></div>}
            <div className="flex justify-between w-full text-base font-bold border-t pt-2 mt-1"><span>الإجمالي:</span><span className="font-mono">{formatCurrency(data.total_amount)}</span></div>
          </div>
          {data.notes && (
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-warning" /><span className="text-xs font-medium text-warning">ملاحظات</span></div>
              <p className="text-sm">{data.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={onReset}>{resetLabel}</Button>
        {onEdit && (
          <Button variant="secondary" onClick={onEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            تعديل البيانات
          </Button>
        )}
        <Button onClick={onConfirm} className="gap-2"><CheckCircle className="w-4 h-4" />{confirmLabel}</Button>
      </div>
    </div>
  );
}

function BatchInvoiceCard({ result, formatCurrency, onPreview, onImportSingle, onEdit }: {
  result: any; formatCurrency: (val: number) => string; onPreview: () => void; onImportSingle: () => void; onEdit: () => void;
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
            {data.supplier_branch_name && data.supplier_branch_name !== data.supplier_name && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0" title="اسم الفرع/المحطة">
                {data.supplier_branch_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{data.invoice_number}</span>
            <span>{data.invoice_date}</span>
            <span>{data.items?.length || 0} أصناف</span>
            {data.supplier_tax_number && <span className="font-mono text-[10px]">ض: {data.supplier_tax_number}</span>}
          </div>
        </div>
        <div className="text-left shrink-0 space-y-0.5">
          <div className="text-[10px] text-muted-foreground">صافي: <span className="font-mono">{formatCurrency(data.subtotal || (data.total_amount - (data.vat_amount || 0)))}</span></div>
          <div className="text-[10px] text-muted-foreground">ضريبة: <span className="font-mono">{formatCurrency(data.vat_amount || 0)}</span></div>
          <div className="text-sm font-bold font-mono text-primary">{formatCurrency(data.total_amount)}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onPreview} title="معاينة"><Eye className="w-3 h-3" /></Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onEdit} title="تعديل البيانات والمرفق"><Pencil className="w-3 h-3" /></Button>
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
