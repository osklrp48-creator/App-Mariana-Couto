import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { db, ensureSettings } from "../db/db";
import { cloudRepo } from "../lib/cloudRepo";
import { usePatients, useRevenues, useExpenses } from "../lib/entityHooks";
import type { Expense, Revenue } from "../db/types";
import { formatCurrency, formatDateISOToBR, currentMonthISO, currentYear, todayISO } from "../lib/format";
import { matchesPeriod, type PeriodType } from "../lib/period";
import { RevenueForm } from "./RevenueForm";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

interface PatientProfitAppointment {
  appointmentId: string;
  date: string;
  label: string;
  value: number;
  expenses: number;
  profit: number;
}

interface PatientProfit {
  patientId: string;
  name: string;
  appointments: PatientProfitAppointment[];
  totalValue: number;
  totalExpenses: number;
  profit: number;
}

function buildPatientProfits(
  periodRevenues: Revenue[],
  periodExpenses: Expense[],
  patientById: Map<string, { name: string }>
): PatientProfit[] {
  const expensesByAppointment = new Map<string, number>();
  for (const e of periodExpenses) {
    expensesByAppointment.set(e.appointmentId, (expensesByAppointment.get(e.appointmentId) ?? 0) + e.value);
  }

  // Um atendimento pode ter mais de uma receita (o procedimento principal +
  // extras), então agrupamos por consulta antes de somar — senão as
  // despesas daquele atendimento seriam descontadas mais de uma vez.
  const revenuesByAppointment = new Map<string, Revenue[]>();
  for (const r of periodRevenues) {
    if (!r.patientId || !r.appointmentId) continue;
    const list = revenuesByAppointment.get(r.appointmentId) ?? [];
    list.push(r);
    revenuesByAppointment.set(r.appointmentId, list);
  }

  const byPatient = new Map<string, PatientProfit>();
  for (const [appointmentId, revs] of revenuesByAppointment) {
    const patientId = revs[0].patientId;
    if (!patientId) continue;
    const patient = patientById.get(patientId);
    if (!patient) continue;

    let entry = byPatient.get(patientId);
    if (!entry) {
      entry = { patientId, name: patient.name, appointments: [], totalValue: 0, totalExpenses: 0, profit: 0 };
      byPatient.set(patientId, entry);
    }

    const value = revs.reduce((s, r) => s + r.value, 0);
    const expensesTotal = expensesByAppointment.get(appointmentId) ?? 0;
    const profit = value - expensesTotal;
    const main = revs.find((r) => r.treatmentId) ?? revs[0];
    const extrasCount = revs.length - 1;

    entry.appointments.push({
      appointmentId,
      date: main.date,
      label:
        (main.description || "Atendimento") +
        (extrasCount > 0 ? ` (+${extrasCount} extra${extrasCount === 1 ? "" : "s"})` : ""),
      value,
      expenses: expensesTotal,
      profit,
    });
    entry.totalValue += value;
    entry.totalExpenses += expensesTotal;
    entry.profit += profit;
  }

  for (const entry of byPatient.values()) {
    entry.appointments.sort((a, b) => b.date.localeCompare(a.date));
  }

  return [...byPatient.values()].sort((a, b) => a.name.localeCompare(b.name));
}

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
  const { show } = useToast();
  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [periodValue, setPeriodValue] = useState(currentMonthISO());
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [deletingRevenue, setDeletingRevenue] = useState<Revenue | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<Expense | undefined>();
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());

  const { data: revenues, loading: lr } = useRevenues();
  const { data: expenses, loading: le } = useExpenses();
  const { data: patients, loading: lp } = usePatients();

  if (lr || le || lp) return null;

  const confirmDeleteRevenue = async () => {
    if (!deletingRevenue) return;
    await cloudRepo.revenues.remove(deletingRevenue.id);
    show("Receita removida");
    setDeletingRevenue(undefined);
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    await cloudRepo.expenses.remove(deletingExpense.id);
    show("Despesa removida");
    setDeletingExpense(undefined);
  };

  const patientById = new Map(patients.map((p) => [p.id, p]));

  const periodRevenues = revenues.filter((r) => matchesPeriod(r.date, periodType, periodValue));
  const periodExpenses = expenses.filter((e) => matchesPeriod(e.date, periodType, periodValue));

  const recebido = periodRevenues.filter((r) => r.status === "Pago").reduce((s, r) => s + r.value, 0);
  const totalDespesas = periodExpenses.reduce((s, e) => s + e.value, 0);
  const pendente = periodRevenues.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.value, 0);
  const lucro = recebido - totalDespesas;

  const patientProfits = buildPatientProfits(periodRevenues, periodExpenses, patientById);

  const togglePatient = (patientId: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  };

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
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ textAlign: "right" }}>
                      <p className="mono" style={{ fontWeight: 700 }}>{formatCurrency(r.value)}</p>
                      <span className={`pill ${r.status === "Pago" ? "pill-green" : "pill-amber"}`}>{r.status}</span>
                    </div>
                    <button
                      className="icon-btn"
                      style={{ color: "var(--red)" }}
                      onClick={() => setDeletingRevenue(r)}
                      aria-label="Excluir receita"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
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
                  <div className="row" style={{ gap: 8 }}>
                    <p className="mono" style={{ fontWeight: 700 }}>{formatCurrency(e.value)}</p>
                    <button
                      className="icon-btn"
                      style={{ color: "var(--red)" }}
                      onClick={() => setDeletingExpense(e)}
                      aria-label="Excluir despesa"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div>
        <p className="section-title">Lucro por paciente</p>
        {patientProfits.length === 0 ? (
          <div className="empty">
            <p>Nenhum atendimento concluído no período.</p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10, marginTop: 8 }}>
            {patientProfits.map((p) => {
              const expanded = expandedPatients.has(p.patientId);
              return (
                <div key={p.patientId} className="card">
                  <div
                    className={`collapsible-header ${expanded ? "open" : ""}`}
                    style={{ padding: 0 }}
                    onClick={() => togglePatient(p.patientId)}
                  >
                    <div>
                      <p style={{ fontWeight: 600 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                        {p.appointments.length} atendimento{p.appointments.length === 1 ? "" : "s"} · Recebido{" "}
                        {formatCurrency(p.totalValue)} − Despesas {formatCurrency(p.totalExpenses)}
                      </p>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="mono" style={{ fontWeight: 700, color: p.profit >= 0 ? "var(--green)" : "var(--red)" }}>
                        {formatCurrency(p.profit)}
                      </span>
                      <ChevronDownIcon width={18} height={18} />
                    </div>
                  </div>

                  {expanded && (
                    <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                      {p.appointments.map((a) => (
                        <div
                          key={a.appointmentId}
                          className="row-between"
                          style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}
                        >
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</p>
                            <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                              {formatDateISOToBR(a.date)} · Recebido {formatCurrency(a.value)} − Despesas{" "}
                              {formatCurrency(a.expenses)}
                            </p>
                          </div>
                          <p className="mono" style={{ fontWeight: 700, fontSize: 13.5 }}>{formatCurrency(a.profit)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRevenueForm && <RevenueForm onClose={() => setShowRevenueForm(false)} />}

      {deletingRevenue && (
        <ConfirmDialog
          title="Excluir receita"
          message="Deseja remover esta receita permanentemente?"
          confirmLabel="Excluir"
          danger
          onConfirm={confirmDeleteRevenue}
          onCancel={() => setDeletingRevenue(undefined)}
        />
      )}
      {deletingExpense && (
        <ConfirmDialog
          title="Excluir despesa"
          message="Deseja remover esta despesa permanentemente?"
          confirmLabel="Excluir"
          danger
          onConfirm={confirmDeleteExpense}
          onCancel={() => setDeletingExpense(undefined)}
        />
      )}
    </div>
  );
}
