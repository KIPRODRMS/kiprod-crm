import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminInstitutionsPageProps = {
  searchParams: Promise<{
    q?: string;
    segment?: string;
    tier?: string;
    error?: string;
  }>;
};

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AdminInstitutionsPage({
  searchParams,
}: AdminInstitutionsPageProps) {
  const params = await searchParams;
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

  const search = String(params.q || "").trim();
  const segment = String(params.segment || "").trim();
  const tier = String(params.tier || "").trim();

  let query = supabase
    .from("institutions")
    .select(`
      id,
      name,
      sector,
      segment,
      institution_type,
      tier,
      asset_size_billions,
      ceo_name,
      location,
      status
    `)
    .order("name")
    .limit(500);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (segment) {
    query = query.eq("segment", segment);
  }

  if (tier) {
    query = query.eq("tier", tier);
  }

  const { data: institutions, error } = await query;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Super Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">
            Institution Administration
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Search, filter and edit institutional database records.
          </p>
        </div>

        <Link
          href="/admin/sacco-import"
          className="rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-black text-slate-950"
        >
          SACCO Master Import
        </Link>
      </div>

      {(params.error || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {params.error || error?.message}
        </div>
      )}

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search institution name..."
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />

        <select
          name="segment"
          defaultValue={segment}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">All segments</option>
          <option value="SACCO">SACCO</option>
          <option value="Bank">Bank</option>
          <option value="Microfinance">Microfinance</option>
          <option value="PSP / Fintech">PSP / Fintech</option>
          <option value="Forex Bureau">Forex Bureau</option>
          <option value="Insurance">Insurance</option>
          <option value="Other">Other</option>
        </select>

        <select
          name="tier"
          defaultValue={tier}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">All tiers</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
          <option value="Tier 4">Tier 4</option>
          <option value="Tier 5">Tier 5</option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-black">
            {institutions?.length || 0} institutions shown
          </p>
        </div>

        {!institutions || institutions.length === 0 ? (
          <div className="px-6 py-20 text-center text-sm text-slate-500">
            No institutions match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {institutions.map(
              (institution: {
                id: string;
                name: string;
                ceo_name: string | null;
                segment: string | null;
                tier: string | null;
                location: string | null;
                status: string | null;
              }) => (
              <article
                key={institution.id}
                className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[minmax(220px,1.2fr)_160px_110px_150px_120px_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/institutions/${institution.id}`}
                    className="block truncate text-sm font-black text-slate-950 hover:text-amber-700"
                  >
                    {institution.name}
                  </Link>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {institution.ceo_name || "CEO not recorded"}
                  </p>
                </div>

                <p className="text-xs font-bold text-slate-700">
                  {institution.segment || "No segment"}
                </p>

                <p className="text-xs font-bold text-slate-700">
                  {institution.tier || "No tier"}
                </p>

                <p className="text-xs text-slate-500">
                  {institution.location || "No location"}
                </p>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-700">
                  {formatLabel(institution.status)}
                </span>

                <Link
                  href={`/admin/institutions/${institution.id}/edit`}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-center text-xs font-black text-slate-950"
                >
                  Edit
                </Link>
              </article>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}