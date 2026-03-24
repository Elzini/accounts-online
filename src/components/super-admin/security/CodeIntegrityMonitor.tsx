import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCodeIntegrityHashes } from '@/hooks/modules/useSuperAdminServices';

export function CodeIntegrityMonitor() {
  const { data: hashes = [], isLoading } = useCodeIntegrityHashes();
  const criticalFiles = [
    { path: 'src/core/engine/invoicePostingEngine.ts', category: 'المنطق المحاسبي' },
    { path: 'src/services/taxCalculations.ts', category: 'حسابات الضرائب' },
    { path: 'src/services/trialBalance.ts', category: 'ميزان المراجعة' },
    { path: 'src/services/financialStatements.ts', category: 'القوائم المالية' },
    { path: 'src/services/journalEntryService.ts', category: 'القيود المحاسبية' },
    { path: 'src/services/salesJournal.ts', category: 'قيود المبيعات' },
    { path: 'src/services/encryption.ts', category: 'التشفير والأمان' },
    { path: 'src/services/auditLogs.ts', category: 'سجلات التدقيق' },
    { path: 'src/services/dataIntegrityService.ts', category: 'سلامة البيانات' },
  ];

  const verifiedCount = hashes.filter((h: any) => h.status === 'verified').length;
  const tamperedCount = hashes.filter((h: any) => h.status === 'tampered').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary">{criticalFiles.length}</div>
            <p className="text-sm text-muted-foreground">ملف حرج مراقب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-600">{verifiedCount}</div>
            <p className="text-sm text-muted-foreground">ملف تم التحقق منه</p>
          </CardContent>
        </Card>
        <Card className={tamperedCount > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-4 text-center">
            <div className={`text-3xl font-bold ${tamperedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {tamperedCount}
            </div>
            <p className="text-sm text-muted-foreground">تعديل مشبوه</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            الملفات الحرجة المراقبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {criticalFiles.map((file) => {
                const hash = hashes.find((h: any) => h.file_path === file.path);
                const isVerified = hash?.status === 'verified';
                return (
                  <div key={file.path} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-mono">{file.path}</p>
                        <p className="text-xs text-muted-foreground">{file.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hash ? (
                        <Badge className={isVerified ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                          {isVerified ? <CheckCircle2 className="h-3 w-3 ml-1" /> : <AlertTriangle className="h-3 w-3 ml-1" />}
                          {isVerified ? 'سليم' : 'تم التعديل!'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <ShieldCheck className="h-3 w-3 ml-1" />
                          محمي
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Protection Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">آلية الحماية</p>
                <ul className="text-muted-foreground list-disc list-inside mt-1 space-y-1">
                  <li>يتم حساب Hash (SHA-256) لكل ملف حرج</li>
                  <li>أي تعديل يُكتشف فوراً ويتم حظر التنفيذ</li>
                  <li>يتم تسجيل كل محاولة تعديل في سجل الحوادث الأمنية</li>
                  <li>يتم إخطار مدير النظام فوراً</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
