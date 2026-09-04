import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ExtraForm } from "./ExtraForm";
import { cloudRepo } from "../../lib/cloudRepo";
import { useRevenues } from "../../lib/entityHooks";
import type { Appointment, Revenue } from "../../db/types";
import { formatCurrency } from "../../lib/format";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/icons";
import { useToast } from "../../contexts/ToastContext";

interface ExtraListSheetProps {
  appointment: Appointment;
  onClose: () => void;
}

export function ExtraListSheet({ appointment, onClose }: ExtraListSheetProps) {
  const { show } = useToast();
  const { data: allRevenues, loading } = useRevenues();
  const [editing, setEditing] = useState<Revenue | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Revenue | undefined>();

  if (loading) return null;

  const extras = allRevenues
    .filter((r) => r.appointmentId === appointment.id && r.id !== appointment.revenueId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const handleDelete = async () => {
    if (!deleting) return;
    await cloudRepo.revenues.remove(deleting.id);
    show("Extra removido");
    setDeleting(undefined);
  };

  return (
    <>
      <Sheet title="Extras do atendimento" onClose={onClose}>
        <div className="stack">
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
            Vendas ou procedimentos extras feitos durante esta consulta, além do valor principal.
          </p>
          {extras.length === 0 ? (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>Nenhum extra lançado ainda.</p>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {extras.map((e) => (
                <div key={e.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{e.description}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                      {e.status}
                      {e.paymentMethod ? ` · ${e.paymentMethod}` : ""}
                    </p>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <span className="mono" style={{ fontWeight: 700, marginRight: 4 }}>
                      {formatCurrency(e.value)}
                    </span>
                    <button className="icon-btn" onClick={() => setEditing(e)} aria-label="Editar extra">
                      <EditIcon width={17} height={17} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ color: "var(--red)" }}
                      onClick={() => setDeleting(e)}
                      aria-label="Excluir extra"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-outline btn-block" onClick={() => setCreating(true)}>
            <PlusIcon width={16} height={16} /> Adicionar extra
          </button>
        </div>
      </Sheet>

      {creating && <ExtraForm appointment={appointment} onClose={() => setCreating(false)} />}
      {editing && <ExtraForm appointment={appointment} extra={editing} onClose={() => setEditing(undefined)} />}
      {deleting && (
        <ConfirmDialog
          title="Excluir extra"
          message="Deseja remover este lançamento permanentemente?"
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </>
  );
}
