import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParsedLog {
  employee_code: string;
  punch_time: string;
  punch_type: string;
  verification: string;
}

export function ImportLogsPanel() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedLog[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileFormat, setFileFormat] = useState('zk_dat');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const { data: devices = [] } = useQuery({
    queryKey: ['fingerprint-devices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from('hr_fingerprint_devices').select('*').eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const parseFile = (content: string) => {
    const lines = content.trim().split('\n');
    const parsed: ParsedLog[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

      try {
        if (fileFormat === 'zk_dat') {
          // ZK .dat format: employee_code\tdate time\tverification\ttype\t...
          const parts = trimmed.split('\t');
          if (parts.length >= 2) {
            parsed.push({
              employee_code: parts[0].trim(),
              punch_time: parts[1].trim(),
              punch_type: parts.length > 3 ? (parts[3]?.trim() === '0' ? 'in' : 'out') : 'auto',
              verification: parts.length > 2 ? (['fingerprint', 'face', 'card', 'password'][parseInt(parts[2]) || 0] || 'fingerprint') : 'fingerprint',
            });
          }
        } else if (fileFormat === 'csv') {
          // CSV: employee_code,datetime,type,verification
          const parts = trimmed.split(',');
          if (parts.length >= 2) {
            parsed.push({
              employee_code: parts[0].trim(),
              punch_time: parts[1].trim(),
              punch_type: parts[2]?.trim() || 'auto',
              verification: parts[3]?.trim() || 'fingerprint',
            });
          }
        } else {
          // Generic: space/tab separated
          const parts = trimmed.split(/[\t,;|]+/);
          if (parts.length >= 2) {
            parsed.push({
              employee_code: parts[0].trim(),
              punch_time: parts[1].trim() + (parts[2] ? ' ' + parts[2].trim() : ''),
              punch_type: 'auto',
              verification: 'fingerprint',
            });
          }
        }
      } catch {
        continue;
      }
    }

    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseFile(content);
      setParsedData(parsed);
      if (parsed.length > 0) {
        toast.success(
          language === 'ar'
            ? `تم قراءة ${parsed.length} حركة من الملف`
            : `Read ${parsed.length} records from file`
        );
      } else {
        toast.error(language === 'ar' ? 'لم يتم العثور على بيانات صالحة' : 'No valid data found');
      }
    };
    reader.readAsText(file);
  };

  const importToDatabase = async () => {
    if (!companyId || parsedData.length === 0) return;
    setImporting(true);

    try {
      const logs = parsedData.map(p => ({
        company_id: companyId,
        device_id: selectedDeviceId || null,
        employee_code: p.employee_code,
        punch_time: new Date(p.punch_time).toISOString(),
        punch_type: p.punch_type,
        verification_method: p.verification,
        source: 'file_import',
        is_processed: false,
      }));

      const { error } = await supabase.from('hr_device_logs').insert(logs);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['device-logs'] });
      toast.success(
        language === 'ar'
          ? `تم استيراد ${logs.length} حركة بنجاح`
          : `Successfully imported ${logs.length} records`
      );
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {language === 'ar' ? 'استيراد بيانات الحركات من ملف' : 'Import Movement Data from File'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ar' ? 'صيغة الملف' : 'File Format'}</label>
              <Select value={fileFormat} onValueChange={setFileFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zk_dat">ZKTeco (.dat) - Tab Separated</SelectItem>
                  <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                  <SelectItem value="generic">{language === 'ar' ? 'عام (مفصول بعلامات)' : 'Generic (Delimited)'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ar' ? 'الجهاز المصدر (اختياري)' : 'Source Device (Optional)'}</label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'بدون جهاز' : 'No device'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{language === 'ar' ? 'بدون جهاز' : 'No device'}</SelectItem>
                  {devices.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.device_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'ar' ? 'ملف البيانات' : 'Data File'}</label>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".dat,.csv,.txt,.log" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                  <FileText className="w-4 h-4" />
                  {language === 'ar' ? 'اختر ملف' : 'Choose File'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">{language === 'ar' ? 'صيغ الملفات المدعومة:' : 'Supported File Formats:'}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>ZKTeco .dat:</strong> {language === 'ar' ? 'كود_الموظف [Tab] التاريخ_والوقت [Tab] طريقة_التحقق [Tab] النوع' : 'emp_code [Tab] datetime [Tab] verify_type [Tab] punch_type'}</li>
              <li><strong>CSV:</strong> {language === 'ar' ? 'كود_الموظف,التاريخ_والوقت,النوع,طريقة_التحقق' : 'emp_code,datetime,type,verification'}</li>
              <li><strong>{language === 'ar' ? 'عام' : 'Generic'}:</strong> {language === 'ar' ? 'كود_الموظف [فاصل] التاريخ_والوقت' : 'emp_code [delimiter] datetime'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{language === 'ar' ? 'البيانات المقروءة' : 'Parsed Data'} ({parsedData.length})</span>
              <Button className="gap-2" onClick={importToDatabase} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {language === 'ar' ? 'استيراد إلى النظام' : 'Import to System'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{language === 'ar' ? 'كود الموظف' : 'Employee Code'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ والوقت' : 'Date/Time'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التحقق' : 'Verification'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono">{row.employee_code}</TableCell>
                      <TableCell dir="ltr">{row.punch_time}</TableCell>
                      <TableCell>
                        <Badge variant={row.punch_type === 'in' ? 'default' : row.punch_type === 'out' ? 'secondary' : 'outline'}>
                          {row.punch_type === 'in' ? (language === 'ar' ? 'حضور' : 'In') : row.punch_type === 'out' ? (language === 'ar' ? 'انصراف' : 'Out') : (language === 'ar' ? 'تلقائي' : 'Auto')}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.verification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 100 && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {language === 'ar' ? `يتم عرض أول 100 من ${parsedData.length} سجل` : `Showing first 100 of ${parsedData.length} records`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
