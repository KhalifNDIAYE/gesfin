import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  createPDFDocument,
  finalizePDF,
  savePDF,
  addSectionHeader,
  addKeyValueRow,
  addNotesSection,
  addSignatureBlocks,
  checkPageBreak,
  formatAmount,
  PDFOrganizationInfo,
  PDFTemplateContext,
} from "./pdfTemplate";

interface ReportLine {
  id: string;
  line_number: number | null;
  description: string | null;
  expense_category_id: string | null;
  amount: number;
  amount_local: number;
  cumulative_amount: number;
  budget_amount: number;
  variance_amount: number;
}

interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

interface FinancialReport {
  id: string;
  code: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  opening_balance: number;
  total_expenses: number;
  total_expenses_local: number;
  closing_balance: number;
  replenishment_requested: number;
  notes: string | null;
  submission_date: string | null;
  approval_date: string | null;
}

interface Convention {
  id: string;
  code: string;
  name: string;
  total_amount: number;
  disbursed_amount: number;
  remaining_amount: number;
  bailleur?: { name: string; short_name?: string };
  currency?: { code: string; symbol: string };
}

const reportTypeLabels: Record<string, string> = {
  ifr: "Interim Financial Report (IFR)",
  rsf: "Relevé des Sources et Utilisations de Fonds (RSF)",
  soe: "Statement of Expenditure (SOE)",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const statusMap: Record<string, 'draft' | 'validated' | 'closed' | 'cancelled'> = {
  draft: 'draft',
  submitted: 'draft',
  approved: 'validated',
  rejected: 'cancelled',
};

/**
 * Generate detailed financial report PDF using the centralized template
 */
export const generateDetailedReportPDF = async (
  report: FinancialReport,
  convention: Convention,
  reportLines: ReportLine[],
  expenseCategories: ExpenseCategory[],
  organization?: PDFOrganizationInfo | null
) => {
  const currencySymbol = convention.currency?.symbol || "XOF";
  
  // Create PDF with organization branding
  const ctx = await createPDFDocument(
    {
      title: reportTypeLabels[report.report_type] || report.report_type.toUpperCase(),
      subtitle: `Convention: ${convention.name}`,
      documentRef: report.code,
      documentDate: report.submission_date ? new Date(report.submission_date) : new Date(),
      status: statusMap[report.status] || 'draft',
      showWatermark: true,
      orientation: 'portrait',
    },
    organization || null
  );

  // Convention Info Box
  drawConventionInfoBox(ctx, report, convention);
  
  // Financial Summary
  drawFinancialSummary(ctx, report, currencySymbol);
  
  // Expense Categories Table
  if (reportLines.length > 0) {
    drawExpenseTable(ctx, reportLines, expenseCategories, currencySymbol);
  }
  
  // Convention Financial Summary
  drawConventionSummary(ctx, convention, currencySymbol);
  
  // Notes section
  if (report.notes) {
    addNotesSection(ctx, report.notes);
  }
  
  // Signature blocks
  addSignatureBlocks(ctx);
  
  // Finalize with footer and page numbers
  finalizePDF(ctx, {
    title: reportTypeLabels[report.report_type] || report.report_type.toUpperCase(),
    status: statusMap[report.status] || 'draft',
    showWatermark: true,
  });

  // Save
  savePDF(ctx, `${report.report_type.toUpperCase()}_${report.code}_${format(new Date(), "yyyyMMdd")}`);
};

function drawConventionInfoBox(
  ctx: PDFTemplateContext,
  report: FinancialReport,
  convention: Convention
): void {
  checkPageBreak(ctx, 40);
  
  ctx.doc.setFillColor(245, 245, 245);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 35, "F");
  ctx.doc.setDrawColor(200, 200, 200);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 35, "S");

  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(0, 0, 0);
  ctx.doc.text("INFORMATIONS CONVENTION", ctx.margin + 5, ctx.yPos + 8);
  
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.text(`Convention: ${convention.name}`, ctx.margin + 5, ctx.yPos + 16);
  ctx.doc.text(`Bailleur: ${convention.bailleur?.name || "N/A"}`, ctx.margin + 5, ctx.yPos + 24);
  ctx.doc.text(`Devise: ${convention.currency?.code || "XOF"}`, ctx.margin + 5, ctx.yPos + 32);
  
  ctx.doc.text(
    `Période: ${format(new Date(report.period_start), "dd MMMM yyyy", { locale: fr })} - ${format(new Date(report.period_end), "dd MMMM yyyy", { locale: fr })}`,
    ctx.pageWidth / 2,
    ctx.yPos + 16
  );
  ctx.doc.text(`Statut: ${statusLabels[report.status] || report.status}`, ctx.pageWidth / 2, ctx.yPos + 24);
  if (report.submission_date) {
    ctx.doc.text(`Date soumission: ${format(new Date(report.submission_date), "dd/MM/yyyy")}`, ctx.pageWidth / 2, ctx.yPos + 32);
  }

  ctx.yPos += 45;
}

function drawFinancialSummary(
  ctx: PDFTemplateContext,
  report: FinancialReport,
  currencySymbol: string
): void {
  addSectionHeader(ctx, "SITUATION FINANCIÈRE");
  
  addKeyValueRow(ctx, "Solde d'ouverture", formatAmount(report.opening_balance, 2, currencySymbol));
  addKeyValueRow(ctx, "Total des dépenses de la période", formatAmount(report.total_expenses, 2, currencySymbol));
  addKeyValueRow(ctx, "Solde de clôture", formatAmount(report.closing_balance, 2, currencySymbol), { bold: true });
  ctx.yPos += 3;
  addKeyValueRow(ctx, "Réapprovisionnement demandé", formatAmount(report.replenishment_requested, 2, currencySymbol), { bold: true });
  ctx.yPos += 10;
}

