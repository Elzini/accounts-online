import { AuditFixAction } from '../auditFixActions';

export interface AuditCheckResult {
  id: string;
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running' | 'pending';
  message: string;
  details?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  fixActions?: AuditFixAction[];
}

export type AuditCategory = {
  id: string;
  title: string;
  icon: string;
  runner: (companyId: string) => Promise<AuditCheckResult[]>;
};
