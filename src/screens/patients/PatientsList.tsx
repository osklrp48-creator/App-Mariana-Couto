import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { PatientForm } from "./PatientForm";
import { usePatients, useAppointments, useTreatments } from "../../lib/entityHooks";
import { formatDateISOToBR } from "../../lib/format";
import { normalizeSearch } from "../../lib/search";
import { PhoneIcon, PlusIcon, SearchIcon, UsersIcon } from "../../components/icons";
import { phoneDigits } from "../../lib/phone";

export function PatientsList() {
  const { data: allPatients, loading: lp } = usePatients();
  const { data: allAppointments, loading: la } = useAppointments();
  const { data: treatments, loading: lt } = useTreatments();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (lp || la || lt) return null;

  const treatmentById = new Map(treatments.map((t) => [t.id, t]));

  const lastVisitByPatient = new Map<string, { date: string; treatmentName?: string }>();
  for (const a of allAppointments) {
    if (a.status !== "Concluído") continue;
    const current = lastVisitByPatient.get(a.patientId);
    if (!current || a.date > current.date) {
      lastVisitByPatient.set(a.patientId, { date: a.date, treatmentName: treatmentById.get(a.treatmentId)?.name });
    }
  }

  const patients = [...allPatients].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = patients.filter((p) => {
    const q = normalizeSearch(query);
    if (!q) return true;
    return normalizeSearch(p.name).includes(q) || phoneDigits(p.phone).includes(phoneDigits(query));
  });

  return (
    <div className="stack">
      <PageHeader title="Pacientes" />

      <div className="search-box">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <UsersIcon />
          <p>{patients.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado."}</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {filtered.map((p) => {
            const lastVisit = lastVisitByPatient.get(p.id);
            return (
              <Link key={p.id} to={`/pacientes/${p.id}`} className="card" style={{ display: "block" }}>
                <div className="row-between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15.5 }}>{p.name}</p>
                    <p className="row" style={{ fontSize: 13, color: "var(--wine)", marginTop: 4, fontWeight: 500 }}>
                      <PhoneIcon width={14} height={14} /> {p.phone}
                    </p>
                    {p.address && (
                      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}>{p.address}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", fontWeight: 700 }}>
                      Último atendimento
                    </p>
                    {lastVisit ? (
                      <>
                        <p className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--pine-dark)" }}>
                          {formatDateISOToBR(lastVisit.date)}
                        </p>
                        {lastVisit.treatmentName && (
                          <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{lastVisit.treatmentName}</p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Nenhum ainda</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Novo paciente">
        <PlusIcon />
      </button>

      {showForm && <PatientForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
