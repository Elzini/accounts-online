export const normalizeArabicDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

export const toSafeNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = normalizeArabicDigits(String(value))
    .replace(/٫/g, '.').replace(/[٬،]/g, ',').replace(/[^0-9,.-]/g, '').replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
};

export const toISODate = (value: unknown, fallback: string): string => {
  if (value === null || value === undefined || value === '') return fallback;
  const raw = normalizeArabicDigits(String(value).trim());
  if (!raw) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);

  const normalized = raw.replace(/[.\-]/g, '/');
  const parts = normalized.split('/').map((part) => Number.parseInt(part, 10));

  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    if (String(parts[0]).length === 4) {
      const [year, month, day] = parts;
      if (isValidDateParts(year, month, day))
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else {
      let [part1, part2, year] = parts;
      if (year < 100) year += 2000;
      if (isValidDateParts(year, part1, part2))
        return `${year.toString().padStart(4, '0')}-${part1.toString().padStart(2, '0')}-${part2.toString().padStart(2, '0')}`;
      if (isValidDateParts(year, part2, part1))
        return `${year.toString().padStart(4, '0')}-${part2.toString().padStart(2, '0')}-${part1.toString().padStart(2, '0')}`;
    }
  }
  return fallback;
};
