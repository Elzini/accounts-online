import ExcelJS from 'exceljs';

interface TableColumn {
  header: string;
  key: string;
}

interface ExcelExportOptions {
  title: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  fileName: string;
  summaryData?: { label: string; value: string | number }[];
}

export function useExcelExport() {
  const exportToExcel = async ({
    title,
    columns,
    data,
    fileName,
    summaryData,
  }: ExcelExportOptions) => {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Application';
    workbook.created = new Date();
    
    // Truncate sheet name to 31 characters (Excel limit)
    const sheetName = title.substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ rightToLeft: true }], // RTL support for Arabic
    });

    let currentRow = 1;

    // Add title
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    // Add summary data if provided
    if (summaryData && summaryData.length > 0) {
      summaryData.forEach(item => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = item.label;
        row.getCell(2).value = String(item.value);
        row.getCell(1).font = { bold: true };
        currentRow++;
      });
      currentRow++;
    }

    // Add export date
    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell(1).value = 'تاريخ التصدير:';
    dateRow.getCell(2).value = new Date().toLocaleDateString('ar-SA');
    dateRow.getCell(1).font = { bold: true };
    currentRow += 2;

    // Add headers
    const headerRow = worksheet.getRow(currentRow);
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    currentRow++;

    // Add data rows
    data.forEach(rowData => {
      const row = worksheet.getRow(currentRow);
      columns.forEach((col, index) => {
        const cell = row.getCell(index + 1);
        cell.value = rowData[col.key] ?? '-';
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      currentRow++;
    });

    // Set column widths
    columns.forEach((_, index) => {
      worksheet.getColumn(index + 1).width = 20;
    });

    // Generate file and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { exportToExcel };
}
