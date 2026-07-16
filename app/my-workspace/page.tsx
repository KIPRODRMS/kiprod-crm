import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";

function getNairobiDate() {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

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

function getWeekStart(dateString: string) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  const day = date.getDay();

  const differenceToMonday =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + differenceToMonday
  );

  return date.toISOString().slice(0, 10);
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
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

export default async function TeamWorkspacePage() {
  const {
    supabase,
    user,
    profile,
  } = await requireTeamMember();

  const today = getNairobiDate();
  const weekStart = getWeekStart(today);

  const [
    institutionsResult,
    opportunitiesResult,
    tasksResult,
    dailyReportResult,
    weeklyReportResult,
    enrolmentsResult,
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select(
        `
          id,
          name,
          status,
          next_action,
          next_follow_up_at
        `
      )
      .eq("assigned_to", user.id)
      .order("next_follow_up_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("opportunities")
      .select(
        `
          id,
          institution_id,
          title,
          estimated_value,
          status,
          next_action,
          next_follow_up_at
        `
      )
      .eq("assigned_to", user.id)
      .eq("status", "open")
      .order("next_follow_up_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          status,
          priority,
          institution_id,
          opportunity_id,
          due_at
        `
      )
      .eq("assigned_to", user.id)
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("daily_reports")
      .select(
        `
          id,
          status,
          submitted_at
        `
      )
      .eq("employee_id", user.id)
      .eq("report_date", today)
      .maybeSingle(),

    supabase
      .from("weekly_reports")
      .select(
        `
          id,
          status,
          submitted_at
        `
      )
      .eq("employee_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle(),

    supabase
      .from("academy_enrollments")
      .select(
        `
          id,
          course_id,
          progress_percentage,
          final_score,
          completed_at,
          created_at
        `
      )
      .eq("employee_id", user.id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const institutions =
    institutionsResult.data || [];

  const opportunities =
    opportunitiesResult.data || [];

  const tasks = tasksResult.data || [];

  const enrolments =
    enrolmentsResult.data || [];

  const activeTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  const now = Date.now();

  const overdueTasks = activeTasks.filter(
    (task) =>
      task.due_at &&
      new Date(task.due_at).getTime() <
        now
  );

  const nextFollowUps = activeTasks
    .filter((task) => Boolean(task.due_at))
    .slice(0, 5);

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const displayName =
    profile.full_name?.trim() ||
    profile.email?.split("@")[0] ||
    "KIPROD Team Member";

  const metrics = [
    {
      label: "My Institutions",
      value: institutions.length,
      detail: "Accounts assigned to me",
      urgent: false,
    },
    {
      label: "Open Opportunities",
      value: opportunities.length,
      detail: "My active pipeline",
      urgent: false,
    },
    {
      label: "Pending Tasks",
      value: activeTasks.length,
      detail: "Work requiring action",
      urgent: false,
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks.length,
      detail: "Past the assigned deadline",
      urgent: overdueTasks.length > 0,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Welcome, {displayName}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Your assigned accounts,
          opportunities, follow-ups, reports
          and learning in one practical
          workspace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`rounded-2xl border p-4 shadow-sm ${
              metric.urgent
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p
              className={`text-[11px] font-black uppercase tracking-wide ${
                metric.urgent
                  ? "text-red-700"
                  : "text-slate-400"
              }`}
            >
              {metric.label}
            </p>

            <p
              className={`mt-2 text-2xl font-black ${
                metric.urgent
                  ? "text-red-800"
                  : "text-slate-950"
              }`}
            >
              {metric.value}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">
                  My Assigned Institutions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Accounts currently assigned
                  to you.
                </p>
              </div>

              <Link
                href="/my-institutions"
                className="shrink-0 text-sm font-black text-amber-700 hover:text-amber-600"
              >
                View all →
              </Link>
            </div>

            {institutions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No institutions are assigned
                to you yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {institutions
                  .slice(0, 5)
                  .map((institution) => (
                    <Link
                      key={institution.id}
                      href={`/my-institutions/${institution.id}`}
                      className="block px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {institution.name}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {institution.next_action ||
                              "No next action recorded"}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black capitalize text-amber-800">
                          {institution.status?.replace(
                            /_/g,
                            " "
                          ) || "prospect"}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-black">
                  My Open Opportunities
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your current institutional
                  pipeline.
                </p>
              </div>

              <Link
                href="/my-opportunities"
                className="shrink-0 text-sm font-black text-amber-700 hover:text-amber-600"
              >
                View all →
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No open opportunities are
                assigned to you.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {opportunities
                  .slice(0, 5)
                  .map((opportunity) => (
                    <Link
                      key={opportunity.id}
                      href="/my-opportunities"
                      className="block px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {opportunity.title}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {institutionMap.get(
                              opportunity.institution_id
                            ) ||
                              "Institution not recorded"}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-black text-slate-800">
                          {formatCurrency(
                            opportunity.estimated_value
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Quick Actions
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/my-institutions"
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Add interaction
              </Link>

              <Link
                href="/my-reports#daily-report"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
              >
                Submit daily report
              </Link>

              <Link
                href="/my-reports#weekly-report"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
              >
                Submit weekly report
              </Link>

              <Link
                href="/my-tasks"
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 transition hover:bg-amber-100"
              >
                View tasks
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Report Status
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold">
                  Today
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black ${
                    dailyReportResult.data
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {dailyReportResult.data
                    ? "Submitted"
                    : "Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold">
                  Current week
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black ${
                    weeklyReportResult.data
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {weeklyReportResult.data
                    ? "Submitted"
                    : "Pending"}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Academy
                </p>

                <p className="mt-2 text-2xl font-black">
                  {enrolments.length}
                </p>

                <p className="text-xs text-slate-500">
                  My enrolments
                </p>
              </div>

              <Link
                href="/my-academy"
                className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
              >
                Open Academy
              </Link>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-black">
                My Next Follow-ups
              </h2>
            </div>

            {nextFollowUps.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                No scheduled follow-ups.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {nextFollowUps.map((task) => (
                  <Link
                    key={task.id}
                    href="/my-tasks"
                    className="block px-5 py-4 transition hover:bg-slate-50"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        task.due_at
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}