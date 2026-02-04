import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { Custody } from '@/services/custody';

interface CustodySummary {
  custodyAmount: number;
  totalSpent: number;
  remaining: number;
  returnedAmount: number;
  carriedBalance: number;
  isOverspent: boolean;
}

export function useCustodyExport() {
  const exportToPdf = (custody: Custody, summary: CustodySummary) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    doc.setR2L(true);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('تصفية العهدة مع تحليل المصروفات', pageWidth - margin, 18, { align: 'right' });

    doc.setFontSize(12);
    doc.text(`${custody.custody_name} - مبلغ العهدة: ${summary.custodyAmount.toLocaleString()} ر.س`, pageWidth - margin, 28, { align: 'right' });

    // Date
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString('ar-SA');
    doc.text(`تاريخ التقرير: ${currentDate}`, margin, 18, { align: 'left' });

    let currentY = 45;

    // Summary cards
    const cardWidth = (pageWidth - margin * 2 - 24) / 4;
    const cardHeight = 25;

    const cards = [
      { label: 'مبلغ العهدة', value: summary.custodyAmount, color: [59, 130, 246] },
      { label: 'إجمالي المصروفات', value: summary.totalSpent, color: [220, 38, 38] },
      { label: 'المبلغ المردود', value: summary.returnedAmount, color: [22, 163, 74] },
      { label: 'الرصيد المرحل', value: summary.carriedBalance, color: [234, 88, 12] },
    ];

    cards.forEach((card, index) => {
      const x = pageWidth - margin - (index + 1) * cardWidth - index * 8 + cardWidth;

      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x - cardWidth, currentY, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(card.label, x - 5, currentY + 8, { align: 'right' });

      doc.setFontSize(14);
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(`${card.value.toLocaleString()} ر.س`, x - 5, currentY + 18, { align: 'right' });
    });

    currentY += cardHeight + 15;

    // Transactions table
    const transactions = custody.transactions || [];
    if (transactions.length > 0) {
      const tableHeaders = ['التاريخ', 'التحليل', 'البيان', 'القيمة'];
      const tableData = transactions.map(tx => [
        new Date(tx.transaction_date).toLocaleDateString('ar-SA'),
        tx.analysis_category || '-',
        tx.description,
        tx.amount.toLocaleString(),
      ]);

      // Add summary rows
      tableData.push(
        ['', '', 'الإجمالي', summary.totalSpent.toLocaleString()],
        ['', '', 'المبلغ المردود', summary.returnedAmount.toLocaleString()],
        ['', '', 'الرصيد المرحل', summary.carriedBalance.toLocaleString()]
      );

      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: currentY,
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 5,
          halign: 'right',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'right',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { halign: 'right', cellWidth: 30 },
          1: { halign: 'right', cellWidth: 50 },
          2: { halign: 'right' },
          3: { halign: 'right', cellWidth: 40 },
        },
        didParseCell: function (data: any) {
          // Style summary rows
          const rowIndex = data.row.index;
          const totalRows = tableData.length;
          if (rowIndex >= totalRows - 3) {
            data.cell.styles.fontStyle = 'bold';
            if (rowIndex === totalRows - 3) {
              data.cell.styles.fillColor = [240, 240, 240];
            } else if (rowIndex === totalRows - 2) {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [22, 163, 74];
            } else if (rowIndex === totalRows - 1) {
              data.cell.styles.fillColor = [255, 237, 213];
              data.cell.styles.textColor = [234, 88, 12];
            }
          }
        },
      });
    }

    doc.save(`تصفية_العهدة_${custody.custody_number}.pdf`);
  };

  const exportToExcel = async (custody: Custody, summary: CustodySummary) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Application';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('تصفية العهدة', {
      views: [{ rightToLeft: true }],
    });

    // Title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تصفية العهدة مع تحليل المصروفات';
    titleCell.font = { bold: true, size: 18, color: { argb: 'FF3B82F6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Custody info
    worksheet.getCell('A3').value = 'اسم العهدة:';
    worksheet.getCell('B3').value = custody.custody_name;
    worksheet.getCell('A3').font = { bold: true };

    worksheet.getCell('C3').value = 'مبلغ العهدة:';
    worksheet.getCell('D3').value = summary.custodyAmount;
    worksheet.getCell('C3').font = { bold: true };
    worksheet.getCell('D3').numFmt = '#,##0.00';

    worksheet.getCell('A4').value = 'التاريخ:';
    worksheet.getCell('B4').value = new Date(custody.custody_date).toLocaleDateString('ar-SA');
    worksheet.getCell('A4').font = { bold: true };

    worksheet.getCell('C4').value = 'المستلم:';
    worksheet.getCell('D4').value = custody.employee?.name || '-';
    worksheet.getCell('C4').font = { bold: true };

    // Headers
    const headerRow = worksheet.getRow(6);
    const headers = ['التاريخ', 'التحليل', 'البيان', 'القيمة'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Data rows
    const transactions = custody.transactions || [];
    let currentRow = 7;
    transactions.forEach((tx) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = new Date(tx.transaction_date).toLocaleDateString('ar-SA');
      row.getCell(2).value = tx.analysis_category || '-';
      row.getCell(3).value = tx.description;
      row.getCell(4).value = tx.amount;
      row.getCell(4).numFmt = '#,##0.00';

      [1, 2, 3, 4].forEach(col => {
        row.getCell(col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        row.getCell(col).alignment = { horizontal: 'right' };
      });

      currentRow++;
    });

    // Summary rows with formulas
    const dataStartRow = 7;
    const dataEndRow = currentRow - 1;

    // Total row
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(3).value = 'الإجمالي';
    totalRow.getCell(3).font = { bold: true };
    totalRow.getCell(4).value = { formula: `SUM(D${dataStartRow}:D${dataEndRow})` };
    totalRow.getCell(4).font = { bold: true };
    totalRow.getCell(4).numFmt = '#,##0.00';
    totalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E5E5' } };
    totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E5E5' } };
    [3, 4].forEach(col => {
      totalRow.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    currentRow++;

    // Returned amount row
    const returnedRow = worksheet.getRow(currentRow);
    returnedRow.getCell(3).value = 'المبلغ المردود';
    returnedRow.getCell(3).font = { bold: true };
    returnedRow.getCell(4).value = { formula: `MAX(0, D3-D${currentRow - 1})` };
    returnedRow.getCell(4).font = { bold: true, color: { argb: 'FF16A34A' } };
    returnedRow.getCell(4).numFmt = '#,##0.00';
    returnedRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    returnedRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    [3, 4].forEach(col => {
      returnedRow.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    currentRow++;

    // Carried balance row
    const carriedRow = worksheet.getRow(currentRow);
    carriedRow.getCell(3).value = 'الرصيد المرحل';
    carriedRow.getCell(3).font = { bold: true };
    carriedRow.getCell(4).value = { formula: `MAX(0, D${currentRow - 2}-D3)` };
    carriedRow.getCell(4).font = { bold: true, color: { argb: 'FFEA580C' } };
    carriedRow.getCell(4).numFmt = '#,##0.00';
    carriedRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
    carriedRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
    [3, 4].forEach(col => {
      carriedRow.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 20;

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تصفية_العهدة_${custody.custody_number}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { exportToPdf, exportToExcel };
}
