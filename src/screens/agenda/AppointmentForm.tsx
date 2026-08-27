import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { ensureSettings, uid } from "../../db/db";
import type { Appointment, AppointmentStatus } from "../../db/types";
import { HOURLY_SLOTS } from "../../db/types";
import { cloudRepo } from "../../lib/cloudRepo";
import { usePatients, useTreatments } from "../../lib/entityHooks";
import { todayISO } from "../../lib/format";
import { maybeCreateAutoExpense, resetNotificationFlags } from "../../lib/businessLogic";
import { useToast } from "../../contexts/ToastContext";

interface AppointmentFormProps {
  appointment?: Appointment;
  defaultDate?: string;
  onClose: () => void;
}

export function AppointmentForm({ appointment, defaultDate, onClose }: AppointmentFormProps) {
  const { show } = useToast();
  const { data: patientsRaw, loading: lp } = usePatients();
  const { data: treatmentsRaw, loading: lt } = useTreatments();

  const [patientId, setPatientId] = useState(appointment?.patientId ?? "");
  const [date, setDate] = useState(appointment?.date ?? defaultDate ?? todayISO());
  const [time, setTime] = useState(appointment?.time ?? HOURLY_SLOTS[2]);
  const [treatmentId, setTreatmentId] = useState(appointment?.treatmentId ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? "Agendado");
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [saving, setSaving] = useState(false);

  if (lp || lt) return null;

  const patients = [...patientsRaw].sort((a, b) => a.name.localeCompare(b.name));
  const treatments = [...treatmentsRaw].sort((a, b) => a.name.localeCompare(b.name));

  const timeOptions =
    appointment && !HOURLY_SLOTS.includes(appointment.time)
      ? [appointment.time, ...HOURLY_SLOTS]
      : HOURLY_SLOTS;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !treatmentId || !date || !time) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (appointment) {
        const timeChanged = appointment.date !== date || appointment.time !== time;
        await cloudRepo.appointments.update(appointment.id, {
          patientId,
          treatmentId,
          date,
          time,
          status,
          notes,
          updatedAt: now,
        });
        if (timeChanged) await resetNotificationFlags(appointment.id);
        show("Consulta atualizada");
      } else {
        const record: Appointment = {
          id: uid(),
          patientId,
          treatmentId,
          date,
          time,
          status,
          notes,
          createdAt: now,
          updatedAt: now,
          revenueId: null,
          notified60: false,
          notified30: false,
        };
        await cloudRepo.appointments.add(record);
        const settings = await ensureSettings();
        await maybeCreateAutoExpense(record, settings);
        show("Consulta agendada");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={appointment ? "Editar consulta" : "Nova consulta"} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Paciente *</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Selecione...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {patients.length === 0 && <p className="hint">Cadastre um paciente primeiro.</p>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Data *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Hora *</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} required>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Tratamento *</label>
          <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} required>
            <option value="">Selecione...</option>
            {treatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {treatments.length === 0 && <p className="hint">Cadastre um tratamento primeiro.</p>}
        </div>

        {appointment?.status === "Concluído" ? (
          <div className="field">
            <label>Status</label>
            <input value="Concluído" disabled />
            <p className="hint">Para alterar o pagamento, use as ações na lista da agenda.</p>
          </div>
        ) : (
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
              <option value="Agendado">Agendado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        )}

        <div className="field">
          <label>Observações</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : appointment ? "Salvar alterações" : "Confirmar agendamento"}
        </button>
      </form>
    </Sheet>
  );
}
