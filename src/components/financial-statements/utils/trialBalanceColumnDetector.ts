/**
 * Trial Balance Column Detection Utilities
 * Extracted from trialBalanceParser.ts for maintainability
 */

export function normalizeHeaderCell(value: any): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[\u200f\u200e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function includesAny(text: string, needles: string[]) {
  return needles.some(n => text.includes(n));
}

export const HEADER_KEYWORDS = {
  debit: ['مدين', 'المدين', 'debit', 'dr', 'd.r', 'd'],
  credit: ['دائن', 'الدائن', 'credit', 'cr', 'c.r', 'c'],
  name: ['اسم الحساب', 'البيان', 'الحساب', 'account name', 'name'],
  code: ['الرقم', 'رقم الحساب', 'الكود', 'كود', 'code', 'account no', 'account number'],
  opening: ['رصيد سابق', 'افتتاح', 'opening', 'previous', 'begin'],
  movement: ['الحركة', 'دوران', 'movement', 'turnover'],
  closing: ['ختام', 'ختامي', 'الصافي', 'الرصيد الختامي', 'closing', 'ending', 'net'],
};

export interface ColumnMap {
  startRow: number;
  nameCol: number;
  codeCol: number;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
}

type Pair = { debit: number; credit: number; section: 'opening' | 'movement' | 'closing' | 'unknown' };

const inferSection = (headerRow: any[], prevRow: any[] | undefined, colIdx: number): Pair['section'] => {
  const cell = normalizeHeaderCell(headerRow[colIdx]);
  const above = prevRow ? normalizeHeaderCell(prevRow[colIdx]) : '';
  const text = `${above} ${cell}`;
  if (includesAny(text, HEADER_KEYWORDS.opening)) return 'opening';
  if (includesAny(text, HEADER_KEYWORDS.movement)) return 'movement';
  if (includesAny(text, HEADER_KEYWORDS.closing)) return 'closing';
  return 'unknown';
};

const pickClosest = (from: number, candidates: number[], used: Set<number>) => {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    if (used.has(c)) continue;
    const dist = Math.abs(c - from);
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  return best;
};

export function detectTrialBalanceColumns(rows: any[][]): ColumnMap {
  const result: ColumnMap = {
    startRow: -1, nameCol: -1, codeCol: -1,
    openingDebit: -1, openingCredit: -1,
    movementDebit: -1, movementCredit: -1,
    closingDebit: -1, closingCredit: -1,
  };

  // 1) Find header row with Debit/Credit labels
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i];
    if (!row) continue;
    const prevRow = i > 0 ? rows[i - 1] : undefined;
    const debitCols: number[] = [];
    const creditCols: number[] = [];

    for (let j = 0; j < row.length; j++) {
      const cellNorm = normalizeHeaderCell(row[j]);
      if (!cellNorm) continue;
      if (result.nameCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.name)) result.nameCol = j;
      if (result.codeCol === -1 && includesAny(cellNorm, HEADER_KEYWORDS.code)) result.codeCol = j;
      if (includesAny(cellNorm, HEADER_KEYWORDS.debit)) debitCols.push(j);
      if (includesAny(cellNorm, HEADER_KEYWORDS.credit)) creditCols.push(j);
    }

    if (debitCols.length >= 2 && creditCols.length >= 2) {
      const usedCredits = new Set<number>();
      const pairs: Pair[] = [];
      for (const d of debitCols) {
        const c = pickClosest(d, creditCols, usedCredits);
        if (c === -1) continue;
        usedCredits.add(c);
        const section = inferSection(row, prevRow, d) !== 'unknown'
          ? inferSection(row, prevRow, d)
          : inferSection(row, prevRow, c);
        pairs.push({ debit: d, credit: c, section });
      }

      const opening = pairs.find(p => p.section === 'opening');
      const movement = pairs.find(p => p.section === 'movement');
      const closing = pairs.find(p => p.section === 'closing');
      const pairsSorted = [...pairs].sort((a, b) => Math.min(a.debit, a.credit) - Math.min(b.debit, b.credit));

      const inferredOpening = opening || pairsSorted[0];
      const inferredMovement = movement || pairsSorted[1];
      const inferredClosing = closing || pairsSorted[2] || pairsSorted[pairsSorted.length - 1];

      if (inferredOpening && inferredMovement && inferredClosing) {
        result.startRow = i + 1;
        result.openingDebit = inferredOpening.debit;
        result.openingCredit = inferredOpening.credit;
        result.movementDebit = inferredMovement.debit;
        result.movementCredit = inferredMovement.credit;
        result.closingDebit = inferredClosing.debit;
        result.closingCredit = inferredClosing.credit;

        if (result.nameCol === -1 || result.codeCol === -1) {
          const textCols = row
            .map((v: any, idx: number) => ({ idx, v: normalizeHeaderCell(v) }))
            .filter((x: any) => x.v && !includesAny(x.v, [...HEADER_KEYWORDS.debit, ...HEADER_KEYWORDS.credit, ...HEADER_KEYWORDS.opening, ...HEADER_KEYWORDS.movement, ...HEADER_KEYWORDS.closing]));
          if (textCols.length >= 2) {
            const sorted = textCols.sort((a: any, b: any) => b.idx - a.idx);
            if (result.codeCol === -1) result.codeCol = sorted[0].idx;
            if (result.nameCol === -1) result.nameCol = sorted[1].idx;
          }
        }
        return result;
      }
    }
  }

  // 2) Fallback: find first data-like row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 6) continue;
    const cells = row.map((v: any) => String(v ?? '').trim());
    const numericIdxs = cells
      .map((c: string, idx: number) => ({ idx, c }))
      .filter((x: any) => /[-(]?[0-9٠-٩][0-9٠-٩,\.٬٫\s]*\)?$/.test(x.c) && x.c.length > 0)
      .map((x: any) => x.idx);
    const codeIdx = cells.findIndex((c: string) => /^\d{1,12}$/.test(c));
    const nameIdx = cells.findIndex((c: string) => c.length > 2 && !/^\d+$/.test(c) && !c.includes('مدين') && !c.includes('دائن'));

    if (numericIdxs.length >= 2 && codeIdx !== -1 && nameIdx !== -1) {
      result.startRow = i;
      result.codeCol = codeIdx;
      result.nameCol = nameIdx;
      const nums = [...numericIdxs].sort((a, b) => a - b);
      result.closingDebit = nums[0];
      result.closingCredit = nums[1];
      result.movementDebit = nums[2] ?? nums[0];
      result.movementCredit = nums[3] ?? nums[1];
      result.openingDebit = nums[4] ?? nums[0];
      result.openingCredit = nums[5] ?? nums[1];
      return result;
    }
  }

  return result;
}

