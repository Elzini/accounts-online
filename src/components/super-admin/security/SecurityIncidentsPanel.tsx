import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Search, AlertTriangle, Activity, Snowflake } from 'lucide-react';
import { useSecurityIncidents } from '@/hooks/modules/useSuperAdminServices';

export function SecurityIncidentsPanel() {
  const [search, setSearch] = useState('');

  const { data: incidents = [], isLoading } = useSecurityIncidents();
  const filtered = incidents.filter((i: any) =>
    !search ||
    i.description?.includes(search) ||
    i.incident_type?.includes(search)
  );

  const severityConfig: Record<string, { color: string; label: string }> = {
    critical: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'حرج' },
    high: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'عالي' },
    medium: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'متوسط' },
    low: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'منخفض' },
  };

  const incidentTypeLabels: Record<string, string> = {
    code_modification: '💻 تعديل كود',
    schema_change: '🗄️ تغيير هيكل',
    data_deletion: '🗑️ حذف بيانات',
    tax_change: '🏛️ تعديل ضرائب',
    unauthorized_access: '🔐 وصول غير مصرح',
    freeze_bypass: '❄️ محاولة تجاوز التجميد',
    integrity_violation: '⛓️ انتهاك سلسلة التدقيق',
  };

  const criticalCount = incidents.filter((i: any) => i.severity === 'critical').length;
  const autoFreezeCount = incidents.filter((i: any) => i.auto_freeze_triggered).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-foreground">{incidents.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي الحوادث</p>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-4 text-center">
            <div className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {criticalCount}
            </div>
            <p className="text-sm text-muted-foreground">حوادث حرجة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{autoFreezeCount}</div>
            <p className="text-sm text-muted-foreground">تجميد تلقائي</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            سجل الحوادث الأمنية
            <Badge variant="outline">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الحوادث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-green-500" />
                لا توجد حوادث أمنية مسجلة
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((incident: any) => {
                  const severity = severityConfig[incident.severity] || severityConfig.medium;
                  return (
                    <div key={incident.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{incidentTypeLabels[incident.incident_type] || incident.incident_type}</span>
                          <Badge className={severity.color}>{severity.label}</Badge>
                          {incident.auto_freeze_triggered && (
                            <Badge className="bg-blue-500/10 text-blue-600">
                              <Snowflake className="h-3 w-3 ml-1" />
                              تجميد تلقائي
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.created_at).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-sm">{incident.description}</p>
                      {incident.ip_address && (
                        <p className="text-xs text-muted-foreground mt-1">🌐 {incident.ip_address}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
