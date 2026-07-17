import Link from "next/link";
import type { Metadata } from "next";
import InstallAppButton from "../components/InstallAppButton";

export const metadata: Metadata = {
  title: "Install KIPROD CRM",
  description:
    "Install the KIPROD Institutional Growth Hub on your phone or computer.",
};

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.15),_transparent_32%),linear-gradient(135deg,_#071426,_#0f172a)] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
          <div className="bg-slate-950 px-6 py-8 sm:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-400">
              KIPROD
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Install KIPROD CRM
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Add the Institutional Growth Hub to your phone or computer for faster access without searching for the link every time.
            </p>
          </div>

          <div className="space-y-7 px-6 py-8 text-slate-950 sm:px-10">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                Official Address
              </p>

              <p className="mt-2 break-all text-sm font-black text-slate-950">
                https://kiprod-crm.vercel.app
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Install only from this address. Vercel preview links are treated as different apps.
              </p>
            </div>

            <InstallAppButton
              showWhenInstalled
            />

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-black">
                  Android
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open this page in Chrome and tap Install KIPROD CRM. If the prompt is unavailable, use the Chrome menu and choose Install app or Add to Home screen.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-black">
                  iPhone or iPad
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open this page in Safari, tap Share, choose Add to Home Screen, then tap Add.
                </p>
              </article>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Installing the app does not create a CRM account. Each Team Member still signs in using the account approved by a Super Admin.
            </p>

            <Link
              href="/login"
              className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
            >
              Continue to CRM Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}