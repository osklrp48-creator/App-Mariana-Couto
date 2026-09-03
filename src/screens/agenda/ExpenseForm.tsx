import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { uid } from "../../db/db";
import type { Appointment, Expense } from "../../db/types";
import { DESLOCAMENTO_OPTIONS } from "../../db/types";
import { cloudRepo } from "../../lib/cloudRepo";
import { formatDateISOToBR } from "../../lib/format";
import { useToast } from "../../contexts/ToastContext";

interface ExpenseFormProps {
  appointment: Appointment;
  expense?: Expense;
  onClose: () => void;
}

export function ExpenseForm({ appointment, expense, onClose }: ExpenseFormProps) {
  const { show } = useToast();
  const [value, setValue] = useState(expense ? String(expense.value) : "");
  const [description, setDescription] = useState<string>(() => {
    if (!expense) return DESLOCAMENTO_OPTIONS[0];
    return DESLOCAMENTO_OPTIONS.includes(expense.description) ? expense.description : "Outro";
  });
  const [customDescription, setCustomDescription] = useState(
    expense && !DESLOCAMENTO_OPTIONS.includes(expense.description) ? expense.description : ""
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(value.replace(",", "."));
    if (Number.isNaN(numeric)) return;
    const finalDescription = description === "Outro" ? customDescription.trim() || "Outro" : description;
    setSaving(true);
    try {
      if (expense) {
        await cloudRepo.expenses.update(expense.id, { value: numeric, description: finalDescription });
        show("Despesa atualizada");
      } else {
        await cloudRepo.expenses.add({
          id: uid(),
          appointmentId: appointment.id,
          date: appointment.date,
          value: numeric,
          category: "Deslocamento",
          description: finalDescription,
          auto: false,
          createdAt: new Date().toISOString(),
        });
        show("Despesa lançada");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={expense ? "Editar despesa de deslocamento" : "Nova despesa de deslocamento"} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Data do atendimento</label>
          <input value={formatDateISOToBR(appointment.date)} disabled />
        </div>

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

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : expense ? "Atualizar despesa" : "Salvar despesa"}
        </button>
      </form>
    </Sheet>
  );
}
