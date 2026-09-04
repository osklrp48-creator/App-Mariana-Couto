import { uid } from "../db/db";
import { cloudRepo } from "./cloudRepo";
import type { Appointment, Settings } from "../db/types";

export async function getDeslocamentoExpense(appointmentId: string) {
  return cloudRepo.expenses.findByAppointment(appointmentId, "Deslocamento");
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

export const CANNOT_COMPLETE_REASON =
  "Lance a despesa de deslocamento deste atendimento antes de concluir (botão “+ Despesa” na consulta).";

/**
 * Cria a receita do atendimento com o valor informado manualmente na hora da
 * conclusão (não existe mais valor fixo do tratamento) e marca a consulta
 * como concluída. Assume que canCompleteAppointment já foi checado antes.
 */
export async function finalizeAppointment(appointment: Appointment, value: number): Promise<void> {
  const now = new Date().toISOString();
  const treatment = await cloudRepo.treatments.get(appointment.treatmentId);
  const id = uid();

  await cloudRepo.revenues.add({
    id,
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    treatmentId: appointment.treatmentId,
    value,
    date: appointment.date,
    paymentMethod: null,
    status: "Pendente",
    description: treatment?.name ?? "Atendimento",
    createdAt: now,
  });

  await cloudRepo.appointments.update(appointment.id, {
    status: "Concluído",
    revenueId: id,
    updatedAt: now,
  });
}

export async function resetNotificationFlags(appointmentId: string) {
  await cloudRepo.appointments.update(appointmentId, {
    notified60: false,
    notified30: false,
  });
}
