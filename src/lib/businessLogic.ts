import { uid } from "../db/db";
import { cloudRepo } from "./cloudRepo";
import type { Appointment, Settings } from "../db/types";

export async function getDeslocamentoExpense(appointmentId: string) {
  return cloudRepo.expenses.findByAppointment(appointmentId, "Deslocamento");
}

export async function upsertDeslocamentoExpense(params: {
  appointmentId: string;
  date: string;
  value: number;
  description: string;
}) {
  const existing = await getDeslocamentoExpense(params.appointmentId);
  if (existing) {
    await cloudRepo.expenses.update(existing.id, {
      value: params.value,
      description: params.description,
      date: params.date,
    });
    return existing.id;
  }
  const id = uid();
  await cloudRepo.expenses.add({
    id,
    appointmentId: params.appointmentId,
    date: params.date,
    value: params.value,
    category: "Deslocamento",
    description: params.description,
    auto: false,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function maybeCreateAutoExpense(appointment: Appointment, settings: Settings) {
  if (!settings.autoExpenseEnabled) return;
  const id = uid();
  await cloudRepo.expenses.add({
    id,
    appointmentId: appointment.id,
    date: appointment.date,
    value: settings.autoExpenseValue,
    category: settings.autoExpenseCategory || "Outros",
    description: settings.autoExpenseDescription || settings.autoExpenseCategory,
    auto: true,
    createdAt: new Date().toISOString(),
  });
}

export async function canCompleteAppointment(appointmentId: string): Promise<boolean> {
  const expense = await getDeslocamentoExpense(appointmentId);
  return !!expense;
}

export async function completeAppointment(appointment: Appointment): Promise<{ ok: boolean; reason?: string }> {
  const hasExpense = await canCompleteAppointment(appointment.id);
  if (!hasExpense) {
    return {
      ok: false,
      reason:
        "Lance a despesa de deslocamento deste atendimento antes de concluir (botão “+ Despesa” na consulta).",
    };
  }

  const now = new Date().toISOString();
  let revenueId = appointment.revenueId;

  if (!revenueId) {
    const treatment = await cloudRepo.treatments.get(appointment.treatmentId);
    const id = uid();
    await cloudRepo.revenues.add({
      id,
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      treatmentId: appointment.treatmentId,
      value: treatment?.defaultValue ?? 0,
      date: appointment.date,
      paymentMethod: null,
      status: "Pendente",
      description: treatment?.name ?? "Atendimento",
      createdAt: now,
    });
    revenueId = id;
  }

  await cloudRepo.appointments.update(appointment.id, {
    status: "Concluído",
    revenueId,
    updatedAt: now,
  });

  return { ok: true };
}

export async function resetNotificationFlags(appointmentId: string) {
  await cloudRepo.appointments.update(appointmentId, {
    notified60: false,
    notified30: false,
  });
}
