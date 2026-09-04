import { db, uid } from "../db/db";
import { supabase } from "./supabaseClient";
import type { Appointment, Expense, Patient, Revenue, Treatment } from "../db/types";

// Each entity has: a Postgres row shape (snake_case, as stored in Supabase),
// a mapper row->entity (camelCase, as used across the app) and entity->row
// (for inserts/updates), and a mirror function that keeps the local Dexie
// table in sync purely so the service worker can keep reading appointments
// and patients locally for notification checks without needing network/auth
// access from inside the SW.

export interface PatientRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
}

export interface TreatmentRow {
  id: string;
  name: string;
  default_value: number;
  description: string;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  treatment_id: string;
  date: string;
  time: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  revenue_id: string | null;
  notified_60: boolean;
  notified_30: boolean;
}

export interface ExpenseRow {
  id: string;
  appointment_id: string;
  date: string;
  value: number;
  category: string;
  description: string;
  auto: boolean;
  created_at: string;
}

export interface RevenueRow {
  id: string;
  patient_id: string | null;
  appointment_id: string | null;
  treatment_id: string | null;
  value: number;
  date: string;
  payment_method: string | null;
  status: string;
  description: string;
  created_at: string;
}

const patientFromRow = (r: PatientRow): Patient => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  address: r.address,
  notes: r.notes,
  createdAt: r.created_at,
});

const treatmentFromRow = (r: TreatmentRow): Treatment => ({
  id: r.id,
  name: r.name,
  defaultValue: Number(r.default_value),
  description: r.description,
  createdAt: r.created_at,
});

const appointmentFromRow = (r: AppointmentRow): Appointment => ({
  id: r.id,
  patientId: r.patient_id,
  treatmentId: r.treatment_id,
  date: r.date,
  time: r.time,
  status: r.status as Appointment["status"],
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  revenueId: r.revenue_id,
  notified60: r.notified_60,
  notified30: r.notified_30,
});

const expenseFromRow = (r: ExpenseRow): Expense => ({
  id: r.id,
  appointmentId: r.appointment_id,
  date: r.date,
  value: Number(r.value),
  category: r.category,
  description: r.description,
  auto: r.auto,
  createdAt: r.created_at,
});

const revenueFromRow = (r: RevenueRow): Revenue => ({
  id: r.id,
  patientId: r.patient_id,
  appointmentId: r.appointment_id,
  treatmentId: r.treatment_id,
  value: Number(r.value),
  date: r.date,
  paymentMethod: r.payment_method as Revenue["paymentMethod"],
  status: r.status as Revenue["status"],
  description: r.description,
  createdAt: r.created_at,
});

async function mirrorPatients(rows: Patient[]) {
  await db.transaction("rw", db.patients, async () => {
    await db.patients.clear();
    await db.patients.bulkPut(rows);
  });
}

async function mirrorTreatments(rows: Treatment[]) {
  await db.transaction("rw", db.treatments, async () => {
    await db.treatments.clear();
    await db.treatments.bulkPut(rows);
  });
}

async function mirrorAppointments(rows: Appointment[]) {
  await db.transaction("rw", db.appointments, async () => {
    await db.appointments.clear();
    await db.appointments.bulkPut(rows);
  });
}

async function mirrorExpenses(rows: Expense[]) {
  await db.transaction("rw", db.expenses, async () => {
    await db.expenses.clear();
    await db.expenses.bulkPut(rows);
  });
}

async function mirrorRevenues(rows: Revenue[]) {
  await db.transaction("rw", db.revenues, async () => {
    await db.revenues.clear();
    await db.revenues.bulkPut(rows);
  });
}

