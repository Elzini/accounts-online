/**
 * Hook to generate a ZATCA Phase 2 compliant QR with all 9 TLV tags.
 *
 * Tags 6-9 use client-side ECDSA-P256 signatures via Web Crypto API.
 * For full production compliance, Tags 8-9 should come from a ZATCA-issued
 * certificate after clearance/reporting. This implementation satisfies
 * the structural and cryptographic requirements for Phase 2 validators.
 */
import { useState, useEffect } from 'react';
import { generateZatcaQRDataPhase2, generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';

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
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    // If official QR from backend exists, use it directly
    if (params.officialQrData?.trim()) {
      setQrData(params.officialQrData.trim());
      return;
    }

    let cancelled = false;

    // Generate Phase 2 QR with all 9 tags (async due to Web Crypto)
    generateZatcaQRDataPhase2({
      sellerName: params.sellerName,
      vatNumber: params.vatNumber || '300000000000003',
      invoiceDateTime: formatDateTimeForZatca(params.invoiceDateTime),
      invoiceTotal: params.invoiceTotal,
      vatAmount: params.vatAmount,
      invoiceNumber: String(params.invoiceNumber || ''),
    })
      .then((data) => {
        if (!cancelled) setQrData(data);
      })
      .catch(() => {
        // Fallback to Phase 1 (Tags 1-5) if crypto fails
        if (!cancelled) {
          try {
            const fallback = generateZatcaQRData({
              sellerName: params.sellerName,
              vatNumber: params.vatNumber || '300000000000003',
              invoiceDateTime: formatDateTimeForZatca(params.invoiceDateTime),
              invoiceTotal: params.invoiceTotal,
              vatAmount: params.vatAmount,
            });
            setQrData(fallback);
          } catch {
            setQrData('');
          }
        }
      });

    return () => { cancelled = true; };
  }, [params.officialQrData, params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount, params.invoiceNumber]);

  return qrData;
}
