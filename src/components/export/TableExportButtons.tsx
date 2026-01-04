import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
  createPDFDocument, 
  finalizePDF, 
  savePDF, 
  addTable, 
  checkPageBreak,
  PDFOrganizationInfo 
} from "@/utils/pdfTemplate";

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
  organization?: PDFOrganizationInfo | null;
}

// HTML escape function to prevent XSS attacks
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

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

// Sanitized version of formatValue for HTML contexts
const formatValueSafe = (value: any, column: ExportColumn, row?: any): string => {
  return escapeHtml(formatValue(value, column, row));
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

    // Generate filename with date
    const today = new Date().toISOString().split('T')[0];
    const finalFilename = filename.includes('-') && filename.match(/\d{4}-\d{2}-\d{2}/) 
      ? filename 
      : `${filename.toUpperCase()}-${today}`;

    XLSX.writeFile(workbook, `${finalFilename}.xlsx`);
    toast.success("Export Excel réussi");
  } catch (error) {
    console.error("Erreur export Excel:", error);
    toast.error("Erreur lors de l'export Excel");
  }
};

export const exportToPDF = async (
  data: any[],
  columns: ExportColumn[],
  filename: string,
  title?: string,
  subtitle?: string,
  organization?: PDFOrganizationInfo | null
) => {
  try {
    // Create PDF with organization branding using the centralized template
    const ctx = await createPDFDocument(
      {
        title: title || filename,
        subtitle: subtitle,
        documentDate: new Date(),
        orientation: 'landscape',
      },
      organization || null
    );

    // Prepare table data
    const headers = columns.map(col => col.label);
    const rows = data.map(row => 
      columns.map(col => {
        const value = getNestedValue(row, col.key);
        return formatValue(value, col, row);
      })
    );

    // Calculate column widths based on content
    const contentWidth = ctx.contentWidth;
    const numCols = columns.length;
    const colWidths = Array(numCols).fill(contentWidth / numCols);

    // Add table
    addTable(ctx, headers, rows, colWidths);

    // Finalize with footer and page numbers
    finalizePDF(ctx, {
      title: title || filename,
    });

    // Generate filename with date
    const today = new Date().toISOString().split('T')[0];
    const finalFilename = filename.includes('-') && filename.match(/\d{4}-\d{2}-\d{2}/) 
      ? filename 
      : `${filename.toUpperCase()}-${today}`;

    savePDF(ctx, finalFilename);
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
  subtitle?: string,
  organization?: PDFOrganizationInfo | null
) => {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    // Sanitize all user-controlled data to prevent XSS
    const safeTitle = escapeHtml(title || "Export");
    const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
    const safeOrgName = organization?.name ? escapeHtml(organization.name) : "";
    const safeOrgAddress = organization?.address ? escapeHtml(organization.address) : "";
    const safeOrgPhone = organization?.phone ? escapeHtml(organization.phone) : "";
    const safeOrgEmail = organization?.email ? escapeHtml(organization.email) : "";

    const tableRows = data
      .map(
        (row) => `
        <tr>
          ${columns
            .map((col) => {
              const value = getNestedValue(row, col.key);
              return `<td>${formatValueSafe(value, col, row)}</td>`;
            })
            .join("")}
        </tr>
      `
      )
      .join("");

    const tableHeaders = columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safeTitle}</title>
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
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left h1 {
            margin: 0;
            font-size: 18px;
          }
          .header-left p {
            margin: 5px 0 0;
            font-size: 12px;
            opacity: 0.9;
          }
          .header-right {
            text-align: right;
            font-size: 10px;
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
          <div class="header-left">
            <h1>${safeTitle}</h1>
            ${safeSubtitle ? `<p>${safeSubtitle}</p>` : ""}
          </div>
          ${organization ? `
          <div class="header-right">
            <strong>${safeOrgName}</strong><br/>
            ${safeOrgAddress ? `${safeOrgAddress}<br/>` : ""}
            ${safeOrgPhone ? `Tél: ${safeOrgPhone}<br/>` : ""}
            ${safeOrgEmail ? `${safeOrgEmail}` : ""}
          </div>
          ` : ""}
        </div>
        <div class="meta">
          Imprimé le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")} | ${data.length} enregistrement(s)
        </div>
        <table>
          <thead>
            <tr>
              ${tableHeaders}
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
        <\/script>
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
  organization,
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
          onClick={() => exportToPDF(data, columns, filename, title, subtitle, organization)}
        >
          <FileText className="mr-2 h-4 w-4 text-destructive" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => printTable(data, columns, title, subtitle, organization)}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableExportButtons;