import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency, greeting, todayISO } from "../lib/format";
import { getPermissionState, requestNotificationPermission } from "../lib/notifications";
import { usePatients, useTreatments, useAppointments, useRevenues } from "../lib/entityHooks";
import { BellIcon, CalendarIcon, PlusIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

export function Dashboard() {
  const { show } = useToast();
  const today = todayISO();
  const monthPrefix = today.slice(0, 7);

  const { data: patients, loading: lp } = usePatients();
  const { data: treatments, loading: lt } = useTreatments();
  const { data: appointments, loading: la } = useAppointments();
  const { data: revenues, loading: lr } = useRevenues();

  const [permission, setPermission] = useState(getPermissionState());
  const [dismissedBanner, setDismissedBanner] = useState(false);

  if (lp || lt || la || lr) return null;

  const patientById = new Map(patients.map((p) => [p.id, p]));
  const treatmentById = new Map(treatments.map((t) => [t.id, t]));

  const todayAppts = appointments
    .filter((a) => a.date === today && a.status === "Agendado")
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = appointments
    .filter((a) => a.date > today && a.status === "Agendado")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 6);

  const receivedThisMonth = revenues
    .filter((r) => r.status === "Pago" && r.date.startsWith(monthPrefix))
    .reduce((sum, r) => sum + r.value, 0);

  const pending = revenues.filter((r) => r.status === "Pendente").reduce((sum, r) => sum + r.value, 0);

  const pendingTodayCount = todayAppts.length;

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") show("Notificações ativadas!");
    else if (result === "denied") show("Permissão negada pelo navegador.", "error");
  };

  const showBanner = permission !== "granted" && permission !== "unsupported" && !dismissedBanner;

  return (
    <div className="stack">
      <div>
        <h1>{greeting()}, Mariana</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 3 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </div>

      {showBanner && (
        <div className="banner">
          <BellIcon />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>Ative os lembretes de consulta</p>
            <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
              Receba um aviso 1 hora e 30 minutos antes de cada atendimento, mesmo com o app
              fechado.
            </p>
            <div className="actions">
              <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} onClick={handleEnable}>
                Ativar notificações
              </button>
              <button
                className="btn btn-sm"
                style={{ background: "transparent", color: "rgba(255,255,255,0.85)" }}
                onClick={() => setDismissedBanner(true)}
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="kpi-card">
          <p className="label">Pacientes</p>
          <p className="value">{patients.length}</p>
        </div>
        <div className="kpi-card wine">
          <p className="label">Hoje</p>
          <p className="value">{pendingTodayCount} consulta{pendingTodayCount === 1 ? "" : "s"}</p>
        </div>
        <div className="kpi-card green">
          <p className="label">Recebido no mês</p>
          <p className="value">{formatCurrency(receivedThisMonth)}</p>
        </div>
        <div className="kpi-card amber">
          <p className="label">A receber</p>
          <p className="value">{formatCurrency(pending)}</p>
        </div>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <Link to="/pacientes" className="btn btn-outline" style={{ flex: 1 }}>
          <PlusIcon width={16} height={16} /> Paciente
        </Link>
        <Link to="/agenda" className="btn btn-primary" style={{ flex: 1 }}>
          <CalendarIcon width={16} height={16} /> Agendar
        </Link>
      </div>

      <div>
        <p className="section-title">Consultas de hoje</p>
        <div className="card" style={{ marginTop: 8, padding: 0 }}>
          {todayAppts.length === 0 ? (
            <div className="empty">
              <CalendarIcon />
              <p>Nenhuma consulta agendada para hoje.</p>
            </div>
          ) : (
            todayAppts.map((a) => {
              const patient = patientById.get(a.patientId);
              const treatment = treatmentById.get(a.treatmentId);
              return (
                <div key={a.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p className="mono" style={{ fontSize: 13, color: "var(--wine)", fontWeight: 700 }}>
                      {a.time}
                    </p>
                    <p style={{ fontWeight: 600 }}>{patient?.name ?? "Paciente removido"}</p>
                    <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{treatment?.name}</p>
                  </div>
                  <Link to="/agenda" className="pill pill-blue">
                    Ver
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="section-title">Próximas consultas</p>
          <div className="card" style={{ marginTop: 8, padding: 0 }}>
            {upcoming.map((a) => {
              const patient = patientById.get(a.patientId);
              const treatment = treatmentById.get(a.treatmentId);
              return (
                <div key={a.id} className="list-item" style={{ padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{patient?.name ?? "Paciente removido"}</p>
                    <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
                      {treatment?.name} · {a.date.split("-").reverse().join("/")} às {a.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
