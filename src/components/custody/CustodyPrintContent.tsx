import { forwardRef } from 'react';
import { Custody } from '@/services/custody';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';

interface CustodySummary {
  custodyAmount: number;
  totalSpent: number;
  remaining: number;
  returnedAmount: number;
  carriedBalance: number;
  isOverspent: boolean;
}

interface CustodyPrintContentProps {
  custody: Custody;
  summary: CustodySummary;
}

export const CustodyPrintContent = forwardRef<HTMLDivElement, CustodyPrintContentProps>(
  ({ custody, summary }, ref) => {
    const transactions = custody.transactions || [];
    const currentDate = new Date().toLocaleDateString('ar-SA');

    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          fontFamily: 'Cairo, Arial, sans-serif',
          backgroundColor: 'white',
          padding: '24px',
          width: '100%',
          minHeight: '100%',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
            تصفية العهدة مع تحليل المصروفات
          </h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '16px' }}>
                {custody.custody_name} - رقم العهدة: {custody.custody_number}
              </span>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              تاريخ التقرير: {currentDate}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>مبلغ العهدة</div>
            <div style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(summary.custodyAmount)} ر.س
            </div>
          </div>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>إجمالي المصروفات</div>
            <div style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(summary.totalSpent)} ر.س
            </div>
          </div>
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>المبلغ المردود</div>
            <div style={{ color: '#16a34a', fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(summary.returnedAmount)} ر.س
            </div>
          </div>
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>الرصيد المرحل</div>
            <div style={{ color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(summary.carriedBalance)} ر.س
            </div>
          </div>
        </div>

        {/* Custody Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '24px',
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>تاريخ الصرف: </span>
            <span style={{ fontWeight: '600' }}>
              {new Date(custody.custody_date).toLocaleDateString('ar-SA')}
            </span>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>المستلم: </span>
            <span style={{ fontWeight: '600' }}>{custody.employee?.name || 'غير محدد'}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>الحالة: </span>
            <span
              style={{
                fontWeight: '600',
                color: custody.status === 'settled' ? '#16a34a' : '#3b82f6',
              }}
            >
              {custody.status === 'settled' ? 'مصفاة' : 'نشطة'}
            </span>
          </div>
          {custody.settlement_date && (
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>تاريخ التصفية: </span>
              <span style={{ fontWeight: '600' }}>
                {new Date(custody.settlement_date).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ background: '#3b82f6', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2563eb' }}>
                التاريخ
              </th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2563eb' }}>
                التحليل
              </th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2563eb' }}>
                البيان
              </th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2563eb' }}>
                القيمة
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}
                >
                  لا توجد مصروفات مسجلة
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                >
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    {new Date(tx.transaction_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    {tx.analysis_category || '-'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                    {formatNumber(tx.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f3f4f6' }}>
              <td colSpan={3} style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                الإجمالي
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatNumber(summary.totalSpent)}
              </td>
            </tr>
            <tr style={{ background: '#dcfce7' }}>
              <td colSpan={3} style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                المبلغ المردود
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                {formatNumber(summary.returnedAmount)}
              </td>
            </tr>
            <tr style={{ background: '#ffedd5' }}>
              <td colSpan={3} style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>
                الرصيد المرحل
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#ea580c' }}>
                {formatNumber(summary.carriedBalance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {custody.notes && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              borderRight: '4px solid #3b82f6',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>ملاحظات:</div>
            <div style={{ color: '#6b7280' }}>{custody.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            color: '#9ca3af',
            fontSize: '12px',
          }}
        >
          <div>تم إنشاء هذا التقرير آلياً</div>
          <div>{new Date().toLocaleString('ar-SA')}</div>
        </div>
      </div>
    );
  }
);

CustodyPrintContent.displayName = 'CustodyPrintContent';
