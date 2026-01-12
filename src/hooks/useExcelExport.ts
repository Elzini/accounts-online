import * as XLSX from 'xlsx';

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
  const exportToExcel = ({
    title,
    columns,
    data,
    fileName,
    summaryData,
  }: ExcelExportOptions) => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Prepare header row
    const headers = columns.map(col => col.header);

    // Prepare data rows
    const rows = data.map(row => 
      columns.map(col => row[col.key] || '-')
    );

    // Create worksheet data
    const worksheetData: (string | number)[][] = [];

    // Add title
    worksheetData.push([title]);
    worksheetData.push([]); // Empty row

    // Add summary data if provided
    if (summaryData && summaryData.length > 0) {
      summaryData.forEach(item => {
        worksheetData.push([item.label, String(item.value)]);
      });
      worksheetData.push([]); // Empty row
    }

    // Add date
    worksheetData.push(['تاريخ التصدير:', new Date().toLocaleDateString('ar-SA')]);
    worksheetData.push([]); // Empty row

    // Add headers
    worksheetData.push(headers);

    // Add data rows
    rows.forEach(row => worksheetData.push(row));

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = columns.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    // Set RTL direction
    worksheet['!dir'] = 'rtl';

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));

    // Generate file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
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
