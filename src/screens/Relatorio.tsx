import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { usePatients, useRevenues, useExpenses } from "../lib/entityHooks";
import { formatCurrency, formatDateISOToBR, currentMonthISO, monthLabel } from "../lib/format";
import { buildMonthlyReportPdf, shareOrDownloadPdf } from "../lib/pdf";
import { ShareIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

export function Relatorio() {
  const { show } = useToast();
  const [monthISO, setMonthISO] = useState(currentMonthISO());
  const [exporting, setExporting] = useState(false);

  const { data: revenues, loading: lr } = useRevenues();
  const { data: expenses, loading: le } = useExpenses();
  const { data: patients, loading: lp } = usePatients();

  if (lr || le || lp) return null;

  const patientById = new Map(patients.map((p) => [p.id, p]));
  const monthRevenues = revenues.filter((r) => r.date.startsWith(monthISO));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(monthISO));

  const recebido = monthRevenues.filter((r) => r.status === "Pago").reduce((s, r) => s + r.value, 0);
  const totalDespesas = monthExpenses.reduce((s, e) => s + e.value, 0);
  const lucro = recebido - totalDespesas;

  const byCategory = new Map<string, number>();
  for (const e of monthExpenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.value);

  const byMethod = new Map<string, number>();
  for (const r of monthRevenues.filter((r) => r.status === "Pago")) {
    const key = r.paymentMethod ?? "Não informado";
    byMethod.set(key, (byMethod.get(key) ?? 0) + r.value);
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = buildMonthlyReportPdf({
        monthISO,
        revenues: monthRevenues,
        expenses: monthExpenses,
        patients,
      });
      await shareOrDownloadPdf(blob, `relatorio-${monthISO}.pdf`);
    } catch {
      show("Não foi possível gerar o PDF.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader title="Relatório mensal" back />

      <div className="field">
        <label>Mês</label>
        <input type="month" value={monthISO} onChange={(e) => setMonthISO(e.target.value)} />
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>{monthLabel(monthISO)}</p>

      <div className="grid-2">
        <div className="kpi-card green">
          <p className="label">Recebido</p>
          <p className="value">{formatCurrency(recebido)}</p>
        </div>
        <div className="kpi-card wine">
          <p className="label">Despesas</p>
          <p className="value">{formatCurrency(totalDespesas)}</p>
        </div>
      </div>
      <div className="kpi-card">
        <p className="label">Lucro</p>
        <p className="value">{formatCurrency(lucro)}</p>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleExport} disabled={exporting}>
        <ShareIcon width={16} height={16} /> {exporting ? "Gerando PDF..." : "Compartilhar PDF"}
      </button>

      <div>
        <p className="section-title">Despesas por categoria</p>
        <div className="card" style={{ marginTop: 8 }}>
          {byCategory.size === 0 ? (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>Nenhuma despesa no mês.</p>
          ) : (
            [...byCategory.entries()].map(([cat, total]) => (
              <div key={cat} className="list-item">
                <span>{cat}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{formatCurrency(total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="section-title">Receitas por forma de pagamento</p>
        <div className="card" style={{ marginTop: 8 }}>
          {byMethod.size === 0 ? (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>Nenhuma receita paga no mês.</p>
          ) : (
            [...byMethod.entries()].map(([method, total]) => (
              <div key={method} className="list-item">
                <span>{method}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{formatCurrency(total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="section-title">Receitas do mês</p>
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          {monthRevenues.length === 0 ? (
            <div className="empty">
              <p>Nenhuma receita no mês.</p>
            </div>
          ) : (
            monthRevenues
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((r) => (
                <div key={r.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{r.patientId ? patientById.get(r.patientId)?.name : r.description}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>{formatDateISOToBR(r.date)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="mono" style={{ fontWeight: 700 }}>{formatCurrency(r.value)}</p>
                    <span className={`pill ${r.status === "Pago" ? "pill-green" : "pill-amber"}`}>{r.status}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div>
        <p className="section-title">Despesas do mês</p>
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          {monthExpenses.length === 0 ? (
            <div className="empty">
              <p>Nenhuma despesa no mês.</p>
            </div>
          ) : (
            monthExpenses
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <div key={e.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{e.description || e.category}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                      {e.category} · {formatDateISOToBR(e.date)}
                    </p>
                  </div>
                  <p className="mono" style={{ fontWeight: 700 }}>{formatCurrency(e.value)}</p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
