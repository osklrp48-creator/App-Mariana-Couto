import type { AppointmentRow, ExpenseRow, PatientRow, RevenueRow, TreatmentRow } from "./cloudRepo";
import { cloudRepo } from "./cloudRepo";
import { useCloudCollection } from "./useCloudCollection";
import type { Appointment, Expense, Patient, Revenue, Treatment } from "../db/types";

export const usePatients = () =>
  useCloudCollection<PatientRow, Patient>({
    table: cloudRepo.patients.table,
    mapRow: cloudRepo.patients.mapRow,
    mirror: cloudRepo.patients.mirror,
  });

export const useTreatments = () =>
  useCloudCollection<TreatmentRow, Treatment>({
    table: cloudRepo.treatments.table,
    mapRow: cloudRepo.treatments.mapRow,
    mirror: cloudRepo.treatments.mirror,
  });

export const useAppointments = () =>
  useCloudCollection<AppointmentRow, Appointment>({
    table: cloudRepo.appointments.table,
    mapRow: cloudRepo.appointments.mapRow,
    mirror: cloudRepo.appointments.mirror,
  });

export const useExpenses = () =>
  useCloudCollection<ExpenseRow, Expense>({
    table: cloudRepo.expenses.table,
    mapRow: cloudRepo.expenses.mapRow,
    mirror: cloudRepo.expenses.mirror,
  });

export const useRevenues = () =>
  useCloudCollection<RevenueRow, Revenue>({
    table: cloudRepo.revenues.table,
    mapRow: cloudRepo.revenues.mapRow,
    mirror: cloudRepo.revenues.mirror,
  });
