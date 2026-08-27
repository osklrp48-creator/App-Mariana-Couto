import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { db, ensureSettings } from "../db/db";
import { usePatients, useRevenues, useExpenses } from "../lib/entityHooks";
import { formatCurrency, formatDateISOToBR, currentMonthISO, currentYear, todayISO } from "../lib/format";
import { matchesPeriod, type PeriodType } from "../lib/period";
import { RevenueForm } from "./RevenueForm";
import { PlusIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

function AutoExpenseSettings() {
  const { show } = useToast();
  const settings = useLiveQuery(() => db.settings.get("app"), []);
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState("15");
  const [category, setCategory] = useState("Materiais");
  const [description, setDescription] = useState("");

  if (!settings) return null;

  const startEdit = () => {
    setEnabled(settings.autoExpenseEnabled);
    setValue(String(settings.autoExpenseValue));
    setCategory(settings.autoExpenseCategory);
    setDescription(settings.autoExpenseDescription);
    setEditing(true);
  };

  const save = async () => {
    await ensureSettings();
    await db.settings.update("app", {
      autoExpenseEnabled: enabled,
      autoExpenseValue: parseFloat(value.replace(",", ".")) || 0,
      autoExpenseCategory: category.trim() || "Outros",
      autoExpenseDescription: description.trim(),
    });
    show("Configuração salva");
    setEditing(false);
  };

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <p style={{ fontWeight: 600 }}>Despesa automática por atendimento</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}>
            {settings.autoExpenseEnabled
              ? `Ativa · ${formatCurrency(settings.autoExpenseValue)} em "${settings.autoExpenseCategory}" a cada nova consulta`
              : "Desativada"}
          </p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={startEdit}>
          Ajustar
        </button>
      </div>

      {editing && (
        <div className="stack" style={{ marginTop: 14 }}>
          <label className="row" style={{ gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Lançar automaticamente ao criar uma consulta
          </label>
          <div className="grid-2">
            <div className="field">
              <label>Valor (R$)</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <label>Categoria</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn btn-outline btn-block" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-block" onClick={save}>
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Financeiro() {
  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [periodValue, setPeriodValue] = useState(currentMonthISO());
  const [showRevenueForm, setShowRevenueForm] = useState(false);

  const { data: revenues, loading: lr } = useRevenues();
  const { data: expenses, loading: le } = useExpenses();
  const { data: patients, loading: lp } = usePatients();

  if (lr || le || lp) return null;

  const patientById = new Map(patients.map((p) => [p.id, p]));

  const periodRevenues = revenues.filter((r) => matchesPeriod(r.date, periodType, periodValue));
  const periodExpenses = expenses.filter((e) => matchesPeriod(e.date, periodType, periodValue));

  const recebido = periodRevenues.filter((r) => r.status === "Pago").reduce((s, r) => s + r.value, 0);
  const totalDespesas = periodExpenses.reduce((s, e) => s + e.value, 0);
  const pendente = periodRevenues.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.value, 0);
  const lucro = recebido - totalDespesas;

  const changePeriodType = (type: PeriodType) => {
    setPeriodType(type);
    if (type === "dia") setPeriodValue(todayISO());
    if (type === "mes") setPeriodValue(currentMonthISO());
    if (type === "ano") setPeriodValue(String(currentYear()));
  };

  return (
    <div className="stack">
      <PageHeader
        title="Financeiro"
        action={
          <button className="icon-btn" onClick={() => setShowRevenueForm(true)} aria-label="Nova receita">
            <PlusIcon />
          </button>
        }
      />

      <div className="tabs">
        <button className={periodType === "dia" ? "active" : ""} onClick={() => changePeriodType("dia")}>
          Dia
        </button>
        <button className={periodType === "mes" ? "active" : ""} onClick={() => changePeriodType("mes")}>
          Mês
        </button>
        <button className={periodType === "ano" ? "active" : ""} onClick={() => changePeriodType("ano")}>
          Ano
        </button>
      </div>

      <div className="field">
        {periodType === "dia" && (
          <input type="date" value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} />
        )}
        {periodType === "mes" && (
          <input type="month" value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} />
        )}
        {periodType === "ano" && (
          <input
            type="number"
            value={periodValue}
            onChange={(e) => setPeriodValue(e.target.value)}
            placeholder="AAAA"
          />
        )}
      </div>

      <div className="grid-2">
        <div className="kpi-card green">
          <p className="label">Recebido</p>
          <p className="value">{formatCurrency(recebido)}</p>
        </div>
        <div className="kpi-card wine">
          <p className="label">Despesas</p>
          <p className="value">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className="kpi-card">
          <p className="label">Lucro</p>
          <p className="value">{formatCurrency(lucro)}</p>
        </div>
        <div className="kpi-card amber">
          <p className="label">Pendente</p>
          <p className="value">{formatCurrency(pendente)}</p>
        </div>
      </div>

      <AutoExpenseSettings />

      <div>
        <p className="section-title">Receitas no período</p>
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          {periodRevenues.length === 0 ? (
            <div className="empty">
              <p>Nenhuma receita no período.</p>
            </div>
          ) : (
            periodRevenues
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => (
                <div key={r.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{r.patientId ? patientById.get(r.patientId)?.name : r.description}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                      {formatDateISOToBR(r.date)} {r.paymentMethod ? `· ${r.paymentMethod}` : ""}
                    </p>
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
        <p className="section-title">Despesas no período</p>
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          {periodExpenses.length === 0 ? (
            <div className="empty">
              <p>Nenhuma despesa no período.</p>
            </div>
          ) : (
            periodExpenses
              .sort((a, b) => b.date.localeCompare(a.date))
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

      {showRevenueForm && <RevenueForm onClose={() => setShowRevenueForm(false)} />}
    </div>
  );
}
