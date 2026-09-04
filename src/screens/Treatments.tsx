import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Sheet } from "../components/Sheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { uid } from "../db/db";
import type { Treatment } from "../db/types";
import { cloudRepo } from "../lib/cloudRepo";
import { useTreatments } from "../lib/entityHooks";
import { EditIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

function TreatmentForm({ treatment, onClose }: { treatment?: Treatment; onClose: () => void }) {
  const { show } = useToast();
  const [name, setName] = useState(treatment?.name ?? "");
  const [procedure, setProcedure] = useState(treatment?.procedure ?? "");
  const [description, setDescription] = useState(treatment?.description ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !procedure.trim()) return;
    setSaving(true);
    try {
      if (treatment) {
        await cloudRepo.treatments.update(treatment.id, {
          name: name.trim(),
          procedure: procedure.trim(),
          description,
        });
        show("Tratamento atualizado");
      } else {
        await cloudRepo.treatments.add({
          id: uid(),
          name: name.trim(),
          procedure: procedure.trim(),
          description,
          createdAt: new Date().toISOString(),
        });
        show("Tratamento cadastrado");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={treatment ? "Editar tratamento" : "Novo tratamento"} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Nome *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Procedimento *</label>
          <input
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="Ex: Corte de unha, remoção de calo..."
            required
          />
          <p className="hint">O valor cobrado é informado depois, ao concluir cada atendimento.</p>
        </div>
        <div className="field">
          <label>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar tratamento"}
        </button>
      </form>
    </Sheet>
  );
}

export function Treatments() {
  const { data: allTreatments, loading } = useTreatments();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Treatment | undefined>();
  const [deleting, setDeleting] = useState<Treatment | undefined>();
  const { show } = useToast();

  if (loading) return null;

  const treatments = [...allTreatments].sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = async () => {
    if (!deleting) return;
    await cloudRepo.treatments.remove(deleting.id);
    show("Tratamento removido");
    setDeleting(undefined);
  };

  return (
    <div className="stack">
      <PageHeader title="Tratamentos" back />

      {treatments.length === 0 ? (
        <div className="empty">
          <p>Nenhum tratamento cadastrado.</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {treatments.map((t) => (
            <div key={t.id} className="card">
              <div className="row-between">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15.5 }}>{t.name}</p>
                  <p style={{ color: "var(--pine)", fontWeight: 600, marginTop: 3, fontSize: 13.5 }}>
                    {t.procedure}
                  </p>
                </div>
                <div className="row">
                  <button className="icon-btn" onClick={() => setEditing(t)}>
                    <EditIcon />
                  </button>
                  <button className="icon-btn" style={{ color: "var(--red)" }} onClick={() => setDeleting(t)}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
              {t.description && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>{t.description}</p>}
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Novo tratamento">
        <PlusIcon />
      </button>

      {showForm && <TreatmentForm onClose={() => setShowForm(false)} />}
      {editing && <TreatmentForm treatment={editing} onClose={() => setEditing(undefined)} />}
      {deleting && (
        <ConfirmDialog
          title="Excluir tratamento"
          message={`Remover "${deleting.name}" do catálogo? Consultas já registradas não são afetadas.`}
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </div>
  );
}
