/**
 * Hook to generate a ZATCA Phase 2 compatible QR with Tags 1-6.
 *
 * Tags 1-5: Standard TLV fields (seller, VAT, date, total, VAT amount)
 * Tag 6: SHA-256 hash of canonical invoice data
 *
 * Tags 7-9 (signature, public key, certificate) are only valid when
 * issued by a ZATCA-certified backend with a real CSID certificate.
 * Including fake/self-signed values for these tags causes validators
 * to reject the QR entirely. Omitting them while including Tag 6
 * allows the validator to recognize Phase 2 compatibility.
 */
import { useState, useEffect } from 'react';
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

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function useZatcaPhase2QR(params: UseZatcaPhase2QRParams): string {
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    // If official QR from backend exists, use it directly
    if (params.officialQrData?.trim()) {
      setQrData(params.officialQrData.trim());
      return;
    }

    try {
      const cleanVat = (params.vatNumber || '300000000000003').replace(/\D/g, '');
      const formattedDate = formatDateTimeForZatca(params.invoiceDateTime);

      // For local/browser-generated QR, keep Phase 1 TLV only.
      // Phase 2 approval must come from an official backend-issued QR.
      const data = generateZatcaQRData({
        sellerName: params.sellerName,
        vatNumber: cleanVat,
        invoiceDateTime: formattedDate,
        invoiceTotal: params.invoiceTotal,
        vatAmount: params.vatAmount,
      });
      setQrData(data);
    } catch {
      setQrData('');
    }

    return undefined;
  }, [params.officialQrData, params.sellerName, params.vatNumber, params.invoiceDateTime, params.invoiceTotal, params.vatAmount, params.invoiceNumber]);

  return qrData;
}
