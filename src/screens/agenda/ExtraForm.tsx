import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { uid } from "../../db/db";
import { cloudRepo } from "../../lib/cloudRepo";
import type { Appointment, PaymentMethod, Revenue, RevenueStatus } from "../../db/types";
import { PAYMENT_METHODS } from "../../db/types";
import { useToast } from "../../contexts/ToastContext";

interface ExtraFormProps {
  appointment: Appointment;
  extra?: Revenue;
  onClose: () => void;
}

export function ExtraForm({ appointment, extra, onClose }: ExtraFormProps) {
  const { show } = useToast();
  const [description, setDescription] = useState(extra?.description ?? "");
  const [value, setValue] = useState(extra ? String(extra.value) : "");
  const [status, setStatus] = useState<RevenueStatus>(extra?.status ?? "Pago");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(extra?.paymentMethod ?? "Dinheiro");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(value.replace(",", "."));
    if (!description.trim() || Number.isNaN(numeric) || numeric < 0) return;
    setSaving(true);
    try {
      if (extra) {
        await cloudRepo.revenues.update(extra.id, {
          description: description.trim(),
          value: numeric,
          status,
          paymentMethod: status === "Pago" ? paymentMethod : null,
        });
        show("Extra atualizado");
      } else {
        await cloudRepo.revenues.add({
          id: uid(),
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          treatmentId: null,
          value: numeric,
          date: appointment.date,
          paymentMethod: status === "Pago" ? paymentMethod : null,
          status,
          description: description.trim(),
          createdAt: new Date().toISOString(),
        });
        show("Extra lançado");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={extra ? "Editar extra" : "Novo extra"} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Descrição *</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Venda de material, procedimento extra..."
            required
            autoFocus
          />
        </div>

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
          {saving ? "Salvando..." : extra ? "Atualizar extra" : "Salvar extra"}
        </button>
      </form>
    </Sheet>
  );
}
