import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface PDFOrganizationInfo {
  name: string;
  acronym?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  tax_id?: string | null;
  logo_url?: string | null;
}

export interface PDFDocumentConfig {
  title: string;
  subtitle?: string;
  documentRef?: string;
  documentDate?: Date;
  status?: 'draft' | 'validated' | 'closed' | 'cancelled';
  orientation?: 'portrait' | 'landscape';
  showWatermark?: boolean;
  showLegalMentions?: boolean;
  legalMentions?: string;
}

export interface PDFTemplateContext {
  doc: jsPDF;
  yPos: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  primaryColor: [number, number, number];
  organization: PDFOrganizationInfo | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'BROUILLON',
  validated: 'VALIDÉ',
  closed: 'CLÔTURÉ',
  cancelled: 'ANNULÉ',
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  draft: [150, 150, 150],
  validated: [34, 139, 34],
  closed: [41, 65, 114],
  cancelled: [220, 53, 69],
};

// Default primary color (can be customized)
const DEFAULT_PRIMARY_COLOR: [number, number, number] = [41, 65, 114];

/**
 * Load an image from URL and convert to base64 for embedding in PDF
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}

/**
 * Format amount with French locale
 */
export const formatAmount = (amount: number, decimals = 2, currency?: string): string => {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0);
  return currency ? `${formatted} ${currency}` : formatted;
};

/**
 * Create a new PDF document with organization branding
 */
export async function createPDFDocument(
  config: PDFDocumentConfig,
  organization: PDFOrganizationInfo | null = null
): Promise<PDFTemplateContext> {
  const orientation = config.orientation || 'portrait';
  const doc = new jsPDF({ orientation });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const primaryColor = DEFAULT_PRIMARY_COLOR;
  
  let yPos = margin;

  // Draw header with organization info
  yPos = await drawHeader(doc, organization, primaryColor, margin, pageWidth);
  
  // Draw document title section
  yPos = drawTitleSection(doc, config, margin, pageWidth, yPos);

  // Apply watermark on all pages if status is provided
  if (config.showWatermark && config.status) {
    applyWatermark(doc, config.status, pageWidth, pageHeight);
  }

  return {
    doc,
    yPos,
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    primaryColor,
    organization,
  };
}

/**
 * Draw header with organization branding
 */
async function drawHeader(
  doc: jsPDF,
  organization: PDFOrganizationInfo | null,
  primaryColor: [number, number, number],
  margin: number,
  pageWidth: number
): Promise<number> {
  const headerHeight = 35;
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  
  let logoWidth = 0;
  
  // Try to load and add organization logo
  if (organization?.logo_url) {
    try {
      const logoData = await loadImageAsBase64(organization.logo_url);
      if (logoData) {
        const logoHeight = 20;
        logoWidth = 25;
        doc.addImage(logoData, 'AUTO', margin, 7.5, logoWidth, logoHeight);
        logoWidth += 5; // Add spacing after logo
      }
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }
  
  // Organization name (left side)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const orgName = organization?.name || organization?.acronym || "Organisation";
  doc.text(orgName, margin + logoWidth, 15);
  
  // Organization contact info (right side)
  if (organization) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const infoLines: string[] = [];
    if (organization.address) infoLines.push(organization.address);
    if (organization.city) infoLines.push(organization.city);
    if (organization.phone) infoLines.push(`Tél: ${organization.phone}`);
    if (organization.email) infoLines.push(organization.email);
    if (organization.website) infoLines.push(organization.website);
    
    infoLines.slice(0, 4).forEach((line, index) => {
      doc.text(line, pageWidth - margin, 8 + (index * 4), { align: "right" });
    });
  }
  
  // Separator line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, headerHeight + 2, pageWidth - margin, headerHeight + 2);
  
  return headerHeight + 8;
}

/**
 * Draw document title section
 */
