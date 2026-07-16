import Link from "next/link";
import { requireManagement } from "@/lib/auth";

function getNairobiDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

function formatCurrency(
  value: number | string | null
) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatLabel(
  value: string | null
) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function isTaskOverdue({
  dueAt,
  status,
}: {
  dueAt: string | null;
  status: string | null;
}) {
  if (
    !dueAt ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return false;
  }

  return (
    new Date(dueAt).getTime() <
    Date.now()
  );
}

export default async function ManagementPage() {
  const {
    supabase,
    profile,
    accessLevel,
  } = await requireManagement();

  const today = getNairobiDate();

  const [
    profilesResult,
    institutionsResult,
    opportunitiesResult,
    tasksResult,
    dailyReportsResult,
    pipelineStagesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          email,
          job_title,
          department,
          role,
          is_active
        `
      )
      .eq("is_active", true)
      .order("full_name", {
        ascending: true,
      }),

    supabase
      .from("institutions")
      .select(
        `
          id,
          name,
          institution_type,
          status,
          outreach_status,
          assigned_to,
          next_action,
          next_follow_up_at,
          created_at
        `
      )
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("opportunities")
      .select(
        `
          id,
          institution_id,
          assigned_to,
          stage_id,
          title,
          service_category,
          estimated_value,
          probability,
          status,
          next_action,
          next_follow_up_at,
          created_at
        `
      )
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          assigned_to,
          institution_id,
          opportunity_id,
          status,
          priority,
          due_at,
          created_at
        `
      )
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("daily_reports")
      .select(
        `
          id,
          employee_id,
          report_date,
          status,
          submitted_at
        `
      )
      .eq("report_date", today),

    supabase
      .from("pipeline_stages")
      .select(
        `
          id,
          stage_name,
          stage_order
        `
      )
      .order("stage_order", {
        ascending: true,
      }),
  ]);

  const teamMembers =
    profilesResult.data || [];

  const institutions =
    institutionsResult.data || [];

  const opportunities =
    opportunitiesResult.data || [];

  const tasks =
    tasksResult.data || [];

  const todayReports =
    dailyReportsResult.data || [];

  const pipelineStages =
    pipelineStagesResult.data || [];

  const profileMap = new Map(
    teamMembers.map((teamMember) => [
      teamMember.id,
      teamMember.full_name ||
        teamMember.email ||
        "KIPROD Team Member",
    ])
  );

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const stageMap = new Map(
    pipelineStages.map((stage) => [
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

  const weightedPipelineValue =
    openOpportunities.reduce(
      (total, opportunity) => {
        const value = Number(
          opportunity.estimated_value || 0
        );

        const probability = Number(
          opportunity.probability || 0
        );

        return (
          total +
          value * (probability / 100)
        );
      },
      0
    );

  const activeTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  const overdueTasks = activeTasks.filter(
    (task) =>
      isTaskOverdue({
        dueAt: task.due_at,
        status: task.status,
      })
  );

  const reportingTeamMembers =
    teamMembers.filter(
      (teamMember) =>
        teamMember.role !==
        "super_admin"
    );

  const submittedReportIds = new Set(
    todayReports.map(
      (report) => report.employee_id
    )
  );

  const missingReports =
    reportingTeamMembers.filter(
      (teamMember) =>
        !submittedReportIds.has(
          teamMember.id
        )
    );

  const unassignedInstitutions =
    institutions.filter(
      (institution) =>
        !institution.assigned_to
    );

  const unassignedOpportunities =
    opportunities.filter(
      (opportunity) =>
        !opportunity.assigned_to
    );

  const recentInstitutions =
    institutions.slice(0, 6);

  const urgentTasks = overdueTasks
    .sort((first, second) => {
      const firstDate = first.due_at
        ? new Date(
            first.due_at
          ).getTime()
        : Number.MAX_SAFE_INTEGER;

      const secondDate = second.due_at
        ? new Date(
            second.due_at
          ).getTime()
        : Number.MAX_SAFE_INTEGER;

      return firstDate - secondDate;
    })
    .slice(0, 6);

  const priorityOpportunities =
    openOpportunities
      .sort(
        (first, second) =>
          Number(
            second.estimated_value || 0
          ) -
          Number(
            first.estimated_value || 0
          )
      )
      .slice(0, 6);

  const displayName =
    profile.full_name ||
    profile.email ||
    "Management";

  const loadError =
    profilesResult.error?.message ||
    institutionsResult.error?.message ||
    opportunitiesResult.error
      ?.message ||
    tasksResult.error?.message ||
    dailyReportsResult.error?.message ||
    pipelineStagesResult.error
      ?.message ||
    null;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
              Management Workspace
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Welcome, {displayName}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Organisation-wide visibility
              across institutional accounts,
              pipeline, assignments,
              reporting and execution.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/management/centre"
              className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Management Centre
            </Link>

            {accessLevel ===
              "super_admin" && (
              <Link
                href="/admin"
                className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-black text-white transition hover:border-amber-400 hover:bg-slate-900"
              >
                Super Admin Centre
              </Link>
            )}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Some management information
          could not be loaded:{" "}
          {loadError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Active Team Members
          </p>

          <p className="mt-2 text-2xl font-black">
            {teamMembers.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Active CRM accounts
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Institutions
          </p>

          <p className="mt-2 text-2xl font-black">
            {institutions.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Organisation-wide accounts
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Open Opportunities
          </p>

          <p className="mt-2 text-2xl font-black text-amber-900">
            {openOpportunities.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Active institutional pipeline
          </p>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm ${
            overdueTasks.length > 0
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              overdueTasks.length > 0
                ? "text-red-700"
                : "text-slate-400"
            }`}
          >
            Overdue Tasks
          </p>

          <p
            className={`mt-2 text-2xl font-black ${
              overdueTasks.length > 0
                ? "text-red-900"
                : "text-slate-950"
            }`}
          >
            {overdueTasks.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Requiring management attention
          </p>
        </article>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Pipeline Value
          </p>

          <p className="mt-2 text-xl font-black">
            {formatCurrency(
              pipelineValue
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Total open opportunity value
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
            Weighted Pipeline
          </p>

          <p className="mt-2 text-xl font-black text-blue-900">
            {formatCurrency(
              weightedPipelineValue
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Probability-adjusted value
          </p>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm ${
            missingReports.length > 0
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              missingReports.length > 0
                ? "text-amber-700"
                : "text-emerald-700"
            }`}
          >
            Daily Reports Missing
          </p>

          <p
            className={`mt-2 text-2xl font-black ${
              missingReports.length > 0
                ? "text-amber-900"
                : "text-emerald-900"
            }`}
          >
            {missingReports.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            For {formatLabel(today)}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Unassigned Accounts
          </p>

          <p className="mt-2 text-2xl font-black">
            {unassignedInstitutions.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Institutions needing ownership
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">
                  Priority Opportunities
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Highest-value open
                  opportunities.
                </p>
              </div>

              <Link
                href="/opportunities"
                className="text-sm font-black text-amber-700 hover:text-amber-600"
              >
                View all →
              </Link>
            </div>

            {priorityOpportunities.length ===
            0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">
                No open opportunities
                recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {priorityOpportunities.map(
                  (opportunity) => (
                    <Link
                      key={opportunity.id}
                      href="/opportunities"
                      className="block px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_160px] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {
                              opportunity.title
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {institutionMap.get(
                              opportunity.institution_id
                            ) ||
                              "Institution not recorded"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Owner
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-slate-700">
                            {opportunity.assigned_to
                              ? profileMap.get(
                                  opportunity.assigned_to
                                ) ||
                                "Assigned Team Member"
                              : "Unassigned"}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <p className="font-black text-slate-950">
                            {formatCurrency(
                              opportunity.estimated_value
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {stageMap.get(
                              opportunity.stage_id
                            ) ||
                              "Stage not recorded"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">
                  Recent Institutions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Recently added
                  institutional accounts.
                </p>
              </div>

              <Link
                href="/institutions"
                className="text-sm font-black text-amber-700 hover:text-amber-600"
              >
                View all →
              </Link>
            </div>

            {recentInstitutions.length ===
            0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">
                No institutions recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentInstitutions.map(
                  (institution) => (
                    <Link
                      key={institution.id}
                      href={`/institutions/${institution.id}`}
                      className="block px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_160px] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {institution.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {institution.next_action ||
                              "No next action recorded"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Owner
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-slate-700">
                            {institution.assigned_to
                              ? profileMap.get(
                                  institution.assigned_to
                                ) ||
                                "Assigned Team Member"
                              : "Unassigned"}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-800">
                            {formatLabel(
                              institution.status
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Management Actions
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/institutions"
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Manage Institutions
              </Link>

              <Link
                href="/contacts"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
              >
                Manage Contacts
              </Link>

              <Link
                href="/opportunities"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
              >
                Manage Pipeline
              </Link>

              <Link
                href="/tasks"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
              >
                Assign and Review Tasks
              </Link>

              <Link
                href="/reports"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-500 hover:bg-amber-50"
              >
                Review Team Reports
              </Link>

              <Link
                href="/academy"
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 transition hover:bg-amber-100"
              >
                Manage Academy
              </Link>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-lg">
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <h2 className="font-black text-red-900">
                Overdue Work
              </h2>

              <p className="mt-1 text-xs text-red-700">
                Tasks requiring immediate
                management attention.
              </p>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                No overdue tasks.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {urgentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block px-5 py-4 transition hover:bg-red-50"
                  >
                    <p className="text-sm font-black text-slate-950">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {task.assigned_to
                        ? profileMap.get(
                            task.assigned_to
                          ) ||
                          "Assigned Team Member"
                        : "Unassigned"}
                    </p>

                    <p className="mt-2 text-xs font-black text-red-700">
                      {formatDateTime(
                        task.due_at
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-lg">
            <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
              <h2 className="font-black text-amber-900">
                Daily Reports Missing
              </h2>

              <p className="mt-1 text-xs text-amber-700">
                Active accounts without a
                report today.
              </p>
            </div>

            {missingReports.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                All expected reports have
                been submitted.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {missingReports
                  .slice(0, 8)
                  .map((teamMember) => (
                    <div
                      key={teamMember.id}
                      className="px-5 py-4"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {teamMember.full_name ||
                          teamMember.email ||
                          "KIPROD Team Member"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {teamMember.job_title ||
                          formatLabel(
                            teamMember.role
                          )}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </article>

          {(unassignedInstitutions.length >
            0 ||
            unassignedOpportunities.length >
              0) && (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Assignment Attention
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold">
                    Institutions
                  </span>

                  <span className="font-black">
                    {
                      unassignedInstitutions.length
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold">
                    Opportunities
                  </span>

                  <span className="font-black">
                    {
                      unassignedOpportunities.length
                    }
                  </span>
                </div>
              </div>
            </article>
          )}
        </aside>
      </div>
    </section>
  );
}