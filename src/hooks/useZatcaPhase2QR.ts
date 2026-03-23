/**
 * Hook to generate ZATCA Phase 2 compliant QR data asynchronously.
 * Provides immediate Phase 1 QR as fallback while Phase 2 generates.
 */
import { useState, useEffect, useMemo } from 'react';
import { generateZatcaQRData, generateZatcaQRDataPhase2, formatDateTimeForZatca } from '@/lib/zatcaQR';

interface UseZatcaPhase2QRParams {
  sellerName: string;
  vatNumber: string;
  invoiceDateTime: string;
  invoiceTotal: number;
  vatAmount: number;
  invoiceNumber?: string | number;
}

export function useZatcaPhase2QR(params: UseZatcaPhase2QRParams): string {
  // Immediate Phase 1 fallback (synchronous) - always available
  const phase1Data = useMemo(() => {
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
  }, [params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount]);

  const [phase2Data, setPhase2Data] = useState('');

  useEffect(() => {
    let cancelled = false;
    generateZatcaQRDataPhase2({
      sellerName: params.sellerName,
      vatNumber: params.vatNumber || '300000000000003',
      invoiceDateTime: formatDateTimeForZatca(params.invoiceDateTime),
      invoiceTotal: params.invoiceTotal,
      vatAmount: params.vatAmount,
      invoiceNumber: String(params.invoiceNumber || ''),
    }).then(data => {
      if (!cancelled) setPhase2Data(data);
    }).catch(() => {
      // Phase 2 failed, Phase 1 fallback remains active
    });
    return () => { cancelled = true; };
  }, [params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount, params.invoiceNumber]);

  // Return Phase 2 when ready, otherwise Phase 1
  return phase2Data || phase1Data;
}