function drawTitleSection(
  doc: jsPDF,
  config: PDFDocumentConfig,
  margin: number,
  pageWidth: number,
  yPos: number
): number {
  const contentWidth = pageWidth - 2 * margin;
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(config.title, margin, yPos + 10);
  
  // Subtitle
  if (config.subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, margin, yPos + 18);
  }
  
  // Document reference and date (right side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  let rightYPos = yPos + 10;
  if (config.documentRef) {
    doc.text(`Réf: ${config.documentRef}`, pageWidth - margin, rightYPos, { align: "right" });
    rightYPos += 6;
  }
  
  const docDate = config.documentDate || new Date();
  doc.text(`Date: ${format(docDate, "dd MMMM yyyy", { locale: fr })}`, pageWidth - margin, rightYPos, { align: "right" });
  rightYPos += 6;
  
  // Status badge
  if (config.status) {
    const statusLabel = STATUS_LABELS[config.status] || config.status.toUpperCase();
    const statusColor = STATUS_COLORS[config.status] || [100, 100, 100];
    
    doc.setFillColor(...statusColor);
    const badgeWidth = 30;
    const badgeX = pageWidth - margin - badgeWidth;
    doc.roundedRect(badgeX, rightYPos - 4, badgeWidth, 8, 2, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(statusLabel, badgeX + badgeWidth / 2, rightYPos + 1, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 25, pageWidth - margin, yPos + 25);
  
  return yPos + 32;
}

/**
 * Apply watermark to all pages
 */
function applyWatermark(
  doc: jsPDF,
  status: string,
  pageWidth: number,
  pageHeight: number
): void {
  const statusLabel = STATUS_LABELS[status] || status.toUpperCase();
  const statusColor = STATUS_COLORS[status] || [150, 150, 150];
  
  doc.setTextColor(...statusColor);
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  
  // Rotate and center the watermark
  doc.text(statusLabel, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  });
  
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
}

/**
 * Add a section header
 */
export function addSectionHeader(
  ctx: PDFTemplateContext,
  title: string,
  backgroundColor?: [number, number, number]
): void {
  checkPageBreak(ctx, 15);
  
  const bgColor = backgroundColor || ctx.primaryColor;
  ctx.doc.setFillColor(...bgColor);
  ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 8, "F");
  ctx.doc.setFontSize(11);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text(title, ctx.margin + 5, ctx.yPos + 6);
  ctx.yPos += 12;
  ctx.doc.setTextColor(0, 0, 0);
}

/**
 * Add key-value row
 */
export function addKeyValueRow(
  ctx: PDFTemplateContext,
  label: string,
  value: string,
  options?: { bold?: boolean; indent?: number }
): void {
  checkPageBreak(ctx, 8);
  
  const indent = options?.indent || 0;
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", options?.bold ? "bold" : "normal");
  ctx.doc.text(label, ctx.margin + 5 + indent, ctx.yPos + 5);
  ctx.doc.text(value, ctx.pageWidth - ctx.margin - 5, ctx.yPos + 5, { align: "right" });
  ctx.yPos += 7;
}

/**
 * Add a table with headers and rows
 */
export function addTable(
  ctx: PDFTemplateContext,
  headers: string[],
  rows: string[][],
  colWidths?: number[]
): void {
  checkPageBreak(ctx, 20);
  
  const numCols = headers.length;
  const defaultColWidth = ctx.contentWidth / numCols;
  const widths = colWidths || Array(numCols).fill(defaultColWidth);
  
  // Header row
  ctx.doc.setFillColor(220, 220, 220);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 8, "F");
  ctx.doc.setFontSize(9);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(0, 0, 0);
  
  let xPos = ctx.margin + 2;
  headers.forEach((header, i) => {
    const truncated = header.length > 15 ? header.substring(0, 13) + ".." : header;
    ctx.doc.text(truncated, xPos, ctx.yPos + 6);
    xPos += widths[i];
  });
  ctx.yPos += 10;
  
  // Data rows
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8);
  
  rows.forEach((row, rowIndex) => {
    checkPageBreak(ctx, 8);
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      ctx.doc.setFillColor(250, 250, 250);
      ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, 7, "F");
    }
    
    xPos = ctx.margin + 2;
    row.forEach((cell, i) => {
      const truncated = cell.length > 25 ? cell.substring(0, 23) + ".." : cell;
      ctx.doc.text(truncated, xPos, ctx.yPos + 5);
      xPos += widths[i];
    });
    ctx.yPos += 7;
  });
  
  ctx.yPos += 5;
}

