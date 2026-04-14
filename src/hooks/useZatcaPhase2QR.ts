/**
 * Hook to generate a ZATCA Phase 2 compatible QR with Tags 1-6.
 *
 * Tags 1-5: Standard TLV fields (seller, VAT, date, total, VAT amount)
 * Tag 6: SHA-256 hash of canonical invoice data
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

    let cancelled = false;

    const cleanVat = (params.vatNumber || '300000000000003').replace(/\D/g, '');
    const formattedDate = formatDateTimeForZatca(params.invoiceDateTime);

    // Build canonical invoice string for hashing (Tag 6)
    const canonicalData = [
      params.sellerName.trim(),
      cleanVat,
      formattedDate,
      formatAmount(params.invoiceTotal),
      formatAmount(params.vatAmount),
      String(params.invoiceNumber || ''),
    ].join('|');

    // Compute SHA-256 hash for Tag 6
    crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(canonicalData))
      .then((hashBuffer) => {
        if (cancelled) return;
        const hashBytes = new Uint8Array(hashBuffer);
        // Convert hash bytes to base64 string
        const hashBase64 = btoa(
          Array.from(hashBytes)
            .map((b) => String.fromCharCode(b))
            .join('')
        );

        // Generate QR with Tags 1-5 + Tag 6 (invoice hash)
        const data = generateZatcaQRData({
          sellerName: params.sellerName,
          vatNumber: cleanVat,
          invoiceDateTime: formattedDate,
          invoiceTotal: params.invoiceTotal,
          vatAmount: params.vatAmount,
          invoiceHash: hashBase64,
        });
        setQrData(data);
      })
      .catch(() => {
        // Fallback to Tags 1-5 only
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
