import { useState, useCallback } from 'react';
import {
  ShieldCheck, Play, CheckCircle2, XCircle, AlertTriangle, Info, Loader2, Database,
  Calculator, FileText, Calendar, AlertOctagon, Shield, ChevronDown, ChevronRight,
  RefreshCw, Bell, Wrench, Zap, ShieldAlert, CircleCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { AUDIT_CATEGORIES, AuditCheckResult } from '@/services/accountingAudit';
import { AuditFixAction, AuditFixResult } from '@/services/auditFixActions';

const CATEGORY_ICONS: Record<string, typeof Database> = {
  database: Database, 'journal-balance': Calculator, 'financial-reports': FileText,
  'fiscal-year': Calendar, 'edge-cases': AlertOctagon, security: Shield,
};

export function AccountingAuditPage() {
  const { companyId } = useCompany();
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Map<string, AuditCheckResult[]>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [selectedFix, setSelectedFix] = useState<AuditFixAction | null>(null);
  const [fixRunning, setFixRunning] = useState(false);
  const [fixResult, setFixResult] = useState<AuditFixResult | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());

  const STATUS_CONFIG = {
    pass: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: t.acaudit_status_pass },
    fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: t.acaudit_status_fail },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: t.acaudit_status_warning },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: t.acaudit_status_running },
    pending: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted', label: t.acaudit_status_pending },
  };

  const FIX_SEVERITY_CONFIG = {
    safe: { color: 'text-emerald-600', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30', icon: CircleCheck, label: t.acaudit_fix_safe },
    moderate: { color: 'text-amber-600', bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30', icon: Zap, label: t.acaudit_fix_moderate },
    dangerous: { color: 'text-red-600', bg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30', icon: ShieldAlert, label: t.acaudit_fix_dangerous },
  };

  const SEVERITY_BADGE: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-600 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    info: 'bg-muted text-muted-foreground border-border',
  };

  const severityLabel = (s: string) => {
    const map: Record<string, string> = {
      critical: t.acaudit_severity_critical, high: t.acaudit_severity_high,
      medium: t.acaudit_severity_medium, low: t.acaudit_severity_low, info: t.acaudit_severity_info,
    };
    return map[s] || s;
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => { const next = new Set(prev); if (next.has(catId)) next.delete(catId); else next.add(catId); return next; });
  };

  const openFixDialog = (fix: AuditFixAction) => { setSelectedFix(fix); setFixResult(null); setFixDialogOpen(true); };

  const executeFix = async () => {
    if (!selectedFix) return;
    setFixRunning(true); setFixResult(null);
    try {
      const result = await selectedFix.execute();
      setFixResult(result);
      setAppliedFixes(prev => new Set([...prev, selectedFix.id]));
      if (result.success) toast.success(result.message); else toast.error(result.message);
    } catch (error) {
      const errorResult: AuditFixResult = { success: false, message: `${t.acaudit_error}: ${error instanceof Error ? error.message : 'unknown'}` };
      setFixResult(errorResult); toast.error(errorResult.message);
    } finally { setFixRunning(false); }
  };

  const runAudit = useCallback(async () => {
    if (!companyId) { toast.error(t.acaudit_no_company); return; }
    setIsRunning(true); setResults(new Map()); setProgress(0); setExpandedCategories(new Set()); setAppliedFixes(new Set());
    const newResults = new Map<string, AuditCheckResult[]>();
    for (let i = 0; i < AUDIT_CATEGORIES.length; i++) {
      const category = AUDIT_CATEGORIES[i];
      setCurrentCategory(category.title); setProgress(((i) / AUDIT_CATEGORIES.length) * 100);
      try {
        const categoryResults = await category.runner(companyId);
        newResults.set(category.id, categoryResults); setResults(new Map(newResults));
        const hasIssues = categoryResults.some(r => r.status === 'fail' || r.status === 'warning');
        if (hasIssues) setExpandedCategories(prev => new Set([...prev, category.id]));
      } catch (error) {
        newResults.set(category.id, [{ id: `${category.id}-error`, category: category.id, name: t.acaudit_check_error, status: 'fail', message: `${t.acaudit_error}: ${error instanceof Error ? error.message : 'unknown'}`, severity: 'critical' }]);
        setResults(new Map(newResults)); setExpandedCategories(prev => new Set([...prev, category.id]));
      }
    }
    setProgress(100); setCurrentCategory(''); setIsRunning(false);
    let totalPassed = 0, totalFailed = 0, totalWarnings = 0;
    for (const [, checks] of newResults) { for (const check of checks) { if (check.status === 'pass') totalPassed++; else if (check.status === 'fail') totalFailed++; else if (check.status === 'warning') totalWarnings++; } }
    const fixableCount = Array.from(newResults.values()).flat().filter(r => r.fixActions && r.fixActions.length > 0).length;
    if (totalFailed > 0) toast.error(`${totalFailed} ${t.acaudit_failed}, ${totalWarnings} ${t.acaudit_warnings}, ${totalPassed} ${t.acaudit_passed}${fixableCount > 0 ? ` | ${fixableCount} ${t.acaudit_fixable}` : ''}`);
    else if (totalWarnings > 0) toast.warning(`${totalWarnings} ${t.acaudit_warnings}, ${totalPassed} ${t.acaudit_passed}${fixableCount > 0 ? ` | ${fixableCount} ${t.acaudit_fixable}` : ''}`);
    else toast.success(`${t.acaudit_passed}: ${totalPassed}`);
  }, [companyId, t]);

  const allResults = Array.from(results.values()).flat();
  const passCount = allResults.filter(r => r.status === 'pass').length;
  const failCount = allResults.filter(r => r.status === 'fail').length;
  const warnCount = allResults.filter(r => r.status === 'warning').length;
  const totalChecks = allResults.length;
  const fixableCount = allResults.filter(r => r.fixActions && r.fixActions.length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.acaudit_title}</h1>
            <p className="text-sm text-muted-foreground">{t.acaudit_subtitle}</p>
          </div>
        </div>
        <Button onClick={runAudit} disabled={isRunning} size="lg" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
          {isRunning ? (<><Loader2 className="w-5 h-5 animate-spin" />{t.acaudit_running}</>) : results.size > 0 ? (<><RefreshCw className="w-5 h-5" />{t.acaudit_rerun}</>) : (<><Play className="w-5 h-5" />{t.acaudit_start}</>)}
        </Button>
      </div>

      {isRunning && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{t.acaudit_scanning} {currentCategory}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {totalChecks > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-border"><CardContent className="py-3 px-4 text-center"><p className="text-2xl font-bold text-foreground">{totalChecks}</p><p className="text-xs text-muted-foreground">{t.acaudit_total_checks}</p></CardContent></Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5"><CardContent className="py-3 px-4 text-center"><p className="text-2xl font-bold text-emerald-500">{passCount}</p><p className="text-xs text-muted-foreground">{t.acaudit_passed}</p></CardContent></Card>
          <Card className="border-red-500/30 bg-red-500/5"><CardContent className="py-3 px-4 text-center"><p className="text-2xl font-bold text-red-500">{failCount}</p><p className="text-xs text-muted-foreground">{t.acaudit_failed}</p></CardContent></Card>
          <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="py-3 px-4 text-center"><p className="text-2xl font-bold text-amber-500">{warnCount}</p><p className="text-xs text-muted-foreground">{t.acaudit_warnings}</p></CardContent></Card>
          {fixableCount > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-1"><Wrench className="w-4 h-4 text-blue-500" /><p className="text-2xl font-bold text-blue-500">{fixableCount}</p></div><p className="text-xs text-muted-foreground">{t.acaudit_fixable}</p></CardContent></Card>
          )}
        </div>
      )}

      {results.size === 0 && !isRunning && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t.acaudit_ready}</h3>
            <p className="text-muted-foreground mb-4">{t.acaudit_ready_desc}</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {AUDIT_CATEGORIES.map(cat => (<Badge key={cat.id} variant="outline" className="gap-1">{cat.title}</Badge>))}
            </div>
          </CardContent>
        </Card>
      )}

      {AUDIT_CATEGORIES.map(category => {
        const categoryResults = results.get(category.id);
        if (!categoryResults) return null;
        const Icon = CATEGORY_ICONS[category.id] || Database;
        const isExpanded = expandedCategories.has(category.id);
        const catPassCount = categoryResults.filter(r => r.status === 'pass').length;
        const catFailCount = categoryResults.filter(r => r.status === 'fail').length;
        const catWarnCount = categoryResults.filter(r => r.status === 'warning').length;
        const catFixableCount = categoryResults.filter(r => r.fixActions && r.fixActions.length > 0).length;
        const overallStatus = catFailCount > 0 ? 'fail' : catWarnCount > 0 ? 'warning' : 'pass';
        const StatusIcon = STATUS_CONFIG[overallStatus].icon;

        return (
          <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
            <Card className={`transition-all ${overallStatus === 'fail' ? 'border-red-500/30' : overallStatus === 'warning' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_CONFIG[overallStatus].bg}`}>
                        <Icon className={`w-5 h-5 ${STATUS_CONFIG[overallStatus].color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">{category.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[overallStatus].color}`} />
                          <span className={`text-xs ${STATUS_CONFIG[overallStatus].color}`}>
                            {catPassCount} {t.acaudit_passed}
                            {catFailCount > 0 && ` • ${catFailCount} ${t.acaudit_failed}`}
                            {catWarnCount > 0 && ` • ${catWarnCount} ${t.acaudit_warnings}`}
                          </span>
                          {catFixableCount > 0 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 border-blue-500/30 text-blue-600">
                              <Wrench className="w-3 h-3" />{catFixableCount} {t.acaudit_fix_btn}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {catFailCount > 0 && (<Badge variant="destructive" className="text-xs"><Bell className="w-3 h-3 mr-1" />{catFailCount}</Badge>)}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-2">
                  {categoryResults.map(result => {
                    const ResultIcon = STATUS_CONFIG[result.status].icon;
                    const hasFixActions = result.fixActions && result.fixActions.length > 0;
                    return (
                      <div key={result.id} className={`p-3 rounded-lg border ${result.status === 'fail' ? 'border-red-500/20 bg-red-500/5' : result.status === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-card'}`}>
                        <div className="flex items-start gap-3">
                          <ResultIcon className={`w-5 h-5 mt-0.5 shrink-0 ${result.status === 'running' ? 'animate-spin' : ''} ${STATUS_CONFIG[result.status].color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">{result.name}</span>
                              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${SEVERITY_BADGE[result.severity]}`}>{severityLabel(result.severity)}</Badge>
                              {hasFixActions && (<Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 border-blue-500/30 text-blue-600 bg-blue-500/5"><Wrench className="w-3 h-3" />{t.acaudit_can_fix}</Badge>)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 break-words">{result.message}</p>
                            {result.details && result.details.length > 0 && (
                              <div className="mt-2 space-y-1 bg-background/50 rounded p-2 border border-border/50">
                                {result.details.map((detail, idx) => (<p key={idx} className="text-xs text-muted-foreground font-mono break-all">• {detail}</p>))}
                              </div>
                            )}
                            {hasFixActions && (
                              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                                <p className="text-xs font-semibold text-foreground flex items-center gap-1"><Wrench className="w-3.5 h-3.5" />{t.acaudit_fix_methods}</p>
                                <div className="space-y-2">
                                  {result.fixActions!.map((fix) => {
                                    const fixConfig = FIX_SEVERITY_CONFIG[fix.severity];
                                    const FixIcon = fixConfig.icon;
                                    const isApplied = appliedFixes.has(fix.id);
                                    return (
                                      <div key={fix.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${fixConfig.bg}`}>
                                        <FixIcon className={`w-4 h-4 mt-0.5 shrink-0 ${fixConfig.color}`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${fixConfig.color}`}>{fix.label}</span>
                                            <Badge variant="outline" className={`text-[10px] py-0 px-1 ${fix.severity === 'safe' ? 'border-emerald-500/30 text-emerald-600' : fix.severity === 'moderate' ? 'border-amber-500/30 text-amber-600' : 'border-red-500/30 text-red-600'}`}>{fixConfig.label}</Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">{fix.description}</p>
                                        </div>
                                        <Button size="sm" variant="outline" disabled={isApplied} className={`shrink-0 gap-1.5 ${isApplied ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : fix.severity === 'dangerous' ? 'border-red-500/30 text-red-600 hover:bg-red-500/10' : 'border-blue-500/30 text-blue-600 hover:bg-blue-500/10'}`} onClick={() => openFixDialog(fix)}>
                                          {isApplied ? (<><CheckCircle2 className="w-3.5 h-3.5" />{t.acaudit_fixed}</>) : (<><Wrench className="w-3.5 h-3.5" />{t.acaudit_fix_btn}</>)}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <AlertDialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Wrench className="w-5 h-5 text-primary" />{t.acaudit_confirm_fix}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {selectedFix && (
                  <>
                    <div className={`p-3 rounded-lg border ${selectedFix.severity === 'safe' ? 'border-emerald-500/30 bg-emerald-500/5' : selectedFix.severity === 'moderate' ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                      <p className="font-semibold text-sm text-foreground mb-1">{selectedFix.label}</p>
                      <p className="text-sm text-muted-foreground">{selectedFix.description}</p>
                    </div>
                    {selectedFix.severity === 'dangerous' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{t.acaudit_dangerous_warning}</p>
                      </div>
                    )}
                    {fixResult && (
                      <div className={`p-3 rounded-lg border ${fixResult.success ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {fixResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                          <span className={`text-sm font-medium ${fixResult.success ? 'text-emerald-600' : 'text-red-600'}`}>{fixResult.message}</span>
                        </div>
                        {fixResult.details && fixResult.details.length > 0 && (
                          <div className="mt-2 space-y-1">{fixResult.details.slice(0, 5).map((d, i) => (<p key={i} className="text-xs text-muted-foreground font-mono">• {d}</p>))}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fixRunning}>{fixResult ? t.close : t.cancel}</AlertDialogCancel>
            {!fixResult && (
              <AlertDialogAction onClick={(e) => { e.preventDefault(); executeFix(); }} disabled={fixRunning}
                className={`gap-2 ${selectedFix?.severity === 'dangerous' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90'}`}>
                {fixRunning ? (<><Loader2 className="w-4 h-4 animate-spin" />{t.acaudit_fixing}</>) : (<><Wrench className="w-4 h-4" />{t.acaudit_execute_fix}</>)}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
