/**
 * PurchasesTable - Thin orchestrator (859 → ~30 lines)
 * Delegates to InvoicePurchasesView or CarPurchasesView based on industry
 */
import { ActivePage } from '@/types';
import { usePurchasesTable } from './purchases/usePurchasesTable';
import { InvoicePurchasesView } from './purchases/InvoicePurchasesView';
import { CarPurchasesView } from './purchases/CarPurchasesView';

interface PurchasesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ setActivePage }: PurchasesTableProps) {
  const hook = usePurchasesTable();

  if (hook.isLoading || hook.invoicesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hook.isCarDealership) {
    return <InvoicePurchasesView setActivePage={setActivePage} hook={hook} />;
  }

  return <CarPurchasesView setActivePage={setActivePage} hook={hook} />;
}
