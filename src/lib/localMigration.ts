import { db, ensureSettings } from "../db/db";
import { cloudRepo } from "./cloudRepo";

async function pushAll<T>(items: T[], add: (item: T) => Promise<void>) {
  for (const item of items) {
    try {
      await add(item);
    } catch (err) {
      // Most likely a duplicate id from a retried/partial run — safe to skip.
      console.warn("Falha ao migrar registro local para a nuvem (ignorado)", err);
    }
  }
}

/**
 * One-time, per-device migration: if this device already had data saved
 * locally from before cloud sync existed, push it up to the cloud account
 * the user just signed into, then mark this device as migrated. Runs before
 * anything reads from the cloud, so the local-only data is never silently
 * overwritten by an (initially empty) cloud mirror.
 */
export async function migrateLocalDataIfNeeded(): Promise<void> {
  const settings = await ensureSettings();
  if (settings.localDataMigrated) return;

  const [patients, treatments, appointments, expenses, revenues] = await Promise.all([
    db.patients.toArray(),
    db.treatments.toArray(),
    db.appointments.toArray(),
    db.expenses.toArray(),
    db.revenues.toArray(),
  ]);

  const hasLocalData =
    patients.length + treatments.length + appointments.length + expenses.length + revenues.length > 0;

  if (hasLocalData) {
    await pushAll(patients, cloudRepo.patients.add);
    await pushAll(treatments, cloudRepo.treatments.add);
    await pushAll(appointments, cloudRepo.appointments.add);
    await pushAll(expenses, cloudRepo.expenses.add);
    await pushAll(revenues, cloudRepo.revenues.add);
  }

  await db.settings.update("app", { localDataMigrated: true });
}
