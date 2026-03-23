interface Props {
  baseAmount: number;
  taxAmount: number;
  totalWithTax: number;
  taxRate: number;
  currency: string;
  formatCurrency: (v: number) => string;
  t: any;
}

export function PurchasesTotalsFooter({ baseAmount, taxAmount, totalWithTax, taxRate, currency, formatCurrency, t }: Props) {
  return (
    <div className="border-t bg-muted/30 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-sm text-muted-foreground">{t.total_base_amount}</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(baseAmount))} {currency}</p>
        </div>
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-sm text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(taxAmount))} {currency}</p>
        </div>
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-sm text-muted-foreground">{t.total_purchases_with_tax}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totalWithTax))} {currency}</p>
        </div>
      </div>
    </div>
  );
}
