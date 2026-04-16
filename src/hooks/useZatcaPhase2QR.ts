/**
 * Hook to generate a ZATCA Phase 2 compatible QR with Tags 1-9.
 *
 * Tags 1-5: Standard TLV fields (seller, VAT, date, total, VAT amount)
 * Tag 6: SHA-256 hash of canonical invoice data
 * Tag 7: ECDSA P-256 digital signature
 * Tag 8: ECDSA Public Key (raw uncompressed)
 * Tag 9: Certificate stamp hash
 */
/**
 * Hook to generate a ZATCA Phase 2 compatible QR with Tags 1-9.
 *
 * Priority:
 * 1) Official QR from backend if available
 * 2) Recovered official QR from ZATCA logs if available
 * 3) Local Phase 2 preview QR as last fallback
 */
import { useState, useEffect } from 'react';
import { generateZatcaQRDataPhase2, generateZatcaQRData, formatDateTimeForZatca } from '@/lib/zatcaQR';
import { supabase } from '@/hooks/modules/useMiscServices';
import { extractOfficialQrFromZatcaResponse } from '@/lib/zatcaOfficialQr';

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
    if (params.officialQrData?.trim()) {
      setQrData(params.officialQrData.trim());
      return;
    }

    let cancelled = false;

    const cleanVat = (params.vatNumber || '300000000000003').replace(/\D/g, '');
    const formattedDate = formatDateTimeForZatca(params.invoiceDateTime);
    const invoiceNumber = String(params.invoiceNumber || '').trim();

    const generateFallback = () => {
      generateZatcaQRDataPhase2({
        sellerName: params.sellerName,
        vatNumber: cleanVat,
        invoiceDateTime: formattedDate,
        invoiceTotal: params.invoiceTotal,
        vatAmount: params.vatAmount,
        invoiceNumber,
      })
        .then((data) => {
          if (!cancelled) setQrData(data);
        })
        .catch(() => {
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
    };

    const loadRecoveredOfficialQr = async () => {
      if (!invoiceNumber) {
        generateFallback();
        return;
      }

      try {
        const { data } = await supabase
          .from('zatca_invoices')
          .select('zatca_response, invoice_id, submitted_at')
          .eq('uuid', invoiceNumber)
          .order('submitted_at', { ascending: false })
          .limit(5);

        const recovered = (data || [])
          .map((row: any) => extractOfficialQrFromZatcaResponse(row.zatca_response))
          .find(Boolean);

        if (!cancelled && recovered) {
          setQrData(recovered);
          return;
        }
      } catch (error) {
        console.warn('Failed to recover official ZATCA QR from logs:', error);
      }

      generateFallback();
    };

    loadRecoveredOfficialQr();

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
