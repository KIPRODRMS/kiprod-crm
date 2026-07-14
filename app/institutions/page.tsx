import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createInstitution } from "./actions";

type InstitutionsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function InstitutionsPage({
  searchParams,
}: InstitutionsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: institutions, error } = await supabase
    .from("institutions")
    .select(
      `
        id,
        name,
        institution_type,
        sector,
        location,
        status,
        next_action,
        next_follow_up_at,
        created_at
      `
    )
    .order("created_at", { ascending: false });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.20),_transparent_38%),linear-gradient(135deg,_#e8eef5,_#d8e2ec)]">
  <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(15,23,42,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.10)_1px,transparent_1px)] [background-size:34px_34px]" />
      <header className="relative z-10 border-b border-slate-800 bg-slate-950/95 px-6 py-5 text-white shadow-xl backdrop-blur lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-white">
              Institutions
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Manage prospects, opportunities and active KIPROD partners.
            </p>
          </div>

          <div className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
            KIPROD CRM
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[380px_1fr] lg:px-10">
        <section>
          <div className="rounded-2xl border border-slate-300 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-md p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Add Institution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new prospect or institutional partner.
            </p>

            {params.success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {params.success}
              </div>
            )}

            {params.error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {params.error}
              </div>
            )}

            <form action={createInstitution} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Institution name *
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Example: Capital SACCO"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="institution_type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Institution type
                </label>

                <select
                  id="institution_type"
                  name="institution_type"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                >
                  <option value="">Select type</option>
                  <option value="SACCO">SACCO</option>
                  <option value="Bank">Bank</option>
                  <option value="Microfinance Institution">
                    Microfinance Institution
                  </option>
                  <option value="Insurance Company">
                    Insurance Company
                  </option>
                  <option value="Corporate">Corporate</option>
                  <option value="Government Institution">
                    Government Institution
                  </option>
                  <option value="NGO">NGO</option>
                  <option value="Training Partner">Training Partner</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sector"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Sector
                </label>

                <input
                  id="sector"
                  name="sector"
                  placeholder="Financial services"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  placeholder="Nairobi, Kenya"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    General email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="info@institution.co.ke"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    placeholder="+254..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Lead source
                </label>

                <select
                  id="source"
                  name="source"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                >
                  <option value="">Select source</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Outreach">Cold Outreach</option>
                  <option value="Website">Website</option>
                  <option value="Event">Event</option>
                  <option value="Existing Relationship">
                    Existing Relationship
                  </option>
                  <option value="Social Media">Social Media</option>
                  <option value="Tender or RFP">Tender or RFP</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Current status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="prospect"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                >
                  <option value="prospect">Prospect</option>
                  <option value="engaged">Engaged</option>
                  <option value="active_opportunity">
                    Active Opportunity
                  </option>
                  <option value="active_partner">Active Partner</option>
                  <option value="deferred">Deferred</option>
                  <option value="lost">Lost</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="next_action"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Next action
                </label>

                <textarea
                  id="next_action"
                  name="next_action"
                  rows={3}
                  placeholder="Send the ILCA invitation..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="next_follow_up_at"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Follow-up date
                </label>

                <input
                  id="next_follow_up_at"
                  name="next_follow_up_at"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400"
              >
                Save Institution
              </button>
            </form>
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-slate-300 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-md shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Institutional Database
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {institutions?.length || 0} institution
                    {(institutions?.length || 0) === 1 ? "" : "s"} recorded
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load institutions: {error.message}
              </div>
            )}

            {!error && (!institutions || institutions.length === 0) && (
              <div className="px-6 py-20 text-center">
                <p className="font-semibold text-slate-700">
                  No institutions recorded yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Use the form to add your first KIPROD prospect.
                </p>
              </div>
            )}

            {institutions && institutions.length > 0 && (
              <div className="divide-y divide-slate-200">
                {institutions.map((institution) => (
                  <Link
                    key={institution.id}
                    href={`/institutions/${institution.id}`}
                    className="block px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {institution.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          {institution.institution_type && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {institution.institution_type}
                            </span>
                          )}

                          {institution.sector && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {institution.sector}
                            </span>
                          )}

                          {institution.location && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {institution.location}
                            </span>
                          )}
                        </div>

                        {institution.next_action && (
                          <p className="mt-3 text-sm text-slate-600">
                            <span className="font-semibold">Next action:</span>{" "}
                            {institution.next_action}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold capitalize text-amber-800">
                          {institution.status.replace(/_/g, " ")}
                        </span>

                        <span className="text-sm font-semibold text-slate-400">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}