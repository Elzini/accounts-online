// أدوات تنسيق الأرقام

// Default decimals - can be overridden by passing decimals parameter
export const formatNumber = (num: number | undefined | null, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (num === 0) return '-';
  const value = decimals === 0 ? Math.round(Math.abs(num)) : Math.abs(num);
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatNumberWithSign = (num: number | undefined | null, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (num === 0) return '-';
  const value = decimals === 0 ? Math.round(Math.abs(num)) : Math.abs(num);
  const formatted = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (num < 0) return `(${formatted})`;
  return formatted;
};

export const formatCurrency = (num: number | undefined | null, showCurrency = false, decimals = 0): string => {
  const formatted = formatNumber(num, decimals);
  if (formatted === '-') return '-';
  return showCurrency ? `${formatted} ر.س` : formatted;
};

export const parseArabicNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  // إزالة الفواصل والمسافات
  let str = String(value).trim();
  
  // تحويل الأرقام العربية إلى إنجليزية
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  arabicNumerals.forEach((ar, en) => {
    str = str.replace(new RegExp(ar, 'g'), String(en));
  });
  
  // التعامل مع الأقواس كأرقام سالبة
  const isNegative = str.includes('(') || str.includes('-');
  
  // استخراج الرقم
  const numStr = str.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
};

export const extractAmountFromRow = (row: any[]): number => {
  // البحث عن آخر قيمة رقمية في الصف
  for (let i = row.length - 1; i >= 0; i--) {
    const val = parseArabicNumber(row[i]);
    if (val !== 0) return val;
  }
  return 0;
};

export const extractAccountNameFromRow = (row: any[]): string => {
  // البحث عن أول خلية نصية غير فارغة
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
