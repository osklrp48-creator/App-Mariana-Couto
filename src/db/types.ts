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
  defaultValue: number;
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
};

export const HOURLY_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const DESLOCAMENTO_OPTIONS = ["Uber", "99 Pop"];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Dinheiro",
  "Pix",
  "Cartão de débito",
  "Cartão de crédito",
];
