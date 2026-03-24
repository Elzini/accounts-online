/**
 * Banking Page - Thin Orchestrator
 * Sub-components extracted to tabs/ and dialogs/ directories
 */
import { Loader2, Building2, Upload, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBankingPage } from './useBankingPage';
import { BankingSummaryCards } from './BankingSummaryCards';
import { BankAccountsTab } from './tabs/BankAccountsTab';
import { BankStatementsTab } from './tabs/BankStatementsTab';
import { BankReconciliationsTab } from './tabs/BankReconciliationsTab';
import { AddAccountDialog, ImportStatementDialog, ReconciliationDialog, EditStatementDialog, DeleteStatementDialog, EditAccountDialog, DeleteAccountDialog } from './dialogs/BankingDialogs';
import { TransactionsDialog } from './dialogs/TransactionsDialog';

export function BankingPage() {
  const ctx = useBankingPage();
  const { t, language, loadingAccounts } = ctx;

  if (loadingAccounts) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.bank_title}</h1><p className="text-sm text-muted-foreground mt-1">{t.bank_subtitle}</p></div>
        <div className="flex gap-2">
          <Button onClick={() => ctx.setShowAccountDialog(true)} variant="outline"><Building2 className="w-4 h-4 ml-2" />{t.bank_new_account}</Button>
          <Button onClick={() => ctx.setShowImportDialog(true)} variant="outline"><Upload className="w-4 h-4 ml-2" />{t.bank_import_statement}</Button>
          <Button onClick={() => ctx.setShowReconciliationDialog(true)} className="gradient-primary"><Scale className="w-4 h-4 ml-2" />{t.bank_new_reconciliation}</Button>
        </div>
      </div>

      {/* Summary */}
      <BankingSummaryCards
        activeAccounts={ctx.activeAccounts}
        totalBalance={ctx.totalBalance}
        statementsCount={ctx.statements.length}
        pendingStatements={ctx.pendingStatements}
        formatCurrency={ctx.formatCurrency}
        t={t as any}
      />

      {/* Tabs */}
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">{t.bank_accounts_tab}</TabsTrigger>
          <TabsTrigger value="statements">{t.bank_statements_tab}</TabsTrigger>
          <TabsTrigger value="reconciliations">{t.bank_reconciliations_tab}</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-4"><BankAccountsTab ctx={ctx} /></TabsContent>
        <TabsContent value="statements" className="mt-4"><BankStatementsTab ctx={ctx} /></TabsContent>
        <TabsContent value="reconciliations" className="mt-4"><BankReconciliationsTab ctx={ctx} /></TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAccountDialog ctx={ctx} />
      <ImportStatementDialog ctx={ctx} />
      <ReconciliationDialog ctx={ctx} />
      <EditStatementDialog ctx={ctx} />
      <DeleteStatementDialog ctx={ctx} />
      <EditAccountDialog ctx={ctx} />
      <DeleteAccountDialog ctx={ctx} />
      <TransactionsDialog open={ctx.showTransactionsDialog} onOpenChange={ctx.setShowTransactionsDialog} statement={ctx.selectedStatement} />
    </div>
  );
}
