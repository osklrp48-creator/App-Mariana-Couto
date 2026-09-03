import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ExpenseForm } from "./ExpenseForm";
import { cloudRepo } from "../../lib/cloudRepo";
import { useExpenses } from "../../lib/entityHooks";
import type { Appointment, Expense } from "../../db/types";
import { formatCurrency } from "../../lib/format";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/icons";
import { useToast } from "../../contexts/ToastContext";

interface ExpenseListSheetProps {
  appointment: Appointment;
  onClose: () => void;
}

export function ExpenseListSheet({ appointment, onClose }: ExpenseListSheetProps) {
  const { show } = useToast();
  const { data: allExpenses, loading } = useExpenses();
  const [editing, setEditing] = useState<Expense | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Expense | undefined>();

  if (loading) return null;

  const expenses = allExpenses
    .filter((e) => e.appointmentId === appointment.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const handleDelete = async () => {
    if (!deleting) return;
    await cloudRepo.expenses.remove(deleting.id);
    show("Despesa removida");
    setDeleting(undefined);
  };

  return (
    <>
      <Sheet title="Despesas do atendimento" onClose={onClose}>
        <div className="stack">
          {expenses.length === 0 ? (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>Nenhuma despesa lançada ainda.</p>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {expenses.map((e) => (
                <div key={e.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{e.description || e.category}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                      {e.category}
                      {e.auto ? " · automática" : ""}
                    </p>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <span className="mono" style={{ fontWeight: 700, marginRight: 4 }}>
                      {formatCurrency(e.value)}
                    </span>
                    <button className="icon-btn" onClick={() => setEditing(e)} aria-label="Editar despesa">
                      <EditIcon width={17} height={17} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ color: "var(--red)" }}
                      onClick={() => setDeleting(e)}
                      aria-label="Excluir despesa"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-outline btn-block" onClick={() => setCreating(true)}>
            <PlusIcon width={16} height={16} /> Adicionar despesa
          </button>
        </div>
      </Sheet>

      {creating && <ExpenseForm appointment={appointment} onClose={() => setCreating(false)} />}
      {editing && <ExpenseForm appointment={appointment} expense={editing} onClose={() => setEditing(undefined)} />}
      {deleting && (
        <ConfirmDialog
          title="Excluir despesa"
          message="Deseja remover esta despesa permanentemente?"
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </>
  );
}
