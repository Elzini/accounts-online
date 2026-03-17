// أدوات تنسيق الأرقام - مع دعم الإعداد العام

// Module-level decimals setting - updated by useNumberFormat hook
let _globalDecimals = 0;

export function setGlobalDecimals(d: number) {
  _globalDecimals = d;
}

export function getGlobalDecimals(): number {
  return _globalDecimals;
}

export const formatNumber = (num: number | undefined | null, decimals?: number): string => {
  const d = decimals ?? _globalDecimals;
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (num === 0) return '-';
  const value = d === 0 ? Math.round(Math.abs(num)) : Math.abs(num);
  return d === 0 ? String(value) : value.toFixed(d);
};

export const formatNumberWithSign = (num: number | undefined | null, decimals?: number): string => {
  const d = decimals ?? _globalDecimals;
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (num === 0) return '-';
  const value = d === 0 ? Math.round(Math.abs(num)) : Math.abs(num);
  const formatted = d === 0 ? String(value) : value.toFixed(d);
  if (num < 0) return `(${formatted})`;
  return formatted;
};

export const formatCurrency = (num: number | undefined | null, showCurrency = false, decimals?: number): string => {
  const formatted = formatNumber(num, decimals);
  if (formatted === '-') return '-';
  return showCurrency ? `${formatted} ر.س` : formatted;
};

export const parseArabicNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  let str = String(value).trim();
  
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  arabicNumerals.forEach((ar, en) => {
    str = str.replace(new RegExp(ar, 'g'), String(en));
  });
  
  const isNegative = str.includes('(') || str.includes('-');
  const numStr = str.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
};

export const extractAmountFromRow = (row: any[]): number => {
  for (let i = row.length - 1; i >= 0; i--) {
    const val = parseArabicNumber(row[i]);
    if (val !== 0) return val;
  }
  return 0;
};

export const extractAccountNameFromRow = (row: any[]): string => {
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (cell && typeof cell === 'string') {
      const trimmed = cell.trim();
      if (trimmed.length > 2 && !/^\d+$/.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return '';
};
