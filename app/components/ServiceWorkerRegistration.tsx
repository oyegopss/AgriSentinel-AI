"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
            console.log("[PWA] Service Worker unregistered in dev mode to clear cache");
          }
        });
      } else {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("[PWA] Service Worker registered — scope:", registration.scope);
            })
            .catch((err) => {
              console.log("[PWA] Service Worker registration failed:", err);
            });
        });
      }
    }
  }, []);

  return null; // This component only registers the SW, renders nothing
}
