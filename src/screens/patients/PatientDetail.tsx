import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PatientForm } from "./PatientForm";
import { db } from "../../db/db";
import { formatCurrency, formatDateISOToBR } from "../../lib/format";
import { EditIcon, FileTextIcon, PhoneIcon, TrashIcon } from "../../components/icons";
import { useToast } from "../../contexts/ToastContext";

const STATUS_PILL: Record<string, string> = {
  Agendado: "pill-blue",
  Concluído: "pill-green",
  Cancelado: "pill-red",
};

export function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [tab, setTab] = useState<"prontuario" | "consultas" | "financeiro">("prontuario");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patient = useLiveQuery(() => (id ? db.patients.get(id) : undefined), [id]);
  const appointments = useLiveQuery(
    () => (id ? db.appointments.where("patientId").equals(id).toArray() : []),
    [id]
  );
  const treatments = useLiveQuery(() => db.treatments.toArray(), []);
  const revenues = useLiveQuery(
    () => (id ? db.revenues.where("patientId").equals(id).toArray() : []),
    [id]
  );
  const expenses = useLiveQuery(async () => {
    if (!appointments) return [];
    const ids = appointments.map((a) => a.id);
    if (ids.length === 0) return [];
    return db.expenses.where("appointmentId").anyOf(ids).toArray();
  }, [appointments]);

  if (!patient || !appointments || !treatments || !revenues || !expenses) return null;

  const treatmentById = new Map(treatments.map((t) => [t.id, t]));
  const sortedAppts = [...appointments].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const completed = sortedAppts.filter((a) => a.status === "Concluído");

  const totalPago = revenues.filter((r) => r.status === "Pago").reduce((s, r) => s + r.value, 0);
  const totalPendente = revenues.filter((r) => r.status === "Pendente").reduce((s, r) => s + r.value, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.value, 0);

  const handleDelete = async () => {
    if (!id) return;
    await db.patients.delete(id);
    show("Paciente removido");
    navigate("/pacientes");
  };

  return (
    <div className="stack">
      <PageHeader
        title={patient.name}
        back
        action={
          <div className="row">
            <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Editar">
              <EditIcon />
            </button>
            <button className="icon-btn" onClick={() => setDeleting(true)} aria-label="Excluir" style={{ color: "var(--red)" }}>
              <TrashIcon />
            </button>
          </div>
        }
      />

      <div className="card">
        <p className="row" style={{ color: "var(--wine)", fontWeight: 600, fontSize: 14 }}>
          <PhoneIcon width={15} height={15} /> {patient.phone}
        </p>
        {patient.address && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>{patient.address}</p>}
        {patient.notes && (
          <p style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 8, fontStyle: "italic" }}>{patient.notes}</p>
        )}
      </div>

      <div className="tabs">
        <button className={tab === "prontuario" ? "active" : ""} onClick={() => setTab("prontuario")}>
          Prontuário
        </button>
        <button className={tab === "consultas" ? "active" : ""} onClick={() => setTab("consultas")}>
          Consultas
        </button>
        <button className={tab === "financeiro" ? "active" : ""} onClick={() => setTab("financeiro")}>
          Financeiro
        </button>
      </div>

      {tab === "prontuario" && (
        <div className="stack" style={{ gap: 10 }}>
          {completed.length === 0 ? (
            <div className="empty">
              <FileTextIcon />
              <p>Nenhum atendimento concluído ainda.</p>
            </div>
          ) : (
            completed.map((a) => (
              <div key={a.id} className="card">
                <p className="row-between">
                  <span style={{ fontWeight: 600 }}>{treatmentById.get(a.treatmentId)?.name}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
                    {formatDateISOToBR(a.date)}
                  </span>
                </p>
                {a.notes && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>{a.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "consultas" && (
        <div className="stack" style={{ gap: 10 }}>
          {sortedAppts.length === 0 ? (
            <div className="empty">
              <FileTextIcon />
              <p>Nenhuma consulta registrada.</p>
            </div>
          ) : (
            sortedAppts.map((a) => (
              <div key={a.id} className="card row-between">
                <div>
                  <p style={{ fontWeight: 600 }}>{treatmentById.get(a.treatmentId)?.name}</p>
                  <p className="mono" style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
                    {formatDateISOToBR(a.date)} às {a.time}
                  </p>
                </div>
                <span className={`pill ${STATUS_PILL[a.status]}`}>{a.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "financeiro" && (
        <div className="stack">
          <div className="grid-2">
            <div className="kpi-card green">
              <p className="label">Recebido</p>
              <p className="value">{formatCurrency(totalPago)}</p>
            </div>
            <div className="kpi-card amber">
              <p className="label">Pendente</p>
              <p className="value">{formatCurrency(totalPendente)}</p>
            </div>
          </div>
          <div className="kpi-card wine">
            <p className="label">Despesas com este paciente</p>
            <p className="value">{formatCurrency(totalDespesas)}</p>
          </div>

          <p className="section-title">Receitas</p>
          <div className="card" style={{ padding: 0 }}>
            {revenues.length === 0 ? (
              <div className="empty">
                <p>Nenhuma receita.</p>
              </div>
            ) : (
              revenues
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => (
                  <div key={r.id} className="list-item" style={{ padding: "12px 16px" }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{r.description}</p>
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

          <p className="section-title">Despesas</p>
          <div className="card" style={{ padding: 0 }}>
            {expenses.length === 0 ? (
              <div className="empty">
                <p>Nenhuma despesa.</p>
              </div>
            ) : (
              expenses
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
      )}

      {editing && <PatientForm patient={patient} onClose={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Excluir paciente"
          message="Isso remove o cadastro do paciente. Consultas e financeiro já registrados serão mantidos, mas sem vínculo com o nome. Deseja continuar?"
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}