function drawExpenseTable(
  ctx: PDFTemplateContext,
  reportLines: ReportLine[],
  expenseCategories: ExpenseCategory[],
  currencySymbol: string
): void {
  addSectionHeader(ctx, "DÉTAIL DES DÉPENSES PAR CATÉGORIE");

  // Table header
  ctx.doc.setFillColor(220, 220, 220);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 8, "F");
  ctx.doc.setFontSize(9);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(0, 0, 0);
  
  const colWidths = [15, 55, 30, 30, 30, 25];
  let xPos = ctx.margin + 2;
  const headers = ["N°", "Catégorie", "Budget", "Dépenses", "Cumulé", "Écart"];
  
  headers.forEach((header, i) => {
    ctx.doc.text(header, xPos, ctx.yPos + 6);
    xPos += colWidths[i];
  });
  ctx.yPos += 10;

  // Table rows
  ctx.doc.setFont("helvetica", "normal");
  let totalBudget = 0;
  let totalExpenses = 0;
  let totalCumulative = 0;
  let totalVariance = 0;

  reportLines.forEach((line, index) => {
    checkPageBreak(ctx, 8);
    
    const category = expenseCategories.find(c => c.id === line.expense_category_id);
    const categoryName = category ? `${category.code} - ${category.name}` : (line.description || "Autre");

    if (index % 2 === 0) {
      ctx.doc.setFillColor(250, 250, 250);
      ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 7, "F");
    }

    xPos = ctx.margin + 2;
    ctx.doc.setFontSize(8);
    ctx.doc.text(String(line.line_number || index + 1), xPos, ctx.yPos + 5);
    xPos += colWidths[0];
    
    const truncatedName = categoryName.length > 30 ? categoryName.substring(0, 28) + "..." : categoryName;
    ctx.doc.text(truncatedName, xPos, ctx.yPos + 5);
    xPos += colWidths[1];
    
    ctx.doc.text(formatAmount(line.budget_amount, 0), xPos, ctx.yPos + 5);
    xPos += colWidths[2];
    
    ctx.doc.text(formatAmount(line.amount, 0), xPos, ctx.yPos + 5);
    xPos += colWidths[3];
    
    ctx.doc.text(formatAmount(line.cumulative_amount, 0), xPos, ctx.yPos + 5);
    xPos += colWidths[4];
    
    ctx.doc.text(formatAmount(line.variance_amount, 0), xPos, ctx.yPos + 5);

    totalBudget += line.budget_amount || 0;
    totalExpenses += line.amount || 0;
    totalCumulative += line.cumulative_amount || 0;
    totalVariance += line.variance_amount || 0;

    ctx.yPos += 7;
  });

  // Totals row
  checkPageBreak(ctx, 10);
  ctx.doc.setFillColor(200, 200, 200);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 8, "F");
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(9);
  
  xPos = ctx.margin + 2;
  ctx.doc.text("TOTAL", xPos, ctx.yPos + 6);
  xPos += colWidths[0] + colWidths[1];
  ctx.doc.text(formatAmount(totalBudget, 0), xPos, ctx.yPos + 6);
  xPos += colWidths[2];
  ctx.doc.text(formatAmount(totalExpenses, 0), xPos, ctx.yPos + 6);
  xPos += colWidths[3];
  ctx.doc.text(formatAmount(totalCumulative, 0), xPos, ctx.yPos + 6);
  xPos += colWidths[4];
  ctx.doc.text(formatAmount(totalVariance, 0), xPos, ctx.yPos + 6);
  
  ctx.yPos += 15;
}

function drawConventionSummary(
  ctx: PDFTemplateContext,
  convention: Convention,
  currencySymbol: string
): void {
  checkPageBreak(ctx, 50);
  
  addSectionHeader(ctx, "RÉCAPITULATIF CONVENTION");

  addKeyValueRow(ctx, "Montant total de la convention", formatAmount(convention.total_amount, 2, currencySymbol));
  addKeyValueRow(ctx, "Total décaissé à ce jour", formatAmount(convention.disbursed_amount, 2, currencySymbol));
  addKeyValueRow(ctx, "Solde disponible", formatAmount(convention.remaining_amount, 2, currencySymbol), { bold: true });

  const disbursementRate = convention.total_amount ? (convention.disbursed_amount / convention.total_amount) * 100 : 0;
  ctx.yPos += 5;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(10);
  ctx.doc.text(`Taux d'exécution: ${disbursementRate.toFixed(1)}%`, ctx.margin + 5, ctx.yPos + 5);
  
  // Progress bar
  const barWidth = 100;
  const barHeight = 8;
  const barX = ctx.pageWidth - ctx.margin - barWidth - 5;
  ctx.doc.setFillColor(230, 230, 230);
  ctx.doc.rect(barX, ctx.yPos, barWidth, barHeight, "F");
  ctx.doc.setFillColor(...ctx.primaryColor);
  ctx.doc.rect(barX, ctx.yPos, (barWidth * Math.min(disbursementRate, 100)) / 100, barHeight, "F");
  ctx.doc.setFontSize(8);
  ctx.doc.text(`${disbursementRate.toFixed(1)}%`, barX + barWidth + 3, ctx.yPos + 6);

  ctx.yPos += 20;
}

export default generateDetailedReportPDF;
