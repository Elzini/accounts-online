// لوحة نتائج محرك السيناريوهات
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, AlertOctagon,
  Info, Activity, BarChart3
} from 'lucide-react';
import {
  ScenarioSummary,
  ScenarioResult,
  ScenarioCategory,
  SCENARIO_CATEGORY_LABELS,
  SEVERITY_LABELS,
} from '@/services/trialBalanceScenarioEngine';

interface ScenarioValidationDashboardProps {
  summary: ScenarioSummary;
}

export function ScenarioValidationDashboard({ summary }: ScenarioValidationDashboardProps) {
  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const severityBadge = (severity: string) => {
    const variants: Record<string, 'destructive' | 'outline' | 'default' | 'secondary'> = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'outline',
      info: 'secondary',
    };
    return (
      <Badge variant={variants[severity] || 'default'} className="text-xs gap-1">
        {severityIcon(severity)}
        {SEVERITY_LABELS[severity] || severity}
      </Badge>
    );
  };

  // تجميع النتائج حسب الفئة
  const groupedResults = summary.results.reduce<Record<ScenarioCategory, ScenarioResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<ScenarioCategory, ScenarioResult[]>);

  const scoreColor = summary.overallScore >= 80 ? 'text-green-600' : summary.overallScore >= 50 ? 'text-amber-600' : 'text-destructive';
  const scoreLabel = summary.overallScore >= 90 ? 'ممتاز' : summary.overallScore >= 70 ? 'جيد' : summary.overallScore >= 50 ? 'مقبول' : 'يحتاج مراجعة';

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">محرك السيناريوهات الديناميكي</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {summary.totalScenariosTested.toLocaleString('ar-SA')}+ سيناريو
            </span>
          </div>
        </div>
        <CardDescription>فحص شامل لصحة البيانات وتوافقها مع المعايير السعودية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* النتيجة الإجمالية */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="col-span-2 sm:col-span-1 text-center p-3 rounded-lg bg-muted/50">
            <p className={`text-3xl font-bold ${scoreColor}`}>{summary.overallScore}</p>
            <p className="text-xs text-muted-foreground">{scoreLabel}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-xl font-bold text-green-600">{summary.passed}</p>
            <p className="text-xs text-muted-foreground">نجاح</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <p className="text-xl font-bold text-amber-600">{summary.warnings}</p>
            <p className="text-xs text-muted-foreground">تحذير</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-xl font-bold text-destructive">{summary.errors}</p>
            <p className="text-xs text-muted-foreground">خطأ</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-950/30">
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{summary.critical}</p>
            <p className="text-xs text-muted-foreground">حرج</p>
          </div>
        </div>

        <Progress 
          value={summary.overallScore} 
          className="h-2" 
        />

        {/* النتائج المفصلة */}
        {summary.results.length > 0 ? (
          <ScrollArea className="h-[350px]">
            <Accordion type="multiple" className="space-y-1">
              {Object.entries(groupedResults).map(([category, catResults]) => (
                <AccordionItem key={category} value={category} className="border rounded-lg px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {SCENARIO_CATEGORY_LABELS[category as ScenarioCategory] || category}
                      </span>
                      <Badge variant="outline" className="text-xs">{catResults.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {catResults.map((result, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-muted/30 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              {severityIcon(result.severity)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{result.title}</p>
                                <p className="text-xs text-muted-foreground">{result.description}</p>
                              </div>
                            </div>
                            {severityBadge(result.severity)}
                          </div>
                          {result.affectedAccounts.length > 0 && result.affectedAccounts.length <= 5 && (
                            <div className="flex flex-wrap gap-1 mt-1 mr-6">
                              {result.affectedAccounts.map((acc, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-mono">{acc}</Badge>
                              ))}
                            </div>
                          )}
                          {result.affectedAccounts.length > 5 && (
                            <p className="text-xs text-muted-foreground mr-6">
                              {result.affectedAccounts.length} حساب متأثر
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-600">جميع السيناريوهات ناجحة!</p>
            <p className="text-sm text-muted-foreground">لم يتم اكتشاف أي مشاكل</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
