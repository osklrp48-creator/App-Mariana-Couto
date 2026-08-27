import { useState } from "react";
import { Sheet } from "../components/Sheet";
import { uid } from "../db/db";
import type { PaymentMethod, RevenueStatus } from "../db/types";
import { PAYMENT_METHODS } from "../db/types";
import { cloudRepo } from "../lib/cloudRepo";
import { usePatients } from "../lib/entityHooks";
import { todayISO } from "../lib/format";
import { useToast } from "../contexts/ToastContext";

export function RevenueForm({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  const { data: patientsRaw, loading } = usePatients();

  const [patientId, setPatientId] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<RevenueStatus>("Pago");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Pix");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  const patients = [...patientsRaw].sort((a, b) => a.name.localeCompare(b.name));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(value.replace(",", "."));
    if (Number.isNaN(numeric) || !date) return;
    setSaving(true);
    try {
      await cloudRepo.revenues.add({
        id: uid(),
        patientId: patientId || null,
        appointmentId: null,
        treatmentId: null,
        value: numeric,
        date,
        paymentMethod: status === "Pago" ? paymentMethod : null,
        status,
        description: description.trim() || "Lançamento manual",
        createdAt: new Date().toISOString(),
      });
      show("Receita lançada");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Nova receita" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Paciente</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Sem paciente vinculado</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Podologia avulsa" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Valor (R$) *</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" required />
          </div>
          <div className="field">
            <label>Data *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as RevenueStatus)}>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>
        </div>
        {status === "Pago" && (
          <div className="field">
            <label>Forma de pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar receita"}
        </button>
      </form>
    </Sheet>
  );
}
