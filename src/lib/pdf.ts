import { jsPDF } from "jspdf";
import type { Expense, Revenue } from "../db/types";
import { formatCurrency, formatDateISOToBR, monthLabel } from "./format";

interface PatientLike {
  id: string;
  name: string;
}

export function buildMonthlyReportPdf(params: {
  monthISO: string;
  revenues: Revenue[];
  expenses: Expense[];
  patients: PatientLike[];
}): Blob {
  const { monthISO, revenues, expenses, patients } = params;
  const patientById = new Map(patients.map((p) => [p.id, p.name]));

  const recebido = revenues.filter((r) => r.status === "Pago").reduce((s, r) => s + r.value, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.value, 0);
  const lucro = recebido - totalDespesas;

  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.value);

  const byMethod = new Map<string, number>();
  for (const r of revenues.filter((r) => r.status === "Pago")) {
    const key = r.paymentMethod ?? "Não informado";
    byMethod.set(key, (byMethod.get(key) ?? 0) + r.value);
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pineDark = "#153A34";
  const wine = "#A63D5C";
  const inkSoft = "#52625C";
  const margin = 40;
  let y = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 56;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(pineDark);
  doc.text("Mariana Couto Podologia", margin, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(wine);
  doc.text(`Relatório mensal · ${monthLabel(monthISO)}`, margin, y);
  y += 30;

  const cards: [string, string][] = [
    ["Recebido", formatCurrency(recebido)],
    ["Despesas", formatCurrency(totalDespesas)],
    ["Lucro", formatCurrency(lucro)],
  ];
  const cardWidth = (pageWidth - margin * 2 - 20) / 3;
  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardWidth + 10);
    doc.setDrawColor(221, 227, 220);
    doc.roundedRect(x, y, cardWidth, 56, 6, 6, "S");
    doc.setFontSize(9);
    doc.setTextColor(inkSoft);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), x + 10, y + 20);
    doc.setFontSize(14);
    doc.setTextColor(pineDark);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 10, y + 40);
  });
  y += 80;

  const section = (title: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(pineDark);
    doc.text(title, margin, y);
    y += 16;
    doc.setDrawColor(221, 227, 220);
    doc.line(margin, y - 10, pageWidth - margin, y - 10);
  };

  const row = (left: string, right: string) => {
    ensureSpace(18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 35, 33);
    doc.text(left, margin, y);
    doc.text(right, pageWidth - margin, y, { align: "right" });
    y += 17;
  };

  section("Despesas por categoria");
  if (byCategory.size === 0) row("Nenhuma despesa no mês", "");
  for (const [cat, total] of byCategory) row(cat, formatCurrency(total));
  y += 10;

  section("Receitas por forma de pagamento");
  if (byMethod.size === 0) row("Nenhuma receita paga no mês", "");
  for (const [method, total] of byMethod) row(method, formatCurrency(total));
  y += 10;

  section("Receitas do mês");
  if (revenues.length === 0) row("Nenhuma receita lançada", "");
  for (const r of [...revenues].sort((a, b) => a.date.localeCompare(b.date))) {
    const name = r.patientId ? patientById.get(r.patientId) ?? "Paciente" : r.description;
    row(`${formatDateISOToBR(r.date)} · ${name} (${r.status})`, formatCurrency(r.value));
  }
  y += 10;

  section("Despesas do mês");
  if (expenses.length === 0) row("Nenhuma despesa lançada", "");
  for (const e of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    row(`${formatDateISOToBR(e.date)} · ${e.description || e.category}`, formatCurrency(e.value));
  }

  return doc.output("blob");
}

export async function shareOrDownloadPdf(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch {
      // user cancelled or share failed — fall back to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
