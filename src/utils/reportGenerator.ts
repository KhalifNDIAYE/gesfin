import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

const formatAmount = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0);
};

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

export const generateDetailedReportPDF = (
  report: FinancialReport,
  convention: Convention,
  reportLines: ReportLine[],
  expenseCategories: ExpenseCategory[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const addNewPage = () => {
    doc.addPage();
    yPos = margin;
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 280) {
      addNewPage();
    }
  };

  // Header
  doc.setFillColor(41, 65, 114);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(reportTypeLabels[report.report_type] || report.report_type.toUpperCase(), margin, 15);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Référence: ${report.code}`, margin, 25);
  doc.text(`Convention: ${convention.code}`, pageWidth - margin - 60, 25);

  yPos = 45;
  doc.setTextColor(0, 0, 0);

  // Convention Info Box
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, contentWidth, 35, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPos, contentWidth, 35, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS CONVENTION", margin + 5, yPos + 8);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Convention: ${convention.name}`, margin + 5, yPos + 16);
  doc.text(`Bailleur: ${convention.bailleur?.name || "N/A"}`, margin + 5, yPos + 24);
  doc.text(`Devise: ${convention.currency?.code || "XOF"}`, margin + 5, yPos + 32);
  
  doc.text(`Période: ${format(new Date(report.period_start), "dd MMMM yyyy", { locale: fr })} - ${format(new Date(report.period_end), "dd MMMM yyyy", { locale: fr })}`, pageWidth / 2, yPos + 16);
  doc.text(`Statut: ${statusLabels[report.status] || report.status}`, pageWidth / 2, yPos + 24);
  if (report.submission_date) {
    doc.text(`Date soumission: ${format(new Date(report.submission_date), "dd/MM/yyyy")}`, pageWidth / 2, yPos + 32);
  }

  yPos += 45;

  // Financial Summary
  doc.setFillColor(41, 65, 114);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SITUATION FINANCIÈRE", margin + 5, yPos + 6);
  yPos += 10;
  doc.setTextColor(0, 0, 0);

  const drawFinancialRow = (label: string, amount: number, isTotal = false, indent = 0) => {
    checkPageBreak(8);
    if (isTotal) {
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, yPos, contentWidth, 7, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(10);
    doc.text(label, margin + 5 + indent, yPos + 5);
    doc.text(`${formatAmount(amount)} ${convention.currency?.symbol || "XOF"}`, pageWidth - margin - 5, yPos + 5, { align: "right" });
    yPos += 7;
  };

  drawFinancialRow("Solde d'ouverture", report.opening_balance);
  drawFinancialRow("Total des dépenses de la période", report.total_expenses);
  drawFinancialRow("Solde de clôture", report.closing_balance, true);
  yPos += 3;
  drawFinancialRow("Réapprovisionnement demandé", report.replenishment_requested, true);

  yPos += 10;

  // Expense Categories Table
  if (reportLines.length > 0) {
    checkPageBreak(30);
    
    doc.setFillColor(41, 65, 114);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yPos, contentWidth, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES DÉPENSES PAR CATÉGORIE", margin + 5, yPos + 6);
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    // Table header
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPos, contentWidth, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    const colWidths = [15, 55, 30, 30, 30, 25];
    let xPos = margin + 2;
    const headers = ["N°", "Catégorie", "Budget", "Dépenses", "Cumulé", "Écart"];
    
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 6);
      xPos += colWidths[i];
    });
    yPos += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    let totalBudget = 0;
    let totalExpenses = 0;
    let totalCumulative = 0;
    let totalVariance = 0;

    reportLines.forEach((line, index) => {
      checkPageBreak(8);
      
      const category = expenseCategories.find(c => c.id === line.expense_category_id);
      const categoryName = category ? `${category.code} - ${category.name}` : (line.description || "Autre");

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, contentWidth, 7, "F");
      }

      xPos = margin + 2;
      doc.setFontSize(8);
      doc.text(String(line.line_number || index + 1), xPos, yPos + 5);
      xPos += colWidths[0];
      
      // Truncate category name if too long
      const truncatedName = categoryName.length > 30 ? categoryName.substring(0, 28) + "..." : categoryName;
      doc.text(truncatedName, xPos, yPos + 5);
      xPos += colWidths[1];
      
      doc.text(formatAmount(line.budget_amount, 0), xPos, yPos + 5);
      xPos += colWidths[2];
      
      doc.text(formatAmount(line.amount, 0), xPos, yPos + 5);
      xPos += colWidths[3];
      
      doc.text(formatAmount(line.cumulative_amount, 0), xPos, yPos + 5);
      xPos += colWidths[4];
      
      // Variance with color indicator
      const variance = line.variance_amount;
      doc.text(formatAmount(variance, 0), xPos, yPos + 5);

      totalBudget += line.budget_amount || 0;
      totalExpenses += line.amount || 0;
      totalCumulative += line.cumulative_amount || 0;
      totalVariance += variance || 0;

      yPos += 7;
    });

    // Totals row
    checkPageBreak(10);
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, yPos, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    xPos = margin + 2;
    doc.text("TOTAL", xPos, yPos + 6);
    xPos += colWidths[0] + colWidths[1];
    doc.text(formatAmount(totalBudget, 0), xPos, yPos + 6);
    xPos += colWidths[2];
    doc.text(formatAmount(totalExpenses, 0), xPos, yPos + 6);
    xPos += colWidths[3];
    doc.text(formatAmount(totalCumulative, 0), xPos, yPos + 6);
    xPos += colWidths[4];
    doc.text(formatAmount(totalVariance, 0), xPos, yPos + 6);
    
    yPos += 15;
  }

  // Convention Financial Summary
  checkPageBreak(40);
  
  doc.setFillColor(41, 65, 114);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RÉCAPITULATIF CONVENTION", margin + 5, yPos + 6);
  yPos += 10;
  doc.setTextColor(0, 0, 0);

  drawFinancialRow("Montant total de la convention", convention.total_amount);
  drawFinancialRow("Total décaissé à ce jour", convention.disbursed_amount);
  drawFinancialRow("Solde disponible", convention.remaining_amount, true);

  const disbursementRate = convention.total_amount ? (convention.disbursed_amount / convention.total_amount) * 100 : 0;
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Taux d'exécution: ${disbursementRate.toFixed(1)}%`, margin + 5, yPos + 5);
  
  // Progress bar
  const barWidth = 100;
  const barHeight = 8;
  const barX = pageWidth - margin - barWidth - 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(barX, yPos, barWidth, barHeight, "F");
  doc.setFillColor(41, 65, 114);
  doc.rect(barX, yPos, (barWidth * disbursementRate) / 100, barHeight, "F");
  doc.setFontSize(8);
  doc.text(`${disbursementRate.toFixed(1)}%`, barX + barWidth + 3, yPos + 6);

  yPos += 20;

  // Notes section
  if (report.notes) {
    checkPageBreak(30);
    doc.setFillColor(255, 255, 240);
    doc.rect(margin, yPos, contentWidth, 25, "F");
    doc.setDrawColor(200, 200, 100);
    doc.rect(margin, yPos, contentWidth, 25, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes et observations:", margin + 5, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const splitNotes = doc.splitTextToSize(report.notes, contentWidth - 10);
    doc.text(splitNotes, margin + 5, yPos + 16);
    
    yPos += 30;
  }

  // Footer with signatures
  checkPageBreak(45);
  yPos = 260;
  
  doc.setDrawColor(150, 150, 150);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  // Signature boxes
  const sigBoxWidth = (contentWidth - 20) / 3;
  
  const drawSignatureBox = (x: number, title: string) => {
    doc.text(title, x + 5, yPos);
    doc.line(x, yPos + 15, x + sigBoxWidth - 5, yPos + 15);
    doc.text("Date: _______________", x + 5, yPos + 22);
  };

  drawSignatureBox(margin, "Préparé par:");
  drawSignatureBox(margin + sigBoxWidth + 10, "Vérifié par:");
  drawSignatureBox(margin + 2 * sigBoxWidth + 20, "Approuvé par:");

  // Page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} sur ${pageCount} - Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  // Save
  doc.save(`${report.report_type.toUpperCase()}_${report.code}_${format(new Date(), "yyyyMMdd")}.pdf`);
};
