import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "./actions";

type OpportunitiesPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatCurrency(value: number | string | null) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name")
    .order("name");

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, institution_id")
    .order("full_name");

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, stage_name, stage_order, probability")
    .order("stage_order");

  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("opportunities")
    .select(`
      id,
      institution_id,
      contact_id,
      stage_id,
      title,
      service_category,
      estimated_value,
      probability,
      status,
      expected_close_date,
      next_action,
      next_follow_up_at,
      created_at
    `)
    .order("created_at", { ascending: false });

  const institutionMap = new Map(
    (institutions || []).map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const contactMap = new Map(
    (contacts || []).map((contact) => [contact.id, contact.full_name])
  );

  const stageMap = new Map(
    (stages || []).map((stage) => [stage.id, stage.stage_name])
  );

  const totalPipelineValue = (opportunities || []).reduce(
    (total, opportunity) =>
      total + Number(opportunity.estimated_value || 0),
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95 px-6 py-5 shadow-sm backdrop-blur lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-amber-700 hover:text-amber-600"
            >
              ← CRM Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Opportunities
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track institutional opportunities through the KIPROD engagement
              pipeline.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Pipeline Value
            </p>
            <p className="mt-1 text-lg font-black">
              {formatCurrency(totalPipelineValue)}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:px-10">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              New Opportunity
            </p>

            <h2 className="mt-2 text-xl font-black">
              Add Institutional Opportunity
            </h2>
          </div>

          <div className="p-6">
            {messages.success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {messages.success}
              </div>
            )}

            {messages.error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {messages.error}
              </div>
            )}

            <form action={createOpportunity} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Institution *
                </label>

                <select
                  name="institution_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="" disabled>
                    Select institution
                  </option>

                  {(institutions || []).map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Opportunity Title *
                </label>

                <input
                  name="title"
                  required
                  placeholder="Example: Credit Risk Training Programme"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Service Category
                </label>

                <select
                  name="service_category"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="">Select service</option>
                  <option value="ILCA, ICDF and ICAR">
                    ILCA, ICDF and ICAR
                  </option>
                  <option value="Credit Risk Training">
                    Credit Risk Training
                  </option>
                  <option value="Board Development">
                    Board Development
                  </option>
                  <option value="Policy Development">
                    Policy Development
                  </option>
                  <option value="Governance Advisory">
                    Governance Advisory
                  </option>
                  <option value="AML/CFT Programme">
                    AML/CFT Programme
                  </option>
                  <option value="Command Centre Implementation">
                    Command Centre Implementation
                  </option>
                  <option value="Institutional Partnership">
                    Institutional Partnership
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Pipeline Stage *
                </label>

                <select
                  name="stage_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="" disabled>
                    Select pipeline stage
                  </option>

                  {(stages || []).map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.stage_name} — {stage.probability}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Main Contact
                </label>

                <select
                  name="contact_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="">No contact selected</option>

                  {(contacts || []).map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} —{" "}
                      {institutionMap.get(contact.institution_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Estimated Value
                </label>

                <input
                  name="estimated_value"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="250000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Expected Close Date
                </label>

                <input
                  name="expected_close_date"
                  type="date"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe the opportunity..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Next Action
                </label>

                <textarea
                  name="next_action"
                  rows={3}
                  placeholder="Send ILCA invitation, prepare proposal..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Follow-up Date
                </label>

                <input
                  name="next_follow_up_at"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Internal Notes
                </label>

                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Internal notes about this opportunity..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              >
                Save Opportunity
              </button>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Institutional Pipeline
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Active Opportunities
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {opportunities?.length || 0} opportunities recorded.
            </p>
          </div>

          {opportunitiesError && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {opportunitiesError.message}
            </div>
          )}

          {!opportunitiesError &&
            (!opportunities || opportunities.length === 0) && (
              <div className="px-8 py-24 text-center">
                <p className="text-lg font-black text-slate-800">
                  No opportunities recorded
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Add the first opportunity using the form.
                </p>
              </div>
            )}

          {opportunities && opportunities.length > 0 && (
            <div className="space-y-5 bg-slate-50/70 p-6">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="text-xl font-black">
                        {opportunity.title}
                      </h3>

                      <Link
                        href={`/institutions/${opportunity.institution_id}`}
                        className="mt-2 block text-sm font-bold text-amber-700"
                      >
                        {institutionMap.get(opportunity.institution_id)}
                      </Link>

                      {opportunity.contact_id && (
                        <p className="mt-1 text-sm text-slate-500">
                          Contact: {contactMap.get(opportunity.contact_id)}
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-lg font-black">
                        {formatCurrency(opportunity.estimated_value)}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {opportunity.probability}% probability
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {stageMap.get(opportunity.stage_id)}
                    </span>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                      {formatLabel(opportunity.status)}
                    </span>

                    {opportunity.service_category && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {opportunity.service_category}
                      </span>
                    )}
                  </div>

                  {opportunity.next_action && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                        Next Action
                      </p>

                      <p className="mt-2 text-sm font-semibold text-amber-950">
                        {opportunity.next_action}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}