function assertNoError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export const cloudRepo = {
  patients: {
    table: "patients" as const,
    mapRow: patientFromRow,
    mirror: mirrorPatients,
    async add(p: Patient) {
      assertNoError(
        await supabase.from("patients").insert({
          id: p.id,
          name: p.name,
          phone: p.phone,
          address: p.address,
          notes: p.notes,
        })
      );
    },
    async update(id: string, patch: Partial<Patient>) {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.phone !== undefined) row.phone = patch.phone;
      if (patch.address !== undefined) row.address = patch.address;
      if (patch.notes !== undefined) row.notes = patch.notes;
      assertNoError(await supabase.from("patients").update(row).eq("id", id));
    },
    async remove(id: string) {
      assertNoError(await supabase.from("patients").delete().eq("id", id));
    },
  },

  treatments: {
    table: "treatments" as const,
    mapRow: treatmentFromRow,
    mirror: mirrorTreatments,
    async add(t: Treatment) {
      assertNoError(
        await supabase.from("treatments").insert({
          id: t.id,
          name: t.name,
          default_value: t.defaultValue,
          description: t.description,
        })
      );
    },
    async update(id: string, patch: Partial<Treatment>) {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.defaultValue !== undefined) row.default_value = patch.defaultValue;
      if (patch.description !== undefined) row.description = patch.description;
      assertNoError(await supabase.from("treatments").update(row).eq("id", id));
    },
    async remove(id: string) {
      assertNoError(await supabase.from("treatments").delete().eq("id", id));
    },
    async get(id: string): Promise<Treatment | null> {
      const { data, error } = await supabase.from("treatments").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? treatmentFromRow(data as TreatmentRow) : null;
    },
  },

  appointments: {
    table: "appointments" as const,
    mapRow: appointmentFromRow,
    mirror: mirrorAppointments,
    async add(a: Appointment) {
      assertNoError(
        await supabase.from("appointments").insert({
          id: a.id,
          patient_id: a.patientId,
          treatment_id: a.treatmentId,
          date: a.date,
          time: a.time,
          status: a.status,
          notes: a.notes,
          created_at: a.createdAt,
          updated_at: a.updatedAt,
          revenue_id: a.revenueId,
          notified_60: a.notified60,
          notified_30: a.notified30,
        })
      );
    },
    async update(id: string, patch: Partial<Appointment>) {
      const row: Record<string, unknown> = {};
      if (patch.patientId !== undefined) row.patient_id = patch.patientId;
      if (patch.treatmentId !== undefined) row.treatment_id = patch.treatmentId;
      if (patch.date !== undefined) row.date = patch.date;
      if (patch.time !== undefined) row.time = patch.time;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.notes !== undefined) row.notes = patch.notes;
      if (patch.updatedAt !== undefined) row.updated_at = patch.updatedAt;
      if (patch.revenueId !== undefined) row.revenue_id = patch.revenueId;
      if (patch.notified60 !== undefined) row.notified_60 = patch.notified60;
      if (patch.notified30 !== undefined) row.notified_30 = patch.notified30;
      assertNoError(await supabase.from("appointments").update(row).eq("id", id));
    },
    async remove(id: string) {
      assertNoError(await supabase.from("appointments").delete().eq("id", id));
    },
    async get(id: string): Promise<Appointment | null> {
      const { data, error } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? appointmentFromRow(data as AppointmentRow) : null;
    },
  },

  expenses: {
    table: "expenses" as const,
    mapRow: expenseFromRow,
    mirror: mirrorExpenses,
    async add(e: Expense) {
      assertNoError(
        await supabase.from("expenses").insert({
          id: e.id,
          appointment_id: e.appointmentId,
          date: e.date,
          value: e.value,
          category: e.category,
          description: e.description,
          auto: e.auto,
        })
      );
    },
    async update(id: string, patch: Partial<Expense>) {
      const row: Record<string, unknown> = {};
      if (patch.date !== undefined) row.date = patch.date;
      if (patch.value !== undefined) row.value = patch.value;
      if (patch.category !== undefined) row.category = patch.category;
      if (patch.description !== undefined) row.description = patch.description;
      assertNoError(await supabase.from("expenses").update(row).eq("id", id));
    },
    async remove(id: string) {
      assertNoError(await supabase.from("expenses").delete().eq("id", id));
    },
    async removeByAppointment(appointmentId: string) {
      assertNoError(await supabase.from("expenses").delete().eq("appointment_id", appointmentId));
    },
    async findByAppointment(appointmentId: string, category?: string): Promise<Expense | null> {
      let query = supabase.from("expenses").select("*").eq("appointment_id", appointmentId);
      if (category) query = query.eq("category", category);
      const { data, error } = await query.limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? expenseFromRow(data as ExpenseRow) : null;
    },
  },

  revenues: {
    table: "revenues" as const,
    mapRow: revenueFromRow,
    mirror: mirrorRevenues,
    async add(r: Revenue) {
      assertNoError(
        await supabase.from("revenues").insert({
          id: r.id,
          patient_id: r.patientId,
          appointment_id: r.appointmentId,
          treatment_id: r.treatmentId,
          value: r.value,
          date: r.date,
          payment_method: r.paymentMethod,
          status: r.status,
          description: r.description,
        })
      );
    },
    async update(id: string, patch: Partial<Revenue>) {
      const row: Record<string, unknown> = {};
      if (patch.value !== undefined) row.value = patch.value;
      if (patch.date !== undefined) row.date = patch.date;
      if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.description !== undefined) row.description = patch.description;
      assertNoError(await supabase.from("revenues").update(row).eq("id", id));
    },
    async remove(id: string) {
      assertNoError(await supabase.from("revenues").delete().eq("id", id));
    },
    async removeByAppointment(appointmentId: string) {
      assertNoError(await supabase.from("revenues").delete().eq("appointment_id", appointmentId));
    },
  },
};

export async function seedDefaultTreatments(): Promise<void> {
  const now = new Date().toISOString();
  const defaults: Treatment[] = [
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
  ];
  for (const t of defaults) {
    await cloudRepo.treatments.add(t);
  }
}
