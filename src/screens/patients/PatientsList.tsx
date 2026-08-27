import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { PatientForm } from "./PatientForm";
import { usePatients } from "../../lib/entityHooks";
import { PhoneIcon, PlusIcon, SearchIcon, UsersIcon } from "../../components/icons";
import { phoneDigits } from "../../lib/phone";

export function PatientsList() {
  const { data: allPatients, loading } = usePatients();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (loading) return null;

  const patients = [...allPatients].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = patients.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || phoneDigits(p.phone).includes(phoneDigits(query));
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
          {filtered.map((p) => (
            <Link key={p.id} to={`/pacientes/${p.id}`} className="card" style={{ display: "block" }}>
              <p style={{ fontWeight: 600, fontSize: 15.5 }}>{p.name}</p>
              <p className="row" style={{ fontSize: 13, color: "var(--wine)", marginTop: 4, fontWeight: 500 }}>
                <PhoneIcon width={14} height={14} /> {p.phone}
              </p>
              {p.address && (
                <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}>{p.address}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Novo paciente">
        <PlusIcon />
      </button>

      {showForm && <PatientForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
