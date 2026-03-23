/**
 * Banking Page - Summary Stats Cards
 */
import { Building2, FileSpreadsheet, Scale, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BankingSummaryCardsProps {
  activeAccounts: number;
  totalBalance: number;
  statementsCount: number;
  pendingStatements: number;
  formatCurrency: (v: number) => string;
  t: Record<string, string>;
}

export function BankingSummaryCards({ activeAccounts, totalBalance, statementsCount, pendingStatements, formatCurrency, t }: BankingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{t.bank_accounts_count}</p><p className="text-xl font-bold">{activeAccounts}</p></div></div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-500/10 rounded-lg"><Scale className="w-5 h-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_total_balance}</p><p className="text-xl font-bold">{formatCurrency(totalBalance)}</p></div></div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-lg"><FileSpreadsheet className="w-5 h-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_imported_statements}</p><p className="text-xl font-bold">{statementsCount}</p></div></div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-500/10 rounded-lg"><Link2 className="w-5 h-5 text-orange-500" /></div><div><p className="text-sm text-muted-foreground">{t.bank_needs_matching}</p><p className="text-xl font-bold text-orange-600">{pendingStatements}</p></div></div></CardContent></Card>
    </div>
  );
}
