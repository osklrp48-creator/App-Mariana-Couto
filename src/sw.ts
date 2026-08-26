/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { checkAppointmentsAndNotify } from "./lib/notificationCheck";

declare let self: ServiceWorkerGlobalScope;

// Injected at build time by vite-plugin-pwa (injectManifest strategy).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const PERIODIC_SYNC_TAG = "mc-appointment-check";
const ONE_OFF_SYNC_TAG = "mc-appointment-check-oneoff";

async function runCheck() {
  try {
    await checkAppointmentsAndNotify({ registration: self.registration });
  } catch (err) {
    console.error("[sw] appointment check failed", err);
  }
}

// Best-effort background wake-up. Chrome/Android may grant this to installed,
// frequently-used PWAs; the browser decides real timing, there is no guarantee.
self.addEventListener("periodicsync", (event: any) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(runCheck());
  }
});

// One-off background sync as a secondary best-effort path on browsers that
// support it but not periodicSync.
self.addEventListener("sync", (event: any) => {
  if (event.tag === ONE_OFF_SYNC_TAG) {
    event.waitUntil(runCheck());
  }
});

// The open app pings the SW on an interval so notifications keep firing via
// the SW's own showNotification (reliable while the browser process is alive,
// even if the tab isn't focused).
self.addEventListener("message", (event) => {
  if (event.data?.type === "MC_CHECK_APPOINTMENTS") {
    event.waitUntil(runCheck());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsList[0];
      if (existing) {
        existing.focus();
      } else {
        self.clients.openWindow("/#/agenda");
      }
    })()
  );
});
