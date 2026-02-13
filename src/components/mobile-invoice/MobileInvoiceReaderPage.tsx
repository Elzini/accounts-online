import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Smartphone, Camera, FileText, CheckCircle, QrCode, Upload, Eye, Building2, Trash2, AlertTriangle, CameraOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { decodeZatcaQRData, type ZatcaQRData } from '@/lib/zatcaQR';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedInvoice {
  id: string;
  data: ZatcaQRData;
  rawBase64: string;
  scannedAt: string;
  isValid: boolean;
  phase2: boolean;
}

interface TaxLookupResult {
  name: string;
  vatNumber: string;
  address: string;
  found: boolean;
}

export function MobileInvoiceReaderPage() {
  const [scannedInvoices, setScannedInvoices] = useState<ScannedInvoice[]>([]);
  const [manualQR, setManualQR] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ScannedInvoice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-camera-reader';

  const processQRData = useCallback((base64Data: string) => {
    const trimmed = base64Data.trim();
    const decoded = decodeZatcaQRData(trimmed);
    if (!decoded) {
      toast.error('لا يمكن قراءة بيانات QR - تأكد أنها فاتورة ZATCA صالحة');
      return;
    }

    const isValidVat = decoded.vatNumber?.length === 15 && decoded.vatNumber.startsWith('3');
    const phase2 = !!(decoded.invoiceHash || decoded.ecdsaSignature);

    const invoice: ScannedInvoice = {
      id: crypto.randomUUID(),
      data: decoded,
      rawBase64: trimmed,
      scannedAt: new Date().toISOString(),
      isValid: isValidVat && !!decoded.sellerName && decoded.invoiceTotal > 0,
      phase2,
    };

    setScannedInvoices(prev => [invoice, ...prev]);
    toast.success(`تم قراءة فاتورة ${decoded.sellerName || 'غير معروف'} بنجاح`);
    setManualQR('');
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          processQRData(decodedText);
          // Don't stop camera - allow continuous scanning
        },
        () => {
          // Ignore scan failures (no QR in frame)
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err?.message || 'تعذر الوصول إلى الكاميرا. تأكد من منح إذن الكاميرا.');
      setCameraActive(false);
    }
  }, [processQRData]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop();
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleManualScan = () => {
    if (!manualQR.trim()) return;
    processQRData(manualQR);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as text (for Base64 QR data files)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        // Try to extract Base64 from the text
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 20) {
            try {
              atob(trimmed); // Validate it's Base64
              processQRData(trimmed);
              return;
            } catch {
              // Not valid Base64, continue
            }
          }
        }
        toast.error('لم يتم العثور على بيانات QR صالحة في الملف');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const lookupTaxNumber = () => {
    if (!taxNumber.trim()) return;
    const cleaned = taxNumber.replace(/\D/g, '');
    if (cleaned.length !== 15 || !cleaned.startsWith('3')) {
      toast.error('الرقم الضريبي يجب أن يكون 15 رقماً ويبدأ بـ 3');
      return;
    }

    // Open ZATCA official verification portal
    const zatcaUrl = `https://zatca.gov.sa/ar/eServices/Pages/TaxpayerSearch.aspx`;
    window.open(zatcaUrl, '_blank');
    toast.success('تم فتح بوابة هيئة الزكاة والضريبة للتحقق من الرقم الضريبي');
  };

  const deleteInvoice = (id: string) => {
    setScannedInvoices(prev => prev.filter(i => i.id !== id));
    toast.success('تم حذف الفاتورة');
  };

  const viewInvoice = (inv: ScannedInvoice) => {
    setSelectedInvoice(inv);
    setShowDetail(true);
  };

  const verifiedCount = scannedInvoices.filter(i => i.isValid).length;
  const totalAmount = scannedInvoices.reduce((s, i) => s + (i.data.invoiceTotal || 0), 0);
  const totalVat = scannedInvoices.reduce((s, i) => s + (i.data.vatAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">قراءة الفاتورة الإلكترونية</h1>
          <p className="text-muted-foreground">مسح QR Code المطابق لنظام فاتورة (ZATCA) والبحث بالرقم الضريبي</p>
        </div>
        <Badge variant="outline" className="gap-1"><Smartphone className="w-3 h-3" />ZATCA متوافق</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{scannedInvoices.length}</div><p className="text-sm text-muted-foreground">فواتير ممسوحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{verifiedCount}</div><p className="text-sm text-muted-foreground">تم التحقق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{totalAmount.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الفواتير</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{totalVat.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الضريبة</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QR Scanner */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" />مسح QR Code - ZATCA</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Scanner */}
            <div className="space-y-2">
              <div id={scannerContainerId} className={`w-full rounded-lg overflow-hidden ${cameraActive ? '' : 'hidden'}`} />
              {cameraError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <CameraOff className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
              <div className="flex gap-2">
                {!cameraActive ? (
                  <Button className="w-full gap-2" variant="default" onClick={startCamera}>
                    <Camera className="w-4 h-4" />فتح الكاميرا للمسح
                  </Button>
                ) : (
                  <Button className="w-full gap-2" variant="destructive" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4" />إيقاف الكاميرا
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label>أو الصق بيانات QR (Base64)</Label>
              <Input
                placeholder="الصق بيانات QR المشفرة هنا..."
                value={manualQR}
                onChange={e => setManualQR(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button className="w-full gap-2" onClick={handleManualScan} disabled={!manualQR.trim()}>
              <QrCode className="w-4 h-4" />قراءة بيانات QR
            </Button>
            <Separator />
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />رفع ملف QR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tax Number Lookup */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" />التحقق من الرقم الضريبي - ZATCA</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>الرقم الضريبي (15 رقم)</Label>
              <Input
                placeholder="3XXXXXXXXXXXXXX"
                value={taxNumber}
                onChange={e => setTaxNumber(e.target.value)}
                maxLength={15}
                className="font-mono tracking-wider"
                dir="ltr"
              />
            </div>
            <Button className="w-full gap-2" onClick={lookupTaxNumber}>
              <Building2 className="w-4 h-4" />تحقق من موقع هيئة الزكاة
            </Button>
            <p className="text-xs text-center text-muted-foreground">سيتم فتح بوابة التحقق الرسمية لهيئة الزكاة والضريبة والجمارك</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanned Invoices List */}
      <Card>
        <CardHeader><CardTitle className="text-base">الفواتير الممسوحة</CardTitle></CardHeader>
        <CardContent>
          {scannedInvoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">لا توجد فواتير ممسوحة. امسح QR Code لبدء القراءة.</p>
          ) : (
            <div className="space-y-3">
              {scannedInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{inv.data.sellerName || 'غير معروف'}</p>
                      {inv.phase2 && <Badge variant="outline" className="text-[10px]">Phase 2</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      الرقم الضريبي: <span dir="ltr" className="font-mono">{inv.data.vatNumber}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.data.invoiceDateTime} • الضريبة: {(inv.data.vatAmount || 0).toLocaleString()} ر.س
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="font-bold">{(inv.data.invoiceTotal || 0).toLocaleString()} ر.س</p>
                      <Badge variant={inv.isValid ? 'default' : 'destructive'} className="text-xs">
                        {inv.isValid ? 'صالحة' : 'غير صالحة'}
                      </Badge>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => viewInvoice(inv)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteInvoice(inv.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تفاصيل الفاتورة - ZATCA</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">اسم البائع (Tag 1)</Label>
                  <p className="font-medium">{selectedInvoice.data.sellerName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">الرقم الضريبي (Tag 2)</Label>
                  <p className="font-mono" dir="ltr">{selectedInvoice.data.vatNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">تاريخ الفاتورة (Tag 3)</Label>
                  <p>{selectedInvoice.data.invoiceDateTime}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">الإجمالي شامل الضريبة (Tag 4)</Label>
                  <p className="font-bold">{(selectedInvoice.data.invoiceTotal || 0).toLocaleString()} ر.س</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">مبلغ الضريبة (Tag 5)</Label>
                  <p>{(selectedInvoice.data.vatAmount || 0).toLocaleString()} ر.س</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">الحالة</Label>
                  <Badge variant={selectedInvoice.isValid ? 'default' : 'destructive'}>
                    {selectedInvoice.isValid ? 'فاتورة صالحة' : 'فاتورة غير صالحة'}
                  </Badge>
                </div>
              </div>

              {selectedInvoice.phase2 && (
                <>
                  <Separator />
                  <div>
                    <Badge variant="outline" className="mb-2">Phase 2 - المرحلة الثانية</Badge>
                    {selectedInvoice.data.invoiceHash && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Hash (Tag 6)</Label>
                        <p className="font-mono text-[10px] break-all" dir="ltr">{selectedInvoice.data.invoiceHash}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">تاريخ المسح</Label>
                <p className="text-sm">{new Date(selectedInvoice.scannedAt).toLocaleString('ar-SA')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
