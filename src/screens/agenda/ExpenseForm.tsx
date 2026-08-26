import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Sheet } from "../../components/Sheet";
import { db } from "../../db/db";
import type { Appointment } from "../../db/types";
import { DESLOCAMENTO_OPTIONS } from "../../db/types";
import { formatDateISOToBR } from "../../lib/format";
import { upsertDeslocamentoExpense } from "../../lib/businessLogic";
import { useToast } from "../../contexts/ToastContext";

interface ExpenseFormProps {
  appointment?: Appointment;
  onClose: () => void;
}

export function ExpenseForm({ appointment: fixedAppointment, onClose }: ExpenseFormProps) {
  const { show } = useToast();
  const appointments = useLiveQuery(
    () =>
      fixedAppointment
        ? Promise.resolve<Appointment[]>([])
        : db.appointments.orderBy("date").reverse().toArray(),
    [fixedAppointment]
  );
  const patients = useLiveQuery(() => db.patients.toArray(), []);
  const treatments = useLiveQuery(() => db.treatments.toArray(), []);

  const [appointmentId, setAppointmentId] = useState(fixedAppointment?.id ?? "");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState<string>(DESLOCAMENTO_OPTIONS[0]);
  const [customDescription, setCustomDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const activeAppointment = fixedAppointment ?? appointments?.find((a) => a.id === appointmentId);

  const existing = useLiveQuery(async () => {
    if (!appointmentId) return null;
    const found = await db.expenses
      .where("appointmentId")
      .equals(appointmentId)
      .filter((e) => e.category === "Deslocamento")
      .first();
    return found ?? null;
  }, [appointmentId]);

  useEffect(() => {
    if (!existing) return;
    setValue(String(existing.value));
    if (DESLOCAMENTO_OPTIONS.includes(existing.description)) {
      setDescription(existing.description);
    } else {
      setDescription("Outro");
      setCustomDescription(existing.description);
    }
  }, [existing]);

  if (!patients || !treatments || (!fixedAppointment && !appointments)) return null;

  const patientById = new Map(patients.map((p) => [p.id, p]));
  const treatmentById = new Map(treatments.map((t) => [t.id, t]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;
    const numeric = parseFloat(value.replace(",", "."));
    if (Number.isNaN(numeric)) return;
    const finalDescription = description === "Outro" ? customDescription.trim() || "Outro" : description;
    setSaving(true);
    try {
      await upsertDeslocamentoExpense({
        appointmentId: activeAppointment.id,
        date: activeAppointment.date,
        value: numeric,
        description: finalDescription,
      });
      show(existing ? "Despesa atualizada" : "Despesa lançada");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={existing ? "Editar despesa de deslocamento" : "Nova despesa de deslocamento"} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {!fixedAppointment && (
          <div className="field">
            <label>Atendimento *</label>
            <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required>
              <option value="">Selecione...</option>
              {appointments?.map((a) => (
                <option key={a.id} value={a.id}>
                  {patientById.get(a.patientId)?.name ?? "Paciente"} · {treatmentById.get(a.treatmentId)?.name} ·{" "}
                  {formatDateISOToBR(a.date)} {a.time}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeAppointment && (
          <div className="field">
            <label>Data do atendimento</label>
            <input value={formatDateISOToBR(activeAppointment.date)} disabled />
          </div>
        )}

        <div className="field">
          <label>Descrição</label>
          <select value={description} onChange={(e) => setDescription(e.target.value)}>
            {DESLOCAMENTO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
            <option value="Outro">Outro</option>
          </select>
        </div>

        {description === "Outro" && (
          <div className="field">
            <label>Especifique</label>
            <input value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label>Valor (R$) *</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            required
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving || !activeAppointment}>
          {saving ? "Salvando..." : existing ? "Atualizar despesa" : "Salvar despesa"}
        </button>
      </form>
    </Sheet>
  );
}
