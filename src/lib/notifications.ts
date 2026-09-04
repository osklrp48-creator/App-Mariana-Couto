import { cloudRepo } from "./cloudRepo";
import { checkAppointmentsAndNotify } from "./notificationCheck";

let foregroundTimer: ReturnType<typeof setInterval> | null = null;

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  // As soon as a new service worker takes control (after skipWaiting +
  // clientsClaim finish activating an update), reload once so the fresh
  // app shell/JS loads automatically — the user never has to manually
  // close and reopen the app to see a new version.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    const url = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";
    navigator.serviceWorker
      .register(url, { type: import.meta.env.DEV ? "module" : "classic" })
      .then((registration) => {
        // The browser only checks for a new sw.js on its own schedule
        // (roughly once a day, or on navigation). Check proactively too,
        // so an update deployed while the app is open/installed is picked
        // up quickly instead of waiting for that schedule.
        const checkForUpdate = () => registration.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
        setInterval(checkForUpdate, 5 * 60 * 1000);
      })
      .catch((err) => {
        console.error("Falha ao registrar service worker", err);
      });
  });
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  const result = await Notification.requestPermission();
  if (result === "granted") {
    await setupBackgroundChecks();
  }
  return result;
}

export async function setupBackgroundChecks(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;

  // Best-effort periodic background sync (Chrome/Android, installed PWAs only).
  const anyReg = registration as any;
  if ("periodicSync" in registration) {
    try {
      const status = await navigator.permissions.query({
        name: "periodic-background-sync" as PermissionName,
      });
      if (status.state === "granted") {
        await anyReg.periodicSync.register("mc-appointment-check", {
          minInterval: 15 * 60 * 1000,
        });
      }
    } catch {
      // Not supported or not granted — foreground loop + one-off sync remain.
    }
  }

  startForegroundLoop();
}

/**
 * While the app is open (foreground or backgrounded tab, browser process
 * alive), poll every minute and ask the SW to check + show notifications.
 * This is the most reliable path; background OS-level delivery when the app
 * is fully closed depends on periodicSync (Android, best-effort) and is not
 * available at all on iOS Safari PWAs.
 */
export function startForegroundLoop(): void {
  if (foregroundTimer) return;
  const tick = async () => {
    if (Notification.permission !== "granted") return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await checkAppointmentsAndNotify({
        registration,
        pushToCloud: (id, patch) => cloudRepo.appointments.update(id, patch),
      });
    } catch (err) {
      console.error("Falha ao checar lembretes", err);
    }
  };
  tick();
  foregroundTimer = setInterval(tick, 60 * 1000);
}

export function stopForegroundLoop(): void {
  if (foregroundTimer) {
    clearInterval(foregroundTimer);
    foregroundTimer = null;
  }
}