/**
 * Add notes/observation section
 */
export function addNotesSection(ctx: PDFTemplateContext, notes: string): void {
  checkPageBreak(ctx, 30);
  
  ctx.doc.setFillColor(255, 255, 240);
  ctx.doc.setDrawColor(200, 200, 100);
  const notesHeight = Math.min(Math.ceil(notes.length / 80) * 6 + 15, 40);
  ctx.doc.rect(ctx.margin, ctx.yPos, ctx.contentWidth, notesHeight, "FD");
  
  ctx.doc.setFontSize(10);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(0, 0, 0);
  ctx.doc.text("Notes et observations:", ctx.margin + 5, ctx.yPos + 8);
  
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(9);
  const splitNotes = ctx.doc.splitTextToSize(notes, ctx.contentWidth - 10);
  ctx.doc.text(splitNotes, ctx.margin + 5, ctx.yPos + 16);
  
  ctx.yPos += notesHeight + 5;
}

/**
 * Electronic signature data interface
 */
export interface PDFSignatureData {
  signerName: string;
  signerRole: string;
  signedAt: string;
  status: 'signed' | 'pending' | 'rejected';
  signatureId?: string;
}

/**
 * Add signature blocks (simple version for manual signatures)
 */
export function addSignatureBlocks(
  ctx: PDFTemplateContext,
  signatures: string[] = ["Préparé par:", "Vérifié par:", "Approuvé par:"]
): void {
  checkPageBreak(ctx, 40);
  
  ctx.yPos = ctx.pageHeight - 50;
  
  ctx.doc.setDrawColor(150, 150, 150);
  ctx.doc.line(ctx.margin, ctx.yPos, ctx.pageWidth - ctx.margin, ctx.yPos);
  ctx.yPos += 10;
  
  ctx.doc.setFontSize(9);
  ctx.doc.setFont("helvetica", "normal");
  
  const sigBoxWidth = (ctx.contentWidth - 20) / signatures.length;
  
  signatures.forEach((title, index) => {
    const x = ctx.margin + index * (sigBoxWidth + 10);
    ctx.doc.text(title, x + 5, ctx.yPos);
    ctx.doc.line(x, ctx.yPos + 15, x + sigBoxWidth - 5, ctx.yPos + 15);
    ctx.doc.text("Date: _______________", x + 5, ctx.yPos + 22);
  });
}

/**
 * Add electronic signatures section with verified signature data
 */
