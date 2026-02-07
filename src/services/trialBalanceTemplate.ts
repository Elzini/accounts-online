// تصدير نموذج ميزان المراجعة بالتنسيق المطلوب لاستيراده
import ExcelJS from 'exceljs';

interface TemplateAccount {
  code: string;
  name: string;
  movementDebit: number;
  movementCredit: number;
  debit: number;
  credit: number;
  isHeader?: boolean; // حساب رئيسي (عنوان)
  level?: number; // مستوى المسافة البادئة
}

// شجرة الحسابات حسب طلب المستخدم
// 1=أصول، 2=خصوم وحقوق ملكية، 3=إيرادات، 4=مصروفات
const SAMPLE_ACCOUNTS: TemplateAccount[] = [
  // ============ الأصول (1) ============
  { code: '1', name: 'الأصول', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 0 },

  // صافي الأصول الثابتة (11)
  { code: '11', name: 'صافي الأصول الثابتة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '110', name: 'أصول ثابتة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 2 },
  { code: '1101', name: 'الأثاث', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },
  { code: '1105', name: 'اجهزه و الات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },

  // الأصول المتداولة (12)
  { code: '12', name: 'الأصول المتداولة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '1204', name: 'البنوك', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 2 },
  { code: '12042', name: 'مصرف الراجحي حساب رقم 4477553', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },
  { code: '1210', name: 'عهدة الموظفين', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 2 },
  { code: '12102', name: 'عهده احمد', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },
  { code: '1216', name: 'اطراف ذات علاقه مؤسسة فلاح', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },

  // حسابات مدينة أخرى (13)
  { code: '13', name: 'حسابات مدينة أخرى', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '1306', name: 'إيجار مدفوع مقدما', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },

  // ============ الخصوم (2) ============
  { code: '2', name: 'الخصوم', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 0 },

  // أرصدة دائنة أخرى (23)
  { code: '23', name: 'أرصدة دائنة أخرى', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '2302', name: 'رواتب مستحقة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
  { code: '2309', name: 'ضريبة القيمة المضافة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 2 },
  { code: '23091', name: 'ضريبة المدخلات - مشتريات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },
  { code: '23092', name: 'ضريبة المخرجات - مبيعات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },

  // حقوق الملكية ورأس المال (25)
  { code: '25', name: 'حقوق الملكية ورأس المال', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '2502', name: 'جاري المالك', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 2 },
  { code: '25021', name: 'جاري فلاح', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 3 },

  // ============ الإيرادات (3) ============
  { code: '3', name: 'الإيرادات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 0 },
  { code: '31', name: 'المبيعات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '3112', name: 'المبيعات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },

  // ============ المصروفات (4) ============
  { code: '4', name: 'المصروفات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 0 },

  // المصاريف العمومية والإدارية (41)
  { code: '41', name: 'المصاريف العمومية والإدارية', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '4101', name: 'الرواتب', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
  { code: '4107', name: 'مصروفات اللوازم المكتبية', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
  { code: '4108', name: 'مصروف ايجار', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
  { code: '4115', name: 'متنوعة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
  { code: '4127', name: 'مصاريف ضيافة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },

  // مصاريف التشغيل (44)
  { code: '44', name: 'مصاريف التشغيل', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '440002', name: 'مصروفات النظافه', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },

  // المشتريات (45)
  { code: '45', name: 'المشتريات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, isHeader: true, level: 1 },
  { code: '4511', name: 'المشتريات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0, level: 2 },
];

const COL_COUNT = 6;

export async function exportTrialBalanceTemplate(includeSamples: boolean = true) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'نظام القوائم المالية';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('ميزان المراجعة', {
    views: [{ rightToLeft: true }],
  });

  // === صف العنوان ===
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'ميزان المراجعة';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A365D' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
  worksheet.getRow(1).height = 35;

  // === صف الملاحظات ===
  worksheet.mergeCells('A2:F2');
  const noteCell = worksheet.getCell('A2');
  noteCell.value = '⚠ ضع الأرقام في الأعمدة المناسبة. أعمدة الحركة اختيارية - أعمدة الرصيد (مدين/دائن) مطلوبة. الصفوف أدناه نماذج يمكنك تعديلها.';
  noteCell.font = { size: 10, color: { argb: 'FF7C3AED' }, italic: true };
  noteCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(2).height = 28;

  // === صف العناوين (الأعمدة) ===
  const headerRow = worksheet.getRow(3);
  const headers = ['رمز الحساب', 'اسم الحساب', 'حركة مدينة', 'حركة دائنة', 'مدين', 'دائن'];
  headers.forEach((header, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    const isMovement = i === 2 || i === 3;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMovement ? 'FF7C3AED' : 'FF2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
      left: { style: 'thin', color: { argb: 'FF1E40AF' } },
      right: { style: 'thin', color: { argb: 'FF1E40AF' } },
    };
  });
  worksheet.getRow(3).height = 30;

  // === عرض الأعمدة ===
  worksheet.getColumn(1).width = 18;
  worksheet.getColumn(2).width = 45;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 20;
  worksheet.getColumn(5).width = 20;
  worksheet.getColumn(6).width = 20;

  // === دالة مساعدة: إيجاد نطاق الحسابات الفرعية لحساب رئيسي ===
  function findChildRange(headerIdx: number): { firstRow: number; lastRow: number } | null {
    const headerAccount = SAMPLE_ACCOUNTS[headerIdx];
    const headerLevel = headerAccount.level || 0;
    let firstChild = -1;
    let lastChild = -1;

    for (let i = headerIdx + 1; i < SAMPLE_ACCOUNTS.length; i++) {
      const childLevel = SAMPLE_ACCOUNTS[i].level || 0;
      // توقف إذا وصلنا لحساب بنفس المستوى أو أعلى
      if (childLevel <= headerLevel) break;
      // نجمع فقط الأبناء المباشرين (المستوى التالي مباشرة) الذين ليسوا رئيسيين
      // أو الأبناء الرئيسيين (سيحتوون بدورهم على SUM)
      if (firstChild === -1) firstChild = i;
      lastChild = i;
    }

    if (firstChild === -1) return null;
    return { firstRow: firstChild + 4, lastRow: lastChild + 4 }; // +4 لأن البيانات تبدأ من صف 4
  }

  // === بيانات النموذج ===
  if (includeSamples) {
    // المرحلة 1: كتابة البيانات الأساسية
    SAMPLE_ACCOUNTS.forEach((account, idx) => {
      const rowNum = idx + 4;
      const row = worksheet.getRow(rowNum);

      // تصنيف لوني حسب الرمز الأول
      const prefix = account.code.charAt(0);
      let bgColor = 'FFFFFFFF';
      let headerBgColor = 'FFFFFFFF';
      if (prefix === '1') { bgColor = 'FFF0FFF4'; headerBgColor = 'FFD1FAE5'; } // أخضر - أصول
      if (prefix === '2') { bgColor = 'FFFFF0F0'; headerBgColor = 'FFFEE2E2'; } // أحمر - خصوم
      if (prefix === '3') { bgColor = 'FFF0F0FF'; headerBgColor = 'FFE0E7FF'; } // أزرق - إيرادات
      if (prefix === '4') { bgColor = 'FFFFF5F0'; headerBgColor = 'FFFED7AA'; } // برتقالي - مصروفات

      const isHeader = account.isHeader;
      const indent = account.level || 0;
      const indentSpaces = '  '.repeat(indent);

      row.getCell(1).value = account.code;
      row.getCell(1).font = { size: 11, bold: !!isHeader };
      row.getCell(1).alignment = { horizontal: 'center' };

      row.getCell(2).value = indentSpaces + account.name;
      row.getCell(2).font = { size: 11, bold: !!isHeader };
      row.getCell(2).alignment = { horizontal: 'right', indent: indent };

      if (isHeader) {
        // الحسابات الرئيسية: إضافة صيغة SUM لجمع الفروع التابعة لها
        const childRange = findChildRange(idx);
        if (childRange) {
          for (let c = 3; c <= 6; c++) {
            const colLetter = String.fromCharCode(64 + c);
            row.getCell(c).value = { formula: `SUM(${colLetter}${childRange.firstRow}:${colLetter}${childRange.lastRow})` };
            row.getCell(c).numFmt = '#,##0.00';
            row.getCell(c).font = { bold: true, size: 11, color: { argb: 'FF1A365D' } };
          }
        }
      } else {
        // الحسابات الفرعية: القيم العادية
        row.getCell(3).value = account.movementDebit || null;
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).value = account.movementCredit || null;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).value = account.debit || null;
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(6).value = account.credit || null;
        row.getCell(6).numFmt = '#,##0.00';
      }

      for (let c = 3; c <= 6; c++) {
        row.getCell(c).alignment = { horizontal: 'center' };
      }

      // تلوين الصف
      const rowBg = isHeader ? headerBgColor : bgColor;
      for (let c = 1; c <= COL_COUNT; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        row.getCell(c).border = {
          top: { style: 'hair', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } },
          left: { style: 'hair', color: { argb: 'FFD0D0D0' } },
          right: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        };
      }
    });
  }

  // === صف المجموع ===
  const totalRowNum = SAMPLE_ACCOUNTS.length + 4;
  const totalRow = worksheet.getRow(totalRowNum);
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'المجموع';
  totalRow.getCell(2).font = { bold: true, size: 12 };
  totalRow.getCell(2).alignment = { horizontal: 'center' };

  for (let c = 3; c <= 6; c++) {
    const colLetter = String.fromCharCode(64 + c);
    totalRow.getCell(c).value = { formula: `SUM(${colLetter}4:${colLetter}${totalRowNum - 1})` };
    totalRow.getCell(c).numFmt = '#,##0.00';
    totalRow.getCell(c).font = { bold: true, size: 12 };
    totalRow.getCell(c).alignment = { horizontal: 'center' };
  }

  for (let c = 1; c <= COL_COUNT; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalRow.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF2563EB' } },
      bottom: { style: 'medium', color: { argb: 'FF2563EB' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  }

  // === ورقة التعليمات ===
  const instrSheet = workbook.addWorksheet('تعليمات الاستخدام', {
    views: [{ rightToLeft: true }],
  });

  instrSheet.getColumn(1).width = 5;
  instrSheet.getColumn(2).width = 60;

  const instructions = [
    ['', 'تعليمات تعبئة ميزان المراجعة'],
    ['', ''],
    ['1', 'عمود "رمز الحساب": ضع الرمز الرقمي للحساب (مثال: 1101, 2302, 4101)'],
    ['2', 'عمود "اسم الحساب": ضع اسم الحساب بالعربية'],
    ['3', 'عمود "حركة مدينة": إجمالي الحركة المدينة خلال الفترة (اختياري)'],
    ['4', 'عمود "حركة دائنة": إجمالي الحركة الدائنة خلال الفترة (اختياري)'],
    ['5', 'عمود "مدين": الرصيد النهائي المدين للحساب (مطلوب)'],
    ['6', 'عمود "دائن": الرصيد النهائي الدائن للحساب (مطلوب)'],
    ['', ''],
    ['', 'قواعد ترميز الحسابات (التصنيف التلقائي):'],
    ['', '1 = الأصول'],
    ['', '  11 = صافي الأصول الثابتة (أصول غير متداولة)'],
    ['', '  12 = الأصول المتداولة (بنوك، عهد، أطراف ذات علاقة)'],
    ['', '  13 = حسابات مدينة أخرى (إيجار مدفوع مقدماً)'],
    ['', '2 = الخصوم'],
    ['', '  23 = أرصدة دائنة أخرى (رواتب مستحقة، ضريبة القيمة المضافة)'],
    ['', '  25 = حقوق الملكية ورأس المال (جاري المالك)'],
    ['', '3 = الإيرادات'],
    ['', '  31 = المبيعات'],
    ['', '4 = المصروفات'],
    ['', '  41 = المصاريف العمومية والإدارية'],
    ['', '  44 = مصاريف التشغيل'],
    ['', '  45 = المشتريات'],
    ['', ''],
    ['', '⚠ تنبيهات مهمة:'],
    ['', '• يجب أن يكون مجموع المدين = مجموع الدائن (ميزان متوازن)'],
    ['', '• ضع الحسابات الفرعية فقط (مثل 1101، 4101) مع أرقامها'],
    ['', '• الحسابات الرئيسية (العناوين) موجودة كمرجع ولا تحتاج أرقام'],
    ['', '• يمكنك حذف النماذج وإضافة حساباتك الخاصة'],
    ['', '• أعمدة الحركة اختيارية - يمكنك تركها فارغة والاكتفاء بأعمدة الرصيد'],
  ];

  instructions.forEach((row, idx) => {
    const r = instrSheet.getRow(idx + 1);
    r.getCell(1).value = row[0];
    r.getCell(1).font = { bold: true, size: 11 };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).value = row[1];
    r.getCell(2).font = idx === 0
      ? { bold: true, size: 14, color: { argb: 'FF1A365D' } }
      : { size: 11 };
    r.getCell(2).alignment = { horizontal: 'right', wrapText: true };
  });

  // === تصدير الملف ===
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'نموذج_ميزان_المراجعة.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
