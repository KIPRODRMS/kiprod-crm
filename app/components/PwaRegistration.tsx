"use client";

import { useEffect } from "react";

const OFFICIAL_HOSTS = new Set([
  "kiprod-crm.vercel.app",
  "localhost",
  "127.0.0.1",
]);

export default function PwaRegistration() {
  useEffect(() => {
    if (
      !OFFICIAL_HOSTS.has(
        window.location.hostname
      )
    ) {
      return;
    }

    const installWindow =
      window as typeof window & {
        __kiprodInstallPrompt?: Event;
      };

    function handleBeforeInstallPrompt(
      event: Event
    ) {
      event.preventDefault();

      installWindow.__kiprodInstallPrompt =
        event;

      window.dispatchEvent(
        new Event(
          "kiprod-install-ready"
        )
      );
    }

    function handleInstalled() {
      delete installWindow.__kiprodInstallPrompt;
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    if (
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .catch((error) => {
          console.error(
            "KIPROD CRM service worker registration failed:",
            error
          );
        });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  return null;
}