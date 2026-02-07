// لوحة سجل التدقيق لعمليات القوائم المالية
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, Upload, FileCheck, Edit3, Plus, Shield, 
  Zap, Trash2, FileText, Calculator, Database, FileSpreadsheet,
  GitBranch, Coins, Clock
} from 'lucide-react';
import { AuditLogEntry, AuditAction, getActionLabel, formatAuditTime, formatAuditDate } from '@/services/importAuditLog';

interface AuditTrailPanelProps {
  entries: AuditLogEntry[];
  onClear?: () => void;
}

const ACTION_ICONS: Record<AuditAction, React.ReactNode> = {
  file_uploaded: <Upload className="w-3.5 h-3.5" />,
  file_parsed: <FileCheck className="w-3.5 h-3.5" />,
  mapping_changed: <Edit3 className="w-3.5 h-3.5" />,
  missing_accounts_added: <Plus className="w-3.5 h-3.5" />,
  validation_run: <Shield className="w-3.5 h-3.5" />,
  statements_generated: <Zap className="w-3.5 h-3.5" />,
  branch_selected: <GitBranch className="w-3.5 h-3.5" />,
  currency_changed: <Coins className="w-3.5 h-3.5" />,
  data_cleared: <Trash2 className="w-3.5 h-3.5" />,
  export_pdf: <FileText className="w-3.5 h-3.5" />,
  export_excel: <FileSpreadsheet className="w-3.5 h-3.5" />,
  system_calculation: <Database className="w-3.5 h-3.5" />,
  medad_import: <Calculator className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  file_uploaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  file_parsed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  mapping_changed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  missing_accounts_added: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  validation_run: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  statements_generated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  branch_selected: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  currency_changed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  data_cleared: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  export_pdf: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  export_excel: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  system_calculation: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  medad_import: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export function AuditTrailPanel({ entries, onClear }: AuditTrailPanelProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">لا توجد عمليات مسجلة بعد</p>
            <p className="text-xs mt-1">سيتم تسجيل جميع عمليات الاستيراد والتعديل هنا</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // تجميع حسب التاريخ
  const grouped = entries.reduce<Record<string, AuditLogEntry[]>>((acc, entry) => {
    const dateKey = formatAuditDate(entry.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            سجل التدقيق
            <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
          </CardTitle>
          {onClear && entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs gap-1">
              <Trash2 className="w-3 h-3" /> مسح السجل
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {Object.entries(grouped).reverse().map(([date, dateEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">{date}</span>
                </div>
                <div className="space-y-1.5 mr-4 border-r-2 border-muted pr-3">
                  {dateEntries.reverse().map(entry => (
                    <div key={entry.id} className="flex items-start gap-2 text-sm">
                      <div className={`p-1 rounded ${ACTION_COLORS[entry.action] || 'bg-muted'}`}>
                        {ACTION_ICONS[entry.action] || <ClipboardList className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">{getActionLabel(entry.action)}</span>
                          <span className="text-xs text-muted-foreground">{formatAuditTime(entry.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{entry.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
