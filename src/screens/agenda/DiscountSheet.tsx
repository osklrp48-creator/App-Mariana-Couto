import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { cloudRepo } from "../../lib/cloudRepo";
import type { Revenue } from "../../db/types";
import { formatCurrency } from "../../lib/format";
import { useToast } from "../../contexts/ToastContext";

interface DiscountSheetProps {
  revenue: Revenue;
  /** Preço cheio do tratamento, usado como referência para o desconto. */
  fullValue: number;
  onClose: () => void;
}

export function DiscountSheet({ revenue, fullValue, onClose }: DiscountSheetProps) {
  const { show } = useToast();
  const currentDiscount = Math.max(0, fullValue - revenue.value);
  const [discount, setDiscount] = useState(currentDiscount > 0 ? String(currentDiscount) : "");
  const [saving, setSaving] = useState(false);

  const discountNumber = Math.max(0, parseFloat(discount.replace(",", ".")) || 0);
  const newValue = Math.max(0, fullValue - discountNumber);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cloudRepo.revenues.update(revenue.id, { value: newValue });
      show(discountNumber > 0 ? "Desconto aplicado" : "Desconto removido");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Aplicar desconto" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Valor do tratamento</label>
          <input value={formatCurrency(fullValue)} disabled />
        </div>

        <div className="field">
          <label>Desconto (R$)</label>
          <input
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            autoFocus
          />
          <p className="hint">Deixe em branco ou 0 para cobrar o valor cheio.</p>
        </div>

        <div className="kpi-card green">
          <p className="label">Valor final</p>
          <p className="value">{formatCurrency(newValue)}</p>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </Sheet>
  );
}
