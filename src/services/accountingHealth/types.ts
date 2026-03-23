export interface AccountingCheckResult {
  checkId: string;
  checkName: string;
  category: 'journal' | 'vat' | 'reconciliation' | 'trial_balance';
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  details: any;
  issuesCount: number;
  recommendations: string[];
}

export interface SystemHealthReport {
  companyId: string;
  companyName: string;
  reportDate: string;
  overallScore: number;
  overallStatus: 'healthy' | 'warning' | 'critical';
  checks: AccountingCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}
