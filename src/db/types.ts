export type AppointmentStatus = "Agendado" | "Concluído" | "Cancelado";

export type PaymentMethod = "Dinheiro" | "Pix" | "Cartão de débito" | "Cartão de crédito";

export type RevenueStatus = "Pendente" | "Pago";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  /** Nome/tipo do procedimento. Texto livre — não carrega mais um valor fixo. */
  procedure: string;
  description: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  treatmentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revenueId: string | null;
  notified60: boolean;
  notified30: boolean;
}

export interface Expense {
  id: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD, mirrors appointment date
  value: number;
  category: "Deslocamento" | string;
  description: string;
  auto: boolean;
  createdAt: string;
}

export interface Revenue {
  id: string;
  patientId: string | null;
  appointmentId: string | null;
  treatmentId: string | null;
  value: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod | null;
  status: RevenueStatus;
  description: string;
  createdAt: string;
}

export interface Settings {
  id: "app";
  onboardingDone: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  autoExpenseEnabled: boolean;
  autoExpenseValue: number;
  autoExpenseCategory: string;
  autoExpenseDescription: string;
  notificationsEnabledAt: string | null;
  localDataMigrated: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  onboardingDone: false,
  pinHash: null,
  pinSalt: null,
  autoExpenseEnabled: false,
  autoExpenseValue: 15,
  autoExpenseCategory: "Materiais",
  autoExpenseDescription: "Materiais de uso único",
  notificationsEnabledAt: null,
  localDataMigrated: false,
};

// Horários de atendimento disponíveis, a cada 30 minutos, do início (06:00)
// ao fim (17:00) do expediente.
export const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

export const DESLOCAMENTO_OPTIONS = ["Uber", "99 Pop"];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Dinheiro",
  "Pix",
  "Cartão de débito",
  "Cartão de crédito",
];
