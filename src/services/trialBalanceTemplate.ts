// تصدير نموذج ميزان المراجعة بالتنسيق المطلوب لاستيراده
import ExcelJS from 'exceljs';

interface TemplateAccount {
  code: string;
  name: string;
  movementDebit: number;
  movementCredit: number;
  debit: number;
  credit: number;
}

// نموذج حسابات افتراضية لتوضيح الهيكل
const SAMPLE_ACCOUNTS: TemplateAccount[] = [
  // أصول متداولة (11xx - 13xx)
  { code: '1101', name: 'الصندوق (النقدية)', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1102', name: 'البنك - الحساب الجاري', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1201', name: 'العملاء (ذمم مدينة)', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1301', name: 'المخزون', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1302', name: 'مصاريف مدفوعة مقدماً', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // أصول غير متداولة (14xx - 19xx)
  { code: '1501', name: 'أثاث وتجهيزات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1502', name: 'معدات وآلات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1503', name: 'سيارات ومركبات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1504', name: 'مباني وعقارات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '1590', name: 'مجمع الإهلاك', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // مطلوبات متداولة (21xx - 22xx)
  { code: '2101', name: 'الموردون (ذمم دائنة)', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '2102', name: 'ضريبة القيمة المضافة المستحقة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '2103', name: 'رواتب مستحقة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '2104', name: 'مصروفات مستحقة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // مطلوبات غير متداولة (23xx - 24xx)
  { code: '2301', name: 'قروض طويلة الأجل', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '2302', name: 'مكافأة نهاية الخدمة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // حقوق ملكية (31xx - 33xx)
  { code: '3101', name: 'رأس المال', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '3201', name: 'الاحتياطي النظامي', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '3301', name: 'الأرباح المحتجزة (المرحّلة)', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // إيرادات (41xx - 42xx)
  { code: '4101', name: 'إيرادات المبيعات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '4201', name: 'إيرادات أخرى', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // تكلفة الإيرادات (51xx)
  { code: '5101', name: 'تكلفة البضاعة المباعة', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },

  // مصروفات (52xx - 55xx)
  { code: '5201', name: 'رواتب وأجور', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5202', name: 'إيجارات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5203', name: 'كهرباء وماء واتصالات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5204', name: 'صيانة وإصلاحات', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5301', name: 'مصاريف إدارية وعمومية', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5401', name: 'مصاريف تسويق ودعاية', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
  { code: '5501', name: 'مصاريف بنكية وفوائد', movementDebit: 0, movementCredit: 0, debit: 0, credit: 0 },
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
  noteCell.value = '⚠ ضع الأرقام في الأعمدة المناسبة. أعمدة الحركة اختيارية - أعمدة الرصيد (مدين/دائن) مطلوبة. الصفوف أدناه نماذج يمكنك حذفها.';
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
  worksheet.getColumn(1).width = 18; // رمز الحساب
  worksheet.getColumn(2).width = 40; // اسم الحساب
  worksheet.getColumn(3).width = 20; // حركة مدينة
  worksheet.getColumn(4).width = 20; // حركة دائنة
  worksheet.getColumn(5).width = 20; // مدين
  worksheet.getColumn(6).width = 20; // دائن

  // === بيانات النموذج ===
  if (includeSamples) {
    SAMPLE_ACCOUNTS.forEach((account, idx) => {
      const rowNum = idx + 4;
      const row = worksheet.getRow(rowNum);

      // تصنيف لوني حسب الرمز
      const prefix = account.code.charAt(0);
      let bgColor = 'FFFFFFFF';
      if (prefix === '1') bgColor = 'FFF0FFF4'; // أخضر فاتح - أصول
      if (prefix === '2') bgColor = 'FFFFF0F0'; // أحمر فاتح - مطلوبات
      if (prefix === '3') bgColor = 'FFF0F0FF'; // أزرق فاتح - حقوق ملكية
      if (prefix === '4') bgColor = 'FFFFFCE0'; // أصفر فاتح - إيرادات
      if (prefix === '5') bgColor = 'FFFFF5F0'; // برتقالي فاتح - مصروفات

      row.getCell(1).value = account.code;
      row.getCell(1).font = { size: 11 };
      row.getCell(1).alignment = { horizontal: 'center' };

      row.getCell(2).value = account.name;
      row.getCell(2).font = { size: 11 };
      row.getCell(2).alignment = { horizontal: 'right' };

      row.getCell(3).value = account.movementDebit || null;
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(3).alignment = { horizontal: 'center' };

      row.getCell(4).value = account.movementCredit || null;
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(4).alignment = { horizontal: 'center' };

      row.getCell(5).value = account.debit || null;
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(5).alignment = { horizontal: 'center' };

      row.getCell(6).value = account.credit || null;
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(6).alignment = { horizontal: 'center' };

      // تلوين الصف
      for (let c = 1; c <= COL_COUNT; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
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

  // صيغة مجموع حركة مدينة
  totalRow.getCell(3).value = { formula: `SUM(C4:C${totalRowNum - 1})` };
  totalRow.getCell(3).numFmt = '#,##0.00';
  totalRow.getCell(3).font = { bold: true, size: 12 };
  totalRow.getCell(3).alignment = { horizontal: 'center' };

  // صيغة مجموع حركة دائنة
  totalRow.getCell(4).value = { formula: `SUM(D4:D${totalRowNum - 1})` };
  totalRow.getCell(4).numFmt = '#,##0.00';
  totalRow.getCell(4).font = { bold: true, size: 12 };
  totalRow.getCell(4).alignment = { horizontal: 'center' };

  // صيغة مجموع المدين
  totalRow.getCell(5).value = { formula: `SUM(E4:E${totalRowNum - 1})` };
  totalRow.getCell(5).numFmt = '#,##0.00';
  totalRow.getCell(5).font = { bold: true, size: 12 };
  totalRow.getCell(5).alignment = { horizontal: 'center' };

  // صيغة مجموع الدائن
  totalRow.getCell(6).value = { formula: `SUM(F4:F${totalRowNum - 1})` };
  totalRow.getCell(6).numFmt = '#,##0.00';
  totalRow.getCell(6).font = { bold: true, size: 12 };
  totalRow.getCell(6).alignment = { horizontal: 'center' };

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
    ['1', 'عمود "رمز الحساب": ضع الرمز الرقمي للحساب (مثال: 1101, 2101, 4101)'],
    ['2', 'عمود "اسم الحساب": ضع اسم الحساب بالعربية (مثال: الصندوق، العملاء)'],
    ['3', 'عمود "حركة مدينة": إجمالي الحركة المدينة خلال الفترة (اختياري)'],
    ['4', 'عمود "حركة دائنة": إجمالي الحركة الدائنة خلال الفترة (اختياري)'],
    ['5', 'عمود "مدين": الرصيد النهائي المدين للحساب (مطلوب)'],
    ['6', 'عمود "دائن": الرصيد النهائي الدائن للحساب (مطلوب)'],
    ['', ''],
    ['', 'قواعد ترميز الحسابات (التصنيف التلقائي):'],
    ['', '1xxx = أصول (11xx نقد وبنوك، 12xx ذمم مدينة، 13xx مخزون، 15xx أصول ثابتة)'],
    ['', '2xxx = مطلوبات (21xx متداولة، 23xx غير متداولة)'],
    ['', '3xxx = حقوق ملكية (31xx رأس مال، 32xx احتياطي، 33xx أرباح محتجزة)'],
    ['', '4xxx = إيرادات (41xx مبيعات، 42xx إيرادات أخرى)'],
    ['', '5xxx = مصروفات (51xx تكلفة مبيعات، 52xx تشغيلية، 53xx إدارية)'],
    ['', ''],
    ['', '⚠ تنبيهات مهمة:'],
    ['', '• يجب أن يكون مجموع المدين = مجموع الدائن (ميزان متوازن)'],
    ['', '• لا تضع حسابات رئيسية (عناوين) تجمع حسابات فرعية، ضع الفرعية فقط'],
    ['', '• يمكنك حذف النماذج وإضافة حساباتك الخاصة'],
    ['', '• أعمدة الحركة اختيارية - يمكنك تركها فارغة والاكتفاء بأعمدة الرصيد'],
    ['', '• الأعمدة المطلوبة: رمز الحساب، اسم الحساب، مدين، دائن'],
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
