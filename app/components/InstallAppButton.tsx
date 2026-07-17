"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type InstallAppButtonProps = {
  variant?: "primary" | "menu";
  showWhenInstalled?: boolean;
};

const OFFICIAL_ORIGIN =
  "https://kiprod-crm.vercel.app";

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator =
    navigator as Navigator & {
      standalone?: boolean;
    };

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    iosNavigator.standalone === true
  );
}

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iphone|ipad|ipod/i.test(
      navigator.userAgent
    ) ||
    (navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1)
  );
}

function isOfficialHost() {
  if (typeof window === "undefined") {
    return true;
  }

  return [
    "kiprod-crm.vercel.app",
    "localhost",
    "127.0.0.1",
  ].includes(window.location.hostname);
}

function getStoredPrompt() {
  if (typeof window === "undefined") {
    return null;
  }

  const installWindow =
    window as typeof window & {
      __kiprodInstallPrompt?: Event;
    };

  return (
    (installWindow.__kiprodInstallPrompt as
      | BeforeInstallPromptEvent
      | undefined) || null
  );
}

export default function InstallAppButton({
  variant = "primary",
  showWhenInstalled = false,
}: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  const [installed, setInstalled] =
    useState(false);

  const [ios, setIos] =
    useState(false);

  const [showHelp, setShowHelp] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIosDevice());
    setInstallPrompt(getStoredPrompt());

    function handleInstallReady() {
      setInstallPrompt(
        getStoredPrompt()
      );
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    }

    window.addEventListener(
      "kiprod-install-ready",
      handleInstallReady
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    return () => {
      window.removeEventListener(
        "kiprod-install-ready",
        handleInstallReady
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  async function handleInstall() {
    if (installed) {
      return;
    }

    if (!isOfficialHost()) {
      window.location.assign(
        `${OFFICIAL_ORIGIN}/install`
      );
      return;
    }

    if (installPrompt) {
      setBusy(true);

      try {
        await installPrompt.prompt();
        const choice =
          await installPrompt.userChoice;

        if (
          choice.outcome === "accepted"
        ) {
          setInstalled(true);
        }

        const installWindow =
          window as typeof window & {
            __kiprodInstallPrompt?: Event;
          };

        delete installWindow.__kiprodInstallPrompt;
        setInstallPrompt(null);
      } finally {
        setBusy(false);
      }

      return;
    }

    setShowHelp(true);
  }

  if (
    installed &&
    !showWhenInstalled
  ) {
    return null;
  }

  const buttonClass =
    variant === "menu"
      ? "w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
      : "inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        disabled={busy || installed}
        className={buttonClass}
      >
        {installed
          ? "KIPROD CRM is installed"
          : busy
            ? "Opening install prompt..."
            : ios
              ? "Add KIPROD to Home Screen"
              : "Install KIPROD CRM"}
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Install KIPROD CRM"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                KIPROD CRM
              </p>

              <h2 className="mt-2 text-xl font-black">
                Install on this phone
              </h2>
            </div>

            <div className="space-y-5 p-6">
              {ios ? (
                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <p className="font-black text-slate-950">
                    iPhone or iPad
                  </p>

                  <p>
                    1. Open this page in Safari.
                  </p>

                  <p>
                    2. Tap the Share button.
                  </p>

                  <p>
                    3. Choose Add to Home Screen.
                  </p>

                  <p>
                    4. Tap Add.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <p className="font-black text-slate-950">
                    Android or desktop Chrome
                  </p>

                  <p>
                    Open the browser menu, then choose Install app or Add to Home screen.
                  </p>

                  <p>
                    Use the official KIPROD CRM address so everyone installs the same app.
                  </p>
                </div>
              )}

              <a
                href={`${OFFICIAL_ORIGIN}/install`}
                className="block rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-slate-950"
              >
                Open Official Install Page
              </a>

              <button
                type="button"
                onClick={() =>
                  setShowHelp(false)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}