import * as XLSX from 'xlsx';
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
 * Parse Excel bank statement
 */
export function parseExcel(arrayBuffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to CSV and use CSV parser
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const csvResult = parseCSV(csv);
  
  if (csvResult.length > 0) return csvResult;

  // Fallback: try to parse rows directly with AI-like column detection
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length < 2) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
  const transactions: ParsedTransaction[] = [];

  // Map columns
  const dateIdx = headers.findIndex(h => /date|تاريخ|التاريخ/i.test(h));
  const descIdx = headers.findIndex(h => /desc|detail|بيان|وصف/i.test(h));
  const refIdx = headers.findIndex(h => /ref|مرجع/i.test(h));
  const debitIdx = headers.findIndex(h => /debit|withdrawal|مدين|سحب/i.test(h));
  const creditIdx = headers.findIndex(h => /credit|deposit|دائن|إيداع/i.test(h));
  const balanceIdx = headers.findIndex(h => /balance|رصيد/i.test(h));
  const amountIdx = headers.findIndex(h => /amount|مبلغ|قيمة/i.test(h));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let dateVal = dateIdx >= 0 ? row[dateIdx] : undefined;
    if (!dateVal) continue;

    // Handle Excel date serial numbers
    if (typeof dateVal === 'number') {
      const date = XLSX.SSF.parse_date_code(dateVal);
      if (date) dateVal = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    let debit = 0, credit = 0;
    if (debitIdx >= 0) debit = parseFloat(String(row[debitIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
    if (creditIdx >= 0) credit = parseFloat(String(row[creditIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
    
    // If single amount column
    if (amountIdx >= 0 && debitIdx < 0 && creditIdx < 0) {
      const amount = parseFloat(String(row[amountIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
      if (amount < 0) debit = Math.abs(amount);
      else credit = amount;
    }

    transactions.push({
      transaction_date: String(dateVal),
      description: descIdx >= 0 ? String(row[descIdx] || '') : '',
      reference: refIdx >= 0 ? String(row[refIdx] || '') : '',
      debit,
      credit,
      balance: balanceIdx >= 0 ? (parseFloat(String(row[balanceIdx] || '').replace(/[^0-9.-]/g, '')) || undefined) : undefined,
    });
  }

  return transactions;
}

/**
 * Parse PDF/complex files using AI
 * For Excel files, converts to CSV text first for better AI parsing
 */
export async function parseWithAI(file: File, excelCsvFallback?: string): Promise<ParsedTransaction[]> {
  let content: string;
  let fileType = file.type;

  if (excelCsvFallback) {
    // If we have Excel content converted to CSV, send that instead of binary
    content = excelCsvFallback;
    fileType = 'text/csv';
  } else {
    // Read file content as base64
    content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file); // always base64
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
    // Fallback to AI if CSV parsing fails
    const aiTransactions = await parseWithAI(file);
    return { transactions: aiTransactions, method: 'ai' };
  }
  
  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const buffer = await file.arrayBuffer();
      const transactions = parseExcel(buffer);
      if (transactions.length > 0) return { transactions, method: 'excel' };
      
      // Fallback to AI - convert Excel to CSV text first
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      const aiTransactions = await parseWithAI(file, csvText);
      return { transactions: aiTransactions, method: 'ai' };
    } catch {
      // If xlsx parsing completely fails, try AI with base64
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
