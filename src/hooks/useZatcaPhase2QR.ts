/**
 * Hook to generate ZATCA Phase 2 compliant QR data asynchronously.
 * Replaces synchronous `generateZatcaQRData` calls with Phase 2 auto-hash/signature.
 */
import { useState, useEffect } from 'react';
import { generateZatcaQRDataPhase2, formatDateTimeForZatca } from '@/lib/zatcaQR';

interface UseZatcaPhase2QRParams {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string;
  invoiceTotal: number;
  vatAmount: number;
  invoiceNumber?: string;
}

export function useZatcaPhase2QR(params: UseZatcaPhase2QRParams): string {
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    let cancelled = false;
    generateZatcaQRDataPhase2({
      sellerName: params.sellerName,
      vatNumber: params.vatNumber || '300000000000003',
      invoiceDateTime: formatDateTimeForZatca(params.invoiceDateTime),
      invoiceTotal: params.invoiceTotal,
      vatAmount: params.vatAmount,
      invoiceNumber: params.invoiceNumber,
    }).then(data => {
      if (!cancelled) setQrData(data);
    }).catch(() => {
      // Fallback: will show empty QR briefly
    });
    return () => { cancelled = true; };
  }, [params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount, params.invoiceNumber]);

  return qrData;
}
