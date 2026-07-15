import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { importSaccoMasterData } from "./actions";
import { SACCO_MASTER_DATA } from "./data";

type SaccoImportPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function SaccoImportPage({
  searchParams,
}: SaccoImportPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!["super_admin", "management"].includes(profile?.role || "")) {
    redirect("/");
  }

  const tierCounts = SACCO_MASTER_DATA.reduce<Record<string, number>>(
    (totals, institution) => {
      totals[institution.tier] =
        (totals[institution.tier] || 0) + 1;
      return totals;
    },
    {}
  );

  const contactCount = SACCO_MASTER_DATA.reduce(
    (total, institution) => total + institution.contacts.length,
    0
  );

  const { count: existingSaccoCount, error: countError } =
    await supabase
      .from("institutions")
      .select("id", { count: "exact", head: true })
      .eq("segment", "SACCO");

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Controlled Data Import
        </p>
        <h1 className="mt-2 text-3xl font-black">
          SACCO Master Database
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Import the confirmed deposit-taking SACCO database, named
          contacts and historical KIPROD outreach records.
        </p>
      </div>

      {messages.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {messages.success}
        </div>
      )}

      {messages.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {messages.error}
        </div>
      )}

      {countError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">
          The SACCO schema has not been installed yet. Run
          01-kiprod-sacco-schema.sql in Supabase before importing.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
            Institutions Ready
          </p>
          <p className="mt-2 text-2xl font-black">
            {SACCO_MASTER_DATA.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
            Contacts Ready
          </p>
          <p className="mt-2 text-2xl font-black">{contactCount}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
            Existing SACCO Records
          </p>
          <p className="mt-2 text-2xl font-black">
            {countError ? "—" : existingSaccoCount || 0}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">
            Import Method
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">
            Preserve existing records
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">Import Coverage</h2>
            <p className="mt-2 text-sm text-slate-500">
              Financial Services → SACCO → Deposit-Taking SACCO
            </p>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-5">
            {["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"].map(
              (tier) => (
                <div
                  key={tier}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-black text-slate-500">
                    {tier}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {tierCounts[tier] || 0}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-5 text-sm leading-6 text-slate-600">
            The import includes tier, 2023 asset size, county,
            public phone, public email, CEO, named contacts,
            engagement status, next action, next action date and
            historical notes.
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
            Super Admin Action
          </p>
          <h2 className="mt-2 text-xl font-black">
            Import Confirmed Data
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Existing institution names, contacts and imported history
            are detected and preserved. This button can safely complete
            a partially interrupted import.
          </p>

          <form action={importSaccoMasterData}>
            <button
              type="submit"
              disabled={Boolean(countError)}
              className="mt-6 w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Import SACCO Master Database
            </button>
          </form>

          <Link
            href="/admin/institutions"
            className="mt-3 block rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-black text-white transition hover:border-amber-500"
          >
            Open Institution Administration
          </Link>
        </aside>
      </div>
    </section>
  );
}