import { db } from "../db/db";
import { combineDateTime } from "./format";

const SIXTY_MIN = 60 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;
// Window of tolerance so a check that runs a bit late (or a bit early) still fires.
const WINDOW_MS = 6 * 60 * 1000;

interface NotifyTarget {
  registration: ServiceWorkerRegistration;
}

export async function checkAppointmentsAndNotify({ registration }: NotifyTarget): Promise<number> {
  const now = Date.now();
  const appointments = await db.appointments.where("status").equals("Agendado").toArray();
  let shown = 0;

  for (const appt of appointments) {
    const when = combineDateTime(appt.date, appt.time).getTime();
    const diff = when - now;
    if (diff < -THIRTY_MIN) continue; // long past, skip

    let updated = false;

    if (!appt.notified60 && diff <= SIXTY_MIN && diff >= SIXTY_MIN - WINDOW_MS) {
      const patient = await db.patients.get(appt.patientId);
      const name = patient?.name ?? "paciente";
      await registration.showNotification("Consulta em 1 hora", {
        body: `${name} às ${appt.time}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: `appt-${appt.id}-60`,
        data: { appointmentId: appt.id },
      });
      appt.notified60 = true;
      updated = true;
      shown++;
    }

    if (!appt.notified30 && diff <= THIRTY_MIN && diff >= THIRTY_MIN - WINDOW_MS) {
      const patient = await db.patients.get(appt.patientId);
      const name = patient?.name ?? "paciente";
      await registration.showNotification(`Não esqueça de "${name}"!`, {
        body: `Consulta às ${appt.time}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: `appt-${appt.id}-30`,
        data: { appointmentId: appt.id },
      });
      appt.notified30 = true;
      updated = true;
      shown++;
    }

    if (updated) {
      await db.appointments.update(appt.id, {
        notified60: appt.notified60,
        notified30: appt.notified30,
      });
    }
  }

  return shown;
}
