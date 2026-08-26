import { Sheet } from "../../components/Sheet";
import { db } from "../../db/db";
import type { PaymentMethod, Revenue } from "../../db/types";
import { PAYMENT_METHODS } from "../../db/types";
import { formatCurrency } from "../../lib/format";
import { useToast } from "../../contexts/ToastContext";

interface PaymentSheetProps {
  revenue: Revenue;
  onClose: () => void;
}

export function PaymentSheet({ revenue, onClose }: PaymentSheetProps) {
  const { show } = useToast();

  const choose = async (method: PaymentMethod) => {
    await db.revenues.update(revenue.id, { status: "Pago", paymentMethod: method });
    show("Pagamento confirmado");
    onClose();
  };

  return (
    <Sheet title="Confirmar pagamento" onClose={onClose}>
      <div className="stack">
        <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
          Como o pagamento de <strong>{formatCurrency(revenue.value)}</strong> foi recebido?
        </p>
        <div className="stack" style={{ gap: 8 }}>
          {PAYMENT_METHODS.map((m) => (
            <button key={m} className="btn btn-outline btn-block" onClick={() => choose(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
