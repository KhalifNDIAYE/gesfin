import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any, row?: any) => string;
}

interface TableExportButtonsProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
  subtitle?: string;
}

const formatValue = (value: any, column: ExportColumn, row?: any): string => {
  if (column.format) {
    return column.format(value, row);
  }
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    return new Intl.NumberFormat("fr-FR").format(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("fr-FR");
  }
  return String(value);
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  filename: string
) => {
  try {
    const worksheetData = data.map((row) => {
      const rowData: Record<string, string> = {};
      columns.forEach((col) => {
        const value = getNestedValue(row, col.key);
        rowData[col.label] = formatValue(value, col, row);
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

    // Auto-size columns
    const colWidths = columns.map((col) => ({
      wch: Math.max(
        col.label.length,
        ...data.map((row) => {
          const value = getNestedValue(row, col.key);
          return formatValue(value, col, row).length;
        })
      ),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success("Export Excel réussi");
  } catch (error) {
    console.error("Erreur export Excel:", error);
    toast.error("Erreur lors de l'export Excel");
  }
};

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  filename: string,
  title?: string,
  subtitle?: string
) => {
  try {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFillColor(41, 65, 114);
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title || filename, margin, 12);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(subtitle, margin, 20);
    }

    doc.setFontSize(9);
    doc.text(
      `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
      pageWidth - margin,
      12,
      { align: "right" }
    );

    yPos = 35;
    doc.setTextColor(0, 0, 0);

    // Calculate column widths
    const contentWidth = pageWidth - 2 * margin;
    const colCount = columns.length;
    const colWidth = contentWidth / colCount;

    // Table header
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPos, contentWidth, 8, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");

    columns.forEach((col, i) => {
      const x = margin + i * colWidth + 2;
      const truncatedLabel =
        col.label.length > 15 ? col.label.substring(0, 13) + ".." : col.label;
      doc.text(truncatedLabel, x, yPos + 6);
    });

    yPos += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    data.forEach((row, rowIndex) => {
      // Check for page break
      if (yPos > 190) {
        doc.addPage();
        yPos = margin;

        // Repeat header
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, yPos, contentWidth, 8, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        columns.forEach((col, i) => {
          const x = margin + i * colWidth + 2;
          const truncatedLabel =
            col.label.length > 15 ? col.label.substring(0, 13) + ".." : col.label;
          doc.text(truncatedLabel, x, yPos + 6);
        });
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, contentWidth, 7, "F");
      }

      columns.forEach((col, i) => {
        const x = margin + i * colWidth + 2;
        const value = getNestedValue(row, col.key);
        const formattedValue = formatValue(value, col, row);
        const truncatedValue =
          formattedValue.length > 20
            ? formattedValue.substring(0, 18) + ".."
            : formattedValue;
        doc.text(truncatedValue, x, yPos + 5);
      });

      yPos += 7;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, 205, {
        align: "center",
      });
    }

    doc.save(`${filename}.pdf`);
    toast.success("Export PDF réussi");
  } catch (error) {
    console.error("Erreur export PDF:", error);
    toast.error("Erreur lors de l'export PDF");
  }
};

export const printTable = (
  data: any[],
  columns: ExportColumn[],
  title?: string,
  subtitle?: string
) => {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    const tableRows = data
      .map(
        (row) => `
        <tr>
          ${columns
            .map((col) => {
              const value = getNestedValue(row, col.key);
              return `<td>${formatValue(value, col, row)}</td>`;
            })
            .join("")}
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || "Impression"}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            background: #294172;
            color: white;
            padding: 15px 20px;
            margin: -20px -20px 20px -20px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 5px 0 0;
            font-size: 12px;
            opacity: 0.9;
          }
          .meta {
            font-size: 11px;
            color: #666;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
          }
          td {
            border: 1px solid #ddd;
            padding: 6px;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          .footer {
            margin-top: 20px;
            font-size: 10px;
            color: #999;
            text-align: center;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title || "Export"}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        <div class="meta">
          Imprimé le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")} | ${data.length} enregistrement(s)
        </div>
        <table>
          <thead>
            <tr>
              ${columns.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          Document généré automatiquement - Page 1
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success("Impression lancée");
  } catch (error) {
    console.error("Erreur impression:", error);
    toast.error("Erreur lors de l'impression");
  }
};

export const TableExportButtons = ({
  data,
  columns,
  filename,
  title,
  subtitle,
}: TableExportButtonsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportToExcel(data, columns, filename)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-success" />
          Export Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPDF(data, columns, filename, title, subtitle)}
        >
          <FileText className="mr-2 h-4 w-4 text-destructive" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => printTable(data, columns, title, subtitle)}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableExportButtons;