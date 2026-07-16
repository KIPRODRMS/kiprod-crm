import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";

function formatCurrency(
  value: number | string | null
) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default async function MyOpportunitiesPage() {
  const {
    supabase,
    user,
  } = await requireTeamMember();

  const [
    institutionsResult,
    stagesResult,
    opportunitiesResult,
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select("id, name")
      .eq("assigned_to", user.id),

    supabase
      .from("pipeline_stages")
      .select("id, stage_name"),

    supabase
      .from("opportunities")
      .select(
        `
          id,
          institution_id,
          stage_id,
          title,
          service_category,
          estimated_value,
          probability,
          status,
          expected_close_date,
          next_action,
          next_follow_up_at
        `
      )
      .eq("assigned_to", user.id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const institutions =
    institutionsResult.data || [];

  const stages =
    stagesResult.data || [];

  const opportunities =
    opportunitiesResult.data || [];

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const stageMap = new Map(
    stages.map((stage) => [
      stage.id,
      stage.stage_name,
    ])
  );

  const openOpportunities =
    opportunities.filter(
      (opportunity) =>
        opportunity.status === "open"
    );

  const pipelineValue =
    openOpportunities.reduce(
      (total, opportunity) =>
        total +
        Number(
          opportunity.estimated_value || 0
        ),
      0
    );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Opportunities
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Opportunities assigned to you,
          with their value, pipeline stage
          and next action clearly visible.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Open Opportunities
          </p>

          <p className="mt-2 text-2xl font-black">
            {openOpportunities.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently active
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            My Pipeline Value
          </p>

          <p className="mt-2 text-2xl font-black">
            {formatCurrency(
              pipelineValue
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Total value of open opportunities
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            All Assigned
          </p>

          <p className="mt-2 text-2xl font-black text-amber-900">
            {opportunities.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Open and closed opportunities
          </p>
        </article>
      </div>

      {opportunitiesResult.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Failed to load your opportunities:{" "}
          {
            opportunitiesResult.error
              .message
          }
        </div>
      )}

      {!opportunitiesResult.error &&
        opportunities.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="font-black text-slate-800">
              No opportunities are assigned
              to you yet.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Opportunities will appear here
              after management assigns them
              to your workspace.
            </p>
          </div>
        )}

      <div className="grid gap-4 xl:grid-cols-2">
        {opportunities.map(
          (opportunity) => (
            <article
              key={opportunity.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-950">
                    {opportunity.title}
                  </h2>

                  <Link
                    href={`/my-institutions/${opportunity.institution_id}`}
                    className="mt-1 inline-block text-sm font-black text-amber-700 hover:text-amber-600"
                  >
                    {institutionMap.get(
                      opportunity.institution_id
                    ) ||
                      "Unknown institution"}
                  </Link>

                  {opportunity.service_category && (
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {formatLabel(
                        opportunity.service_category
                      )}
                    </p>
                  )}
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700">
                  {formatLabel(
                    opportunity.status
                  )}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Value
                  </p>

                  <p className="mt-2 font-black text-slate-950">
                    {formatCurrency(
                      opportunity.estimated_value
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Pipeline Stage
                  </p>

                  <p className="mt-2 font-black text-slate-950">
                    {stageMap.get(
                      opportunity.stage_id
                    ) || "Not recorded"}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {opportunity.probability ||
                      0}
                    % probability
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                  Next Action
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                  {opportunity.next_action ||
                    "No next action recorded"}
                </p>

                <p className="mt-3 text-xs font-black text-amber-800">
                  {formatDate(
                    opportunity.next_follow_up_at
                  )}
                </p>
              </div>

              {opportunity.expected_close_date && (
                <p className="mt-4 text-xs font-bold text-slate-500">
                  Expected close:{" "}
                  {formatDate(
                    opportunity.expected_close_date
                  )}
                </p>
              )}
            </article>
          )
        )}
      </div>
    </section>
  );
}