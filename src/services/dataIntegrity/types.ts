export interface IntegrityCheckResult {
  checkType: string;
  checkName: string;
  status: 'pass' | 'fail' | 'warning';
  details: any;
  issuesFound: number;
}