export function extractAccountName(row: any[], colMap: ColumnMap): string {
  if (colMap.nameCol >= 0) return String(row[colMap.nameCol] || '').trim();
  for (let j = 0; j < row.length; j++) {
    const cell = String(row[j] || '').trim();
    if (cell.length > 2 && !/^\d+(\.\d+)?$/.test(cell) && !cell.includes('مدين') && !cell.includes('دائن')) return cell;
  }
  return '';
}

export function extractAccountCode(row: any[], colMap: ColumnMap): string {
  if (colMap.codeCol >= 0) {
    const code = String(row[colMap.codeCol] || '').trim();
    if (/^\d+$/.test(code)) return code;
  }
  for (let j = row.length - 1; j >= 0; j--) {
    const cell = String(row[j] || '').trim();
    if (/^\d+$/.test(cell) && cell.length <= 6) return cell;
  }
  return '';
}

export function parseNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return Math.abs(value);
  if (typeof value !== 'string') return 0;
  const str = value.trim();
  if (!str) return 0;
  const negative = str.includes('(') && str.includes(')');
  const cleaned = str
    .replace(/[()]/g, '').replace(/,/g, '').replace(/٬/g, '')
    .replace(/٫/g, '.').replace(/\s/g, '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.abs(negative ? -num : num);
}
