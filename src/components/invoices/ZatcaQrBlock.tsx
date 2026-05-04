import { QRCodeSVG } from 'qrcode.react';

interface ZatcaQrBlockProps {
  value: string;
  size?: number;
}

/**
 * Unified ZATCA QR block used across all invoice templates.
 * Always shows a large QR + the fixed black "مطابق ومعتمد - مرحلة ثانية" badge,
 * matching the standard ZATCA Phase 2 invoice presentation.
 */
export const ZatcaQrBlock = ({ value, size = 200 }: ZatcaQrBlockProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG value={value} size={size} level="M" includeMargin={true} />
      <div
        className="bg-black text-white text-[11px] font-bold rounded-full px-4 py-1.5 whitespace-nowrap text-center"
        dir="rtl"
      >
        مطابق ومعتمد - مرحلة ثانية ✅
      </div>
    </div>
  );
};