export function addElectronicSignatures(
  ctx: PDFTemplateContext,
  signatures: PDFSignatureData[],
  documentHash?: string
): void {
  if (signatures.length === 0) return;
  
  checkPageBreak(ctx, 60 + signatures.length * 25);
  
  // Section header
  ctx.doc.setDrawColor(100, 100, 100);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(ctx.margin, ctx.yPos, ctx.pageWidth - ctx.margin, ctx.yPos);
  ctx.yPos += 8;
  
  ctx.doc.setFontSize(11);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setTextColor(60, 60, 60);
  ctx.doc.text("SIGNATURES ÉLECTRONIQUES", ctx.margin, ctx.yPos);
  ctx.yPos += 8;
  
  // Signature entries
  ctx.doc.setFontSize(9);
  ctx.doc.setFont("helvetica", "normal");
  
  signatures.forEach((sig, index) => {
    const isLast = index === signatures.length - 1;
    
    // Status indicator
    if (sig.status === 'signed') {
      ctx.doc.setTextColor(34, 139, 34); // Green
      ctx.doc.text("✓", ctx.margin, ctx.yPos);
    } else if (sig.status === 'rejected') {
      ctx.doc.setTextColor(220, 20, 60); // Red
      ctx.doc.text("✗", ctx.margin, ctx.yPos);
    } else {
      ctx.doc.setTextColor(255, 165, 0); // Orange
      ctx.doc.text("○", ctx.margin, ctx.yPos);
    }
    
    ctx.doc.setTextColor(60, 60, 60);
    
    // Signer info
    const signerText = `${sig.signerName} (${sig.signerRole})`;
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.text(signerText, ctx.margin + 8, ctx.yPos);
    
    // Date
    ctx.doc.setFont("helvetica", "normal");
    if (sig.status === 'signed' && sig.signedAt) {
      const dateStr = `Signé le ${sig.signedAt}`;
      ctx.doc.text(dateStr, ctx.margin + 8, ctx.yPos + 5);
    } else if (sig.status === 'rejected') {
      ctx.doc.text("Signature refusée", ctx.margin + 8, ctx.yPos + 5);
    } else {
      ctx.doc.text("En attente de signature", ctx.margin + 8, ctx.yPos + 5);
    }
    
    // Signature ID on the right
    if (sig.signatureId) {
      ctx.doc.setFontSize(7);
      ctx.doc.setTextColor(128, 128, 128);
      ctx.doc.text(`ID: ${sig.signatureId.slice(0, 8)}...`, ctx.pageWidth - ctx.margin, ctx.yPos, { align: "right" });
      ctx.doc.setFontSize(9);
      ctx.doc.setTextColor(60, 60, 60);
    }
    
    ctx.yPos += isLast ? 12 : 15;
  });
  
  // Document hash (integrity proof)
  if (documentHash) {
    ctx.doc.setFontSize(7);
    ctx.doc.setTextColor(128, 128, 128);
    ctx.doc.text(`Empreinte du document: ${documentHash.slice(0, 32)}...`, ctx.margin, ctx.yPos);
    ctx.yPos += 4;
    ctx.doc.text("Ce document a été signé électroniquement. Toute modification invalide les signatures.", ctx.margin, ctx.yPos);
  }
  
  ctx.yPos += 8;
}

/**
 * Finalize PDF with footer and page numbers
 */
export function finalizePDF(
  ctx: PDFTemplateContext,
  config: PDFDocumentConfig
): void {
  const pageCount = ctx.doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    ctx.doc.setPage(i);
    
    // Apply watermark to each page
    if (config.showWatermark && config.status) {
      applyWatermark(ctx.doc, config.status, ctx.pageWidth, ctx.pageHeight);
    }
    
    // Footer
    ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(128, 128, 128);
    
    // Legal mentions
    if (config.showLegalMentions && config.legalMentions) {
      ctx.doc.text(config.legalMentions, ctx.pageWidth / 2, ctx.pageHeight - 15, { align: "center" });
    }
    
    // Page number (only if multiple pages)
    if (pageCount > 1) {
      ctx.doc.text(
        `Page ${i} / ${pageCount}`,
        ctx.pageWidth / 2,
        ctx.pageHeight - 8,
        { align: "center" }
      );
    }
    
    // Generation timestamp
    ctx.doc.text(
      `Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`,
      ctx.pageWidth - ctx.margin,
      ctx.pageHeight - 8,
      { align: "right" }
    );
  }
}

/**
 * Check for page break and add new page if needed
 */
export function checkPageBreak(ctx: PDFTemplateContext, requiredSpace: number): void {
  if (ctx.yPos + requiredSpace > ctx.pageHeight - 30) {
    ctx.doc.addPage();
    ctx.yPos = ctx.margin + 10;
  }
}

/**
 * Add new page
 */
export function addNewPage(ctx: PDFTemplateContext): void {
  ctx.doc.addPage();
  ctx.yPos = ctx.margin + 10;
}

/**
 * Save the PDF document
 */
export function savePDF(ctx: PDFTemplateContext, filename: string): void {
  ctx.doc.save(`${filename}.pdf`);
}

/**
 * Get PDF as blob for preview or email
 */
export function getPDFBlob(ctx: PDFTemplateContext): Blob {
  return ctx.doc.output('blob');
}

/**
 * Get PDF as base64 for embedding or sending
 */
export function getPDFBase64(ctx: PDFTemplateContext): string {
  return ctx.doc.output('datauristring');
}
