/**
 * BatchTimelinePanel
 * لوحة سجل زمني لتنفيذ الدفعات أثناء استيراد الفواتير بالذكاء الاصطناعي.
 * تعرض لكل دفعة: chunkSize، عدد المحاولات، تغييرات Shrink/Grow، الحالة والمدة.
 */
import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BatchTimelineEntry } from './types';

interface BatchTimelinePanelProps {
  entries: BatchTimelineEntry[];
  defaultCollapsed?: boolean;
}

const formatDuration = (ms?: number) => {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m ${r}s`;
};

const formatTime = (ts?: number) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const StatusBadge = ({ status }: { status: BatchTimelineEntry['status'] }) => {
  switch (status) {
    case 'running':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          قيد المعالجة
        </Badge>
      );
    case 'success':
      return (
        <Badge className="gap-1 bg-success/15 text-success hover:bg-success/20 border border-success/30">
          <CheckCircle2 className="w-3 h-3" />
          نجاح
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          فشل
        </Badge>
      );
    case 'shrunk':
      return (
        <Badge className="gap-1 bg-warning/15 text-warning hover:bg-warning/20 border border-warning/30">
          <TrendingDown className="w-3 h-3" />
          تقليص + إعادة
        </Badge>
      );
    default:
      return null;
  }
};

export function BatchTimelinePanel({ entries, defaultCollapsed = false }: BatchTimelinePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const stats = useMemo(() => {
    const total = entries.length;
    const success = entries.filter((e) => e.status === 'success').length;
    const failed = entries.filter((e) => e.status === 'failed').length;
    const running = entries.filter((e) => e.status === 'running').length;
    const shrinks = entries.filter((e) => e.sizeChange?.type === 'shrink').length;
    const grows = entries.filter((e) => e.sizeChange?.type === 'grow').length;
    const totalRetries = entries.reduce(
      (sum, e) => sum + Math.max(0, (e.attempts ?? 0) - 1),
      0,
    );
    const avgDuration =
      entries.filter((e) => e.durationMs).reduce((s, e) => s + (e.durationMs || 0), 0) /
      Math.max(1, entries.filter((e) => e.durationMs).length);
    return { total, success, failed, running, shrinks, grows, totalRetries, avgDuration };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">سجل تنفيذ الدفعات</span>
          <Badge variant="outline" className="text-xs">
            {stats.total} دفعة
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* مؤشرات سريعة */}
          {stats.success > 0 && (
            <Badge className="bg-success/15 text-success hover:bg-success/20 border border-success/30 text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {stats.success}
            </Badge>
          )}
          {stats.failed > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <XCircle className="w-3 h-3" />
              {stats.failed}
            </Badge>
          )}
          {stats.shrinks > 0 && (
            <Badge className="bg-warning/15 text-warning hover:bg-warning/20 border border-warning/30 text-xs gap-1">
              <TrendingDown className="w-3 h-3" />
              {stats.shrinks}
            </Badge>
          )}
          {stats.grows > 0 && (
            <Badge className="bg-info/15 text-info hover:bg-info/20 border border-info/30 text-xs gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.grows}
            </Badge>
          )}
          {stats.totalRetries > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <RefreshCw className="w-3 h-3" />
              {stats.totalRetries} retry
            </Badge>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t">
          {/* صف ملخص */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-xs bg-muted/30 border-b">
            <div className="flex flex-col">
              <span className="text-muted-foreground">إجمالي الدفعات</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">إجمالي إعادات المحاولة</span>
              <span className="font-semibold">{stats.totalRetries}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Shrink / Grow</span>
              <span className="font-semibold">
                {stats.shrinks} / {stats.grows}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">متوسط مدة الدفعة</span>
              <span className="font-semibold">{formatDuration(stats.avgDuration)}</span>
            </div>
          </div>

          {/* الجدول الزمني */}
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                <tr className="text-right">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">الوقت</th>
                  <th className="px-3 py-2 font-medium">الحجم</th>
                  <th className="px-3 py-2 font-medium">المحاولات</th>
                  <th className="px-3 py-2 font-medium">الحالة</th>
                  <th className="px-3 py-2 font-medium">المدة</th>
                  <th className="px-3 py-2 font-medium">نجاح / فشل</th>
                  <th className="px-3 py-2 font-medium">تغيير الحجم</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      #{e.chunkNumber}
                    </td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(e.startedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="font-mono">
                        {e.chunkSizeUsed}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          (e.attempts ?? 0) > 1
                            ? 'font-semibold text-warning'
                            : 'text-muted-foreground'
                        }
                      >
                        {e.attempts}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {formatDuration(e.durationMs)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono">
                        {e.successCount !== undefined || e.errorCount !== undefined ? (
                          <>
                            <span className="text-success">
                              {e.successCount ?? 0}
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-destructive">
                              {e.errorCount ?? 0}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {e.sizeChange ? (
                        <Badge
                          className={
                            e.sizeChange.type === 'shrink'
                              ? 'gap-1 bg-warning/15 text-warning hover:bg-warning/20 border border-warning/30'
                              : 'gap-1 bg-info/15 text-info hover:bg-info/20 border border-info/30'
                          }
                          title={e.sizeChange.reason}
                        >
                          {e.sizeChange.type === 'shrink' ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {e.sizeChange.from} → {e.sizeChange.to}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* رسائل الأخطاء (إن وُجدت) */}
          {entries.some((e) => e.errorMessage) && (
            <div className="border-t p-3 space-y-1 bg-destructive/5">
              <div className="text-xs font-semibold text-destructive">
                رسائل الأخطاء:
              </div>
              {entries
                .filter((e) => e.errorMessage)
                .map((e) => (
                  <div key={`err-${e.id}`} className="text-xs text-destructive/90 font-mono">
                    دفعة #{e.chunkNumber} (حجم {e.chunkSizeUsed}): {e.errorMessage}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default BatchTimelinePanel;
