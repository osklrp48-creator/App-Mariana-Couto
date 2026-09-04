import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import type { Appointment, Treatment } from "../../db/types";
import { finalizeAppointment } from "../../lib/businessLogic";
import { useToast } from "../../contexts/ToastContext";

interface CompleteAppointmentSheetProps {
  appointment: Appointment;
  treatment?: Treatment;
  onClose: () => void;
}

export function CompleteAppointmentSheet({ appointment, treatment, onClose }: CompleteAppointmentSheetProps) {
  const { show } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(value.replace(",", "."));
    if (Number.isNaN(numeric) || numeric < 0) return;
    setSaving(true);
    try {
      await finalizeAppointment(appointment, numeric);
      show("Atendimento concluído");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Concluir atendimento" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Procedimento</label>
          <input value={treatment?.procedure || treatment?.name || ""} disabled />
        </div>

        <div className="field">
          <label>Valor do procedimento (R$) *</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            required
            autoFocus
          />
          <p className="hint">Informe o valor real cobrado neste atendimento.</p>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Confirmar conclusão"}
        </button>
      </form>
    </Sheet>
  );
}
