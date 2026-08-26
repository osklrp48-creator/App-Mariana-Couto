import Dexie, { type Table } from "dexie";
import type { Appointment, Expense, Patient, Revenue, Settings, Treatment } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export class AppDB extends Dexie {
  patients!: Table<Patient, string>;
  treatments!: Table<Treatment, string>;
  appointments!: Table<Appointment, string>;
  expenses!: Table<Expense, string>;
  revenues!: Table<Revenue, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("mc_podologia");
    this.version(1).stores({
      patients: "id, name, phone",
      treatments: "id, name",
      appointments: "id, patientId, treatmentId, date, status, revenueId",
      expenses: "id, appointmentId, date, category",
      revenues: "id, patientId, appointmentId, date, status",
      settings: "id",
    });
  }
}

export const db = new AppDB();

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function seedTreatmentsIfEmpty(): Promise<void> {
  const count = await db.treatments.count();
  if (count > 0) return;
  const now = new Date().toISOString();
  await db.treatments.bulkPut([
    {
      id: uid(),
      name: "Podologia Completa",
      defaultValue: 120,
      description: "Avaliação, corte, lixamento e hidratação.",
      createdAt: now,
    },
    {
      id: uid(),
      name: "Unha Encravada",
      defaultValue: 90,
      description: "Tratamento e curativo de unha encravada.",
      createdAt: now,
    },
    {
      id: uid(),
      name: "Reflexologia Podal",
      defaultValue: 80,
      description: "",
      createdAt: now,
    },
  ]);
}
