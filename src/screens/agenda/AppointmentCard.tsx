import { useState } from "react";
import { cloudRepo } from "../../lib/cloudRepo";
import type { Appointment, Patient, Revenue, Treatment } from "../../db/types";
import { formatCurrency, formatDateISOToBR } from "../../lib/format";
import { completeAppointment } from "../../lib/businessLogic";
import { CheckIcon, EditIcon, TrashIcon } from "../../components/icons";
import { useToast } from "../../contexts/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PaymentSheet } from "./PaymentSheet";

const STATUS_PILL: Record<string, string> = {
  Agendado: "pill-blue",
  Concluído: "pill-green",
  Cancelado: "pill-red",
};

interface AppointmentCardProps {
  appointment: Appointment;
  patient?: Patient;
  treatment?: Treatment;
  revenue?: Revenue;
  hasExpense: boolean;
  showDate?: boolean;
  onEdit: () => void;
  onExpense: () => void;
}

export function AppointmentCard({
  appointment,
  patient,
  treatment,
  revenue,
  hasExpense,
  showDate,
  onEdit,
  onExpense,
}: AppointmentCardProps) {
  const { show } = useToast();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const handleComplete = async () => {
    const result = await completeAppointment(appointment);
    if (!result.ok) {
      show(result.reason ?? "Não foi possível concluir.", "error");
      return;
    }
    show("Atendimento concluído");
  };

  const handleCancel = async () => {
    await cloudRepo.appointments.update(appointment.id, { status: "Cancelado", updatedAt: new Date().toISOString() });
    setConfirmingCancel(false);
    show("Consulta cancelada");
  };

  const handleDelete = async () => {
    await cloudRepo.appointments.remove(appointment.id);
    setConfirmingDelete(false);
    show("Consulta removida");
  };

  const togglePayment = async () => {
    if (!revenue) return;
    if (revenue.status === "Pago") {
      await cloudRepo.revenues.update(revenue.id, { status: "Pendente", paymentMethod: null });
      show("Pagamento revertido para pendente");
    } else {
      setShowPaymentSheet(true);
    }
  };

  return (
    <div className="card">
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className="mono" style={{ fontWeight: 700, color: "var(--wine)", fontSize: 13.5 }}>
              {appointment.time}
            </span>
            <span className={`pill ${STATUS_PILL[appointment.status]}`}>{appointment.status}</span>
          </div>
          <p style={{ fontWeight: 600, fontSize: 15.5, marginTop: 5 }}>{patient?.name ?? "Paciente removido"}</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
            {treatment?.name}
            {showDate ? ` · ${formatDateISOToBR(appointment.date)}` : ""}
          </p>
          {appointment.notes && (
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4, fontStyle: "italic" }}>
              {appointment.notes}
            </p>
          )}
        </div>
        <div className="row">
          <button className="icon-btn" onClick={onEdit} aria-label="Editar">
            <EditIcon />
          </button>
          <button className="icon-btn" style={{ color: "var(--red)" }} onClick={() => setConfirmingDelete(true)} aria-label="Excluir">
            <TrashIcon />
          </button>
        </div>
      </div>

      {appointment.status !== "Cancelado" && (
        <div className="row" style={{ flexWrap: "wrap", marginTop: 12, gap: 8 }}>
          <button className="btn btn-sm btn-outline" onClick={onExpense}>
            {hasExpense ? "Editar despesa" : "+ Despesa"}
          </button>

          {appointment.status === "Agendado" && (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleComplete}>
                <CheckIcon width={14} height={14} /> Concluir
              </button>
              <button className="btn btn-sm" style={{ background: "var(--pine-tint)", color: "var(--pine-dark)" }} onClick={() => setConfirmingCancel(true)}>
                Cancelar
              </button>
            </>
          )}

          {appointment.status === "Concluído" && revenue && (
            <button
              className={`btn btn-sm ${revenue.status === "Pago" ? "btn-outline" : "btn-accent"}`}
              onClick={togglePayment}
            >
              {revenue.status === "Pago" ? `✓ Pago (${revenue.paymentMethod})` : `Confirmar pagamento · ${formatCurrency(revenue.value)}`}
            </button>
          )}
        </div>
      )}

      {confirmingCancel && (
        <ConfirmDialog
          title="Cancelar consulta"
          message="Deseja marcar esta consulta como cancelada?"
          confirmLabel="Cancelar consulta"
          danger
          onConfirm={handleCancel}
          onCancel={() => setConfirmingCancel(false)}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Excluir consulta"
          message="Isso remove o registro permanentemente. Despesas e receitas vinculadas continuam existindo, mas soltas."
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {showPaymentSheet && revenue && <PaymentSheet revenue={revenue} onClose={() => setShowPaymentSheet(false)} />}
    </div>
  );
}
