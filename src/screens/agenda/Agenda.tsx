import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import type { Appointment } from "../../db/types";
import { addDaysISO, longDateLabel, todayISO, weekdayLabel } from "../../lib/format";
import { usePatients, useTreatments, useAppointments, useRevenues, useExpenses } from "../../lib/entityHooks";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentForm } from "./AppointmentForm";
import { ExpenseForm } from "./ExpenseForm";
import { CalendarIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "../../components/icons";

export function Agenda() {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | undefined>();
  const [expenseFor, setExpenseFor] = useState<Appointment | undefined>();
  const [pastOpen, setPastOpen] = useState(true);

  const { data: appointments, loading: la } = useAppointments();
  const { data: patients, loading: lp } = usePatients();
  const { data: treatments, loading: lt } = useTreatments();
  const { data: revenues, loading: lr } = useRevenues();
  const { data: allExpenses, loading: le } = useExpenses();

  if (la || lp || lt || lr || le) return null;

  const expenses = allExpenses.filter((e) => e.category === "Deslocamento");
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const treatmentById = new Map(treatments.map((t) => [t.id, t]));
  const revenueByAppointment = new Map(revenues.filter((r) => r.appointmentId).map((r) => [r.appointmentId as string, r]));
  const expenseAppointmentIds = new Set(expenses.map((e) => e.appointmentId));

  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  const renderCard = (a: Appointment, showDate: boolean) => (
    <AppointmentCard
      key={a.id}
      appointment={a}
      patient={patientById.get(a.patientId)}
      treatment={treatmentById.get(a.treatmentId)}
      revenue={revenueByAppointment.get(a.id)}
      hasExpense={expenseAppointmentIds.has(a.id)}
      showDate={showDate}
      onEdit={() => setEditing(a)}
      onExpense={() => setExpenseFor(a)}
    />
  );

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    const results = appointments
      .filter((a) => {
        const name = patientById.get(a.patientId)?.name?.toLowerCase() ?? "";
        const treatmentName = treatmentById.get(a.treatmentId)?.name?.toLowerCase() ?? "";
        return name.includes(q) || treatmentName.includes(q);
      })
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    return (
      <div className="stack">
        <PageHeader title="Agenda" />
        <SearchBar query={query} setQuery={setQuery} />
        <div className="stack" style={{ gap: 10 }}>
          {results.length === 0 ? (
            <div className="empty">
              <SearchIcon />
              <p>Nenhuma consulta encontrada.</p>
            </div>
          ) : (
            results.map((a) => renderCard(a, true))
          )}
        </div>
        <FormsAndFab
          showForm={showForm}
          setShowForm={setShowForm}
          editing={editing}
          setEditing={setEditing}
          expenseFor={expenseFor}
          setExpenseFor={setExpenseFor}
        />
      </div>
    );
  }

  const past = appointments.filter((a) => a.date < today).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const upcoming = appointments.filter((a) => a.date >= today);

  const byDate = new Map<string, Appointment[]>();
  for (const a of upcoming) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }
  const orderedDates = [...byDate.keys()].sort();

  const dayLabel = (date: string) => {
    if (date === today) return "Hoje";
    if (date === tomorrow) return "Amanhã";
    return `${weekdayLabel(date)}, ${longDateLabel(date)}`;
  };

  return (
    <div className="stack">
      <PageHeader title="Agenda" />
      <SearchBar query={query} setQuery={setQuery} />

      {orderedDates.length === 0 && past.length === 0 && (
        <div className="empty">
          <CalendarIcon />
          <p>Nenhuma consulta agendada ainda.</p>
        </div>
      )}

      {orderedDates.map((date) => {
        const list = [...byDate.get(date)!].sort((a, b) => a.time.localeCompare(b.time));
        const highlighted = date === today || date === tomorrow;
        return (
          <div key={date}>
            <div className="day-group-header">
              <span className="day-title">{dayLabel(date)}</span>
              {highlighted && <span className="day-badge">{list.length} consulta{list.length === 1 ? "" : "s"}</span>}
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {list.map((a) => renderCard(a, false))}
            </div>
          </div>
        );
      })}

      {past.length > 0 && (
        <div>
          <div className={`collapsible-header ${pastOpen ? "open" : ""}`} onClick={() => setPastOpen((v) => !v)}>
            <span className="section-title" style={{ margin: 0 }}>
              Consultas anteriores ({past.length})
            </span>
            <ChevronDownIcon />
          </div>
          {pastOpen && (
            <div className="stack" style={{ gap: 10, marginTop: 8 }}>
              {past.map((a) => renderCard(a, true))}
            </div>
          )}
        </div>
      )}

      <FormsAndFab
        showForm={showForm}
        setShowForm={setShowForm}
        editing={editing}
        setEditing={setEditing}
        expenseFor={expenseFor}
        setExpenseFor={setExpenseFor}
      />
    </div>
  );
}

function SearchBar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="search-box">
      <SearchIcon />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por paciente ou tratamento..." />
    </div>
  );
}

function FormsAndFab({
  showForm,
  setShowForm,
  editing,
  setEditing,
  expenseFor,
  setExpenseFor,
}: {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editing?: Appointment;
  setEditing: (v: Appointment | undefined) => void;
  expenseFor?: Appointment;
  setExpenseFor: (v: Appointment | undefined) => void;
}) {
  return (
    <>
      <button className="fab" onClick={() => setShowForm(true)} aria-label="Nova consulta">
        <PlusIcon />
      </button>
      {showForm && <AppointmentForm onClose={() => setShowForm(false)} />}
      {editing && <AppointmentForm appointment={editing} onClose={() => setEditing(undefined)} />}
      {expenseFor && <ExpenseForm appointment={expenseFor} onClose={() => setExpenseFor(undefined)} />}
    </>
  );
}
