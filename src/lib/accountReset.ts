import { db } from "../db/db";
import { supabase } from "./supabaseClient";

const CLOUD_TABLES = ["patients", "treatments", "appointments", "expenses", "revenues"] as const;

/**
 * Used by "Esqueci meu PIN": the PIN is only a local convenience lock now —
 * the real data lives in the cloud under the signed-in account. So forgetting
 * it no longer needs to destroy anything: sign out locally (clearing the
 * local PIN/settings and the notification mirror) and drop back to the
 * sign-in screen. Signing back in with the same e-mail/senha brings all the
 * data right back.
 */
export async function signOutAndResetLocalLock(): Promise<void> {
  await supabase.auth.signOut();
  await db.delete();
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
}

/**
 * Used by Settings > "Apagar todos os dados": a real, permanent deletion of
 * every record in the cloud account, plus everything stored locally.
 */
export async function wipeAllCloudAndLocalData(): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      for (const table of CLOUD_TABLES) {
        await supabase.from(table).delete().eq("user_id", userId);
      }
    }
  } catch (err) {
    console.error("Falha ao apagar dados na nuvem", err);
  }
  await supabase.auth.signOut();
  await db.delete();
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
}
