import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { LockProvider, useLock } from "./contexts/LockContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ensureSettings, seedTreatmentsIfEmpty } from "./db/db";
import { PinLock } from "./screens/pin/PinLock";
import { PinSetup } from "./screens/pin/PinSetup";
import { Dashboard } from "./screens/Dashboard";
import { PatientsList } from "./screens/patients/PatientsList";
import { PatientDetail } from "./screens/patients/PatientDetail";
import { Treatments } from "./screens/Treatments";
import { Agenda } from "./screens/agenda/Agenda";
import { Financeiro } from "./screens/Financeiro";
import { Relatorio } from "./screens/Relatorio";
import { Settings } from "./screens/Settings";
import { More } from "./screens/More";

function Gate() {
  const { onboardingDone, unlocked } = useLock();

  useEffect(() => {
    ensureSettings();
    seedTreatmentsIfEmpty();
  }, []);

  if (!onboardingDone) return <PinSetup />;
  if (!unlocked) return <PinLock />;

  return (
    <HashRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<PatientsList />} />
            <Route path="/pacientes/:id" element={<PatientDetail />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/mais" element={<More />} />
            <Route path="/tratamentos" element={<Treatments />} />
            <Route path="/relatorio" element={<Relatorio />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <LockProvider>
        <Gate />
      </LockProvider>
    </ToastProvider>
  );
}
