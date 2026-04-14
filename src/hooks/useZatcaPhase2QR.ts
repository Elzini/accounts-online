/**
 * Hook to generate a readable ZATCA QR for invoice display.
 *
 * Important:
 * Official Phase 2 approval requires the backend-issued cryptographic stamp
 * after reporting/clearance. Client-side generated signatures are not accepted
 * by the official validator, so we intentionally render the TLV QR payload
 * that remains scannable until an official QR is stored from the backend flow.
 */
import { useMemo } from 'react';
import { generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';

interface UseZatcaPhase2QRParams {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string;
  invoiceTotal: number;
  vatAmount: number;
  invoiceNumber?: string | number;
  officialQrData?: string | null;
}

export function useZatcaPhase2QR(params: UseZatcaPhase2QRParams): string {
  return useMemo(() => {
    if (params.officialQrData?.trim()) {
      return params.officialQrData.trim();
    }

    try {
      return generateZatcaQRData({
        sellerName: params.sellerName,
        vatNumber: params.vatNumber || '300000000000003',
        invoiceDateTime: formatDateTimeForZatca(params.invoiceDateTime),
        invoiceTotal: params.invoiceTotal,
        vatAmount: params.vatAmount,
      });
    } catch {
      return '';
    }
  }, [params.officialQrData, params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount]);
}
