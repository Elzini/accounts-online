import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';

export interface ParsedTransaction {
  transaction_date: string;
  description?: string;
  reference?: string;
  debit: number;
  credit: number;
  balance?: number;
}

/**
 * Parse CSV bank statement
 */
export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    const dateCol = row['date'] || row['transaction_date'] || row['تاريخ'] || row['التاريخ'] || '';
    const descCol = row['description'] || row['details'] || row['الوصف'] || row['البيان'] || '';
    const refCol = row['reference'] || row['ref'] || row['المرجع'] || '';
    const debitCol = row['debit'] || row['withdrawal'] || row['مدين'] || row['سحب'] || '0';
    const creditCol = row['credit'] || row['deposit'] || row['دائن'] || row['إيداع'] || '0';
    const balanceCol = row['balance'] || row['الرصيد'] || '';

    if (dateCol) {
      transactions.push({
        transaction_date: dateCol,
        description: descCol,
        reference: refCol,
        debit: parseFloat(debitCol.replace(/[^0-9.-]/g, '')) || 0,
        credit: parseFloat(creditCol.replace(/[^0-9.-]/g, '')) || 0,
        balance: balanceCol ? parseFloat(balanceCol.replace(/[^0-9.-]/g, '')) : undefined,
      });
    }
  }

  return transactions;
}

/**
 * Convert ExcelJS cell value to string
 */
function cellToString(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  if (cell.value instanceof Date) {
    const d = cell.value;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String((cell.value as any).result ?? '');
  }
  return String(cell.value);
}

/**
 * Parse Excel bank statement using ExcelJS
 */
export async function parseExcel(arrayBuffer: ArrayBuffer): Promise<ParsedTransaction[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) return [];

  // Get headers from first row
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim().toLowerCase();
  });

  // Map columns
  const dateIdx = headers.findIndex(h => /date|تاريخ|التاريخ/i.test(h));
  const descIdx = headers.findIndex(h => /desc|detail|بيان|وصف/i.test(h));
  const refIdx = headers.findIndex(h => /ref|مرجع/i.test(h));
  const debitIdx = headers.findIndex(h => /debit|withdrawal|مدين|سحب/i.test(h));
  const creditIdx = headers.findIndex(h => /credit|deposit|دائن|إيداع/i.test(h));
  const balanceIdx = headers.findIndex(h => /balance|رصيد/i.test(h));
  const amountIdx = headers.findIndex(h => /amount|مبلغ|قيمة/i.test(h));

  const transactions: ParsedTransaction[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const dateVal = dateIdx > 0 ? cellToString(row.getCell(dateIdx)) : '';
    if (!dateVal) return;

    let debit = 0, credit = 0;
    if (debitIdx > 0) debit = parseFloat(cellToString(row.getCell(debitIdx)).replace(/[^0-9.-]/g, '')) || 0;
    if (creditIdx > 0) credit = parseFloat(cellToString(row.getCell(creditIdx)).replace(/[^0-9.-]/g, '')) || 0;

    if (amountIdx > 0 && debitIdx <= 0 && creditIdx <= 0) {
      const amount = parseFloat(cellToString(row.getCell(amountIdx)).replace(/[^0-9.-]/g, '')) || 0;
      if (amount < 0) debit = Math.abs(amount);
      else credit = amount;
    }

    transactions.push({
      transaction_date: dateVal,
      description: descIdx > 0 ? cellToString(row.getCell(descIdx)) : '',
      reference: refIdx > 0 ? cellToString(row.getCell(refIdx)) : '',
      debit,
      credit,
      balance: balanceIdx > 0 ? (parseFloat(cellToString(row.getCell(balanceIdx)).replace(/[^0-9.-]/g, '')) || undefined) : undefined,
    });
  });

  return transactions;
}

/**
 * Convert Excel to CSV text using ExcelJS (for AI fallback)
 */
async function excelToCSV(arrayBuffer: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return '';

  const lines: string[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const val = cellToString(cell);
      cells.push(val.includes(',') ? `"${val}"` : val);
    });
    lines.push(cells.join(','));
  });
  return lines.join('\n');
}

/**
 * Parse PDF/complex files using AI
 */
export async function parseWithAI(file: File, excelCsvFallback?: string): Promise<ParsedTransaction[]> {
  let content: string;
  let fileType = file.type;

  if (excelCsvFallback) {
    content = excelCsvFallback;
    fileType = 'text/csv';
  } else {
    content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const { data, error } = await supabase.functions.invoke('parse-bank-statement', {
    body: {
      fileContent: content,
      fileName: file.name,
      fileType: fileType,
    },
  });

  if (error) throw new Error(error.message || 'فشل في تحليل الملف');
  if (data?.error) throw new Error(data.error);
  return (data?.transactions || []) as ParsedTransaction[];
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseBankStatementFile(file: File): Promise<{ transactions: ParsedTransaction[]; method: 'csv' | 'excel' | 'ai' }> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    const transactions = parseCSV(text);
    if (transactions.length > 0) return { transactions, method: 'csv' };
    const aiTransactions = await parseWithAI(file);
    return { transactions: aiTransactions, method: 'ai' };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const buffer = await file.arrayBuffer();
      const transactions = await parseExcel(buffer);
      if (transactions.length > 0) return { transactions, method: 'excel' };

      // Fallback to AI - convert Excel to CSV text first
      const csvText = await excelToCSV(buffer);
      const aiTransactions = await parseWithAI(file, csvText);
      return { transactions: aiTransactions, method: 'ai' };
    } catch {
      const aiTransactions = await parseWithAI(file);
      return { transactions: aiTransactions, method: 'ai' };
    }
  }

  if (ext === 'pdf') {
    const transactions = await parseWithAI(file);
    return { transactions, method: 'ai' };
  }

  throw new Error('صيغة الملف غير مدعومة');
}
