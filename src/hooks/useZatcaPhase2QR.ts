/**
 * Hook to generate a ZATCA Phase 2 compatible QR with Tags 1-9.
 *
 * Tags 1-5: Standard TLV fields (seller, VAT, date, total, VAT amount)
 * Tag 6: SHA-256 hash of canonical invoice data
 * Tag 7: ECDSA P-256 digital signature
 * Tag 8: ECDSA Public Key (raw uncompressed)
 * Tag 9: Certificate stamp hash
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

    const cleanVat = (params.vatNumber || '300000000000003').replace(/\D/g, '');
    const formattedDate = formatDateTimeForZatca(params.invoiceDateTime);

    // Generate full Phase 2 QR with Tags 1-9 (ECDSA signed)
    generateZatcaQRDataPhase2({
      sellerName: params.sellerName,
      vatNumber: cleanVat,
      invoiceDateTime: formattedDate,
      invoiceTotal: params.invoiceTotal,
      vatAmount: params.vatAmount,
      invoiceNumber: String(params.invoiceNumber || ''),
    })
      .then((data) => {
        if (!cancelled) setQrData(data);
      })
      .catch(() => {
        // Fallback to Tags 1-5 only if Phase 2 generation fails
        if (!cancelled) {
          try {
            const fallback = generateZatcaQRData({
              sellerName: params.sellerName,
              vatNumber: cleanVat,
              invoiceDateTime: formattedDate,
              invoiceTotal: params.invoiceTotal,
              vatAmount: params.vatAmount,
            });
            setQrData(fallback);
          } catch {
            setQrData('');
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    params.officialQrData,
    params.sellerName,
    params.vatNumber,
    params.invoiceDateTime,
    params.invoiceTotal,
    params.vatAmount,
    params.invoiceNumber,
  ]);

  return qrData;
}
