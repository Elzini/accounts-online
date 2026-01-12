import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TableColumn {
  header: string;
  key: string;
}

interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  summaryCards?: { label: string; value: string }[];
  fileName: string;
}

// Arabic font support - using built-in font with RTL
export function usePdfExport() {
  const exportToPdf = ({
    title,
    subtitle,
    columns,
    data,
    summaryCards,
    fileName,
  }: PdfExportOptions) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Set RTL direction
    doc.setR2L(true);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(title, pageWidth - margin, 18, { align: 'right' });

    // Subtitle
    if (subtitle) {
      doc.setFontSize(12);
      doc.text(subtitle, pageWidth - margin, 28, { align: 'right' });
    }

    // Date
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString('ar-SA');
    doc.text(`تاريخ التقرير: ${currentDate}`, margin, 18, { align: 'left' });

    let currentY = 45;

    // Summary cards
    if (summaryCards && summaryCards.length > 0) {
      const cardWidth = (pageWidth - margin * 2 - (summaryCards.length - 1) * 8) / summaryCards.length;
      const cardHeight = 25;

      doc.setTextColor(0, 0, 0);

      summaryCards.forEach((card, index) => {
        const x = pageWidth - margin - (index + 1) * cardWidth - index * 8 + cardWidth;
        
        // Card background
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x - cardWidth, currentY, cardWidth, cardHeight, 3, 3, 'FD');

        // Card label
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(card.label, x - 5, currentY + 8, { align: 'right' });

        // Card value
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text(card.value, x - 5, currentY + 18, { align: 'right' });
      });

      currentY += cardHeight + 15;
    }

    // Table
    if (data.length > 0) {
      const tableHeaders = columns.map(col => col.header);
      const tableData = data.map(row => 
        columns.map(col => String(row[col.key] || '-'))
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
        columnStyles: columns.reduce((acc, _, index) => {
          acc[index] = { halign: 'right' };
          return acc;
        }, {} as Record<number, { halign: string }>),
      });
    } else {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(14);
      doc.text('لا توجد بيانات للعرض', pageWidth / 2, currentY + 20, { align: 'center' });
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `صفحة ${i} من ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`${fileName}.pdf`);
  };

  return { exportToPdf };
}
