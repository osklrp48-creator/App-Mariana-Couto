import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import { db, uid } from "../../db/db";
import type { Patient } from "../../db/types";
import { maskPhone } from "../../lib/phone";
import { useToast } from "../../contexts/ToastContext";

interface PatientFormProps {
  patient?: Patient;
  onClose: () => void;
  onSaved?: (patient: Patient) => void;
}

export function PatientForm({ patient, onClose, onSaved }: PatientFormProps) {
  const { show } = useToast();
  const [name, setName] = useState(patient?.name ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [address, setAddress] = useState(patient?.address ?? "");
  const [notes, setNotes] = useState(patient?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      if (patient) {
        await db.patients.update(patient.id, { name: name.trim(), phone, address, notes });
        onSaved?.({ ...patient, name: name.trim(), phone, address, notes });
        show("Paciente atualizado");
      } else {
        const record: Patient = {
          id: uid(),
          name: name.trim(),
          phone,
          address,
          notes,
          createdAt: new Date().toISOString(),
        };
        await db.patients.add(record);
        onSaved?.(record);
        show("Paciente cadastrado");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={patient ? "Editar paciente" : "Novo paciente"} onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nome completo *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Telefone / WhatsApp *</label>
          <input
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            required
          />
        </div>
        <div className="field">
          <label>Endereço</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
        </div>
        <div className="field">
          <label>Observações</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar paciente"}
        </button>
      </form>
    </Sheet>
  );
}
