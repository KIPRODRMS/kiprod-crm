import Link from "next/link";
import { requireManagement } from "@/lib/auth";
import {
  CONTROLLED_STAGE_ONE_DOCUMENTS,
  EMPTY_DAILY_ACTIVITY,
  ENGAGEMENT_STAGES,
  type DailyActivityCounts,
  normaliseEngagementStage,
  parseDailyActivitySummary,
} from "@/lib/engagement";
import { reviewTeamReport } from "./actions";

type ReportsPageProps = {
  searchParams: Promise<{
    view?: string | string[];
    employee?: string | string[];
    status?: string | string[];
    from?: string | string[];
    to?: string | string[];
    support?: string | string[];
    page?: string | string[];
    success?: string | string[];
    error?: string | string[];
  }>;
};

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  role: string | null;
};

type ReportBase = {
  id: string;
  employee_id: string;
  status: string | null;
  submitted_at: string | null;
  manager_feedback: string | null;
  support_required: string | null;
};

type DailyReport = ReportBase & {
  report_date: string;
  institutions_contacted: string | null;
  activities_completed: string | null;
  new_leads_identified: string | null;
  meetings_held: string | null;
  opportunities_progressed: string | null;
  challenges: string | null;
  tomorrow_priorities: string | null;
};

type WeeklyReport = ReportBase & {
  week_start: string;
  week_end: string;
  weekly_objectives: string | null;
  work_completed: string | null;
  institutions_engaged: string | null;
  pipeline_progress: string | null;
  opportunities_created: string | null;
  proposals_sent: string | null;
  wins_and_achievements: string | null;
  delays_and_challenges: string | null;
  lessons_learned: string | null;
  next_week_priorities: string | null;
};

type ReportsQueryResult = {
  data: unknown[] | null;
  count: number | null;
  error: { message: string } | null;
};

type PipelineInstitution = {
  id: string;
  name: string;
  assigned_to: string | null;
  outreach_status: string | null;
  next_action: string | null;
  next_follow_up_at: string | null;
  status: string | null;
};

const dailyMetricLabels: Array<[keyof DailyActivityCounts, string]> = [
  ["newTargets", "New targets"],
  ["contactsAttempted", "Contacts attempted"],
  ["calls", "Calls"],
  ["whatsapp", "WhatsApp"],
  ["emails", "Emails"],
  ["meetings", "Meetings / visits"],
  ["followUps", "Follow-ups"],
  ["stageOnePacks", "Stage 1 packs"],
  ["ilcasSent", "ILCAs sent"],
];

const PAGE_SIZE = 12;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500";

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getNairobiDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getWeekDates(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const monday = new Date(date);

  monday.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not submitted";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string | null) {
  switch (status) {
    case "reviewed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "returned":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
}

function memberName(member: TeamMember | undefined) {
  return member?.full_name || member?.email || "KIPROD Team Member";
}

function memberRole(member: TeamMember | undefined) {
  return [member?.job_title, member?.department].filter(Boolean).join(" · ") || "Team Member";
}

function buildReportsHref(
  current: Record<string, string>,
  changes: Record<string, string | number | null>
) {
  const params = new URLSearchParams();

  Object.entries({ ...current, ...changes }).forEach(([key, value]) => {
    if (value !== "" && value !== null && key !== "success" && key !== "error") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `/reports?${query}` : "/reports";
}

function ReportField({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | null;
  tone?: "default" | "warning" | "support";
}) {
  if (!value) return null;

  const toneClass =
    tone === "support"
      ? "border-amber-200 bg-amber-50"
      : tone === "warning"
        ? "border-red-200 bg-red-50"
        : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DailyActivityMetrics({
  counts,
  tone = "slate",
}: {
  counts: DailyActivityCounts;
  tone?: "slate" | "amber";
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-9">
      {dailyMetricLabels.map(([key, label]) => (
        <div
          key={key}
          className={`rounded-xl border px-3 py-3 ${
            tone === "amber"
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-xl font-black text-slate-950">{counts[key]}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function dailyNarrative(value: string | null) {
  if (!value) return null;

  const marker = "End-of-day summary:";
  const markerIndex = value.indexOf(marker);

  return markerIndex >= 0
    ? value.slice(markerIndex + marker.length).trim()
    : value;
}

function MissingNames({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800">
        All submitted
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <span
          key={member.id}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-800"
        >
          {memberName(member)}
        </span>
      ))}
    </div>
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const rawParams = await searchParams;
  const params = {
    view: queryValue(rawParams.view) === "weekly" ? "weekly" : "daily",
    employee: queryValue(rawParams.employee),
    status: queryValue(rawParams.status),
    from: queryValue(rawParams.from),
    to: queryValue(rawParams.to),
    support: queryValue(rawParams.support),
    page: queryValue(rawParams.page),
    success: queryValue(rawParams.success),
    error: queryValue(rawParams.error),
  };

  const { supabase } = await requireManagement();
  const today = getNairobiDate();
  const { weekStart, weekEnd } = getWeekDates(today);
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);

  const profilesResult = await supabase
    .from("profiles")
    .select("id, full_name, email, job_title, department, role, is_active")
    .eq("is_active", true)
    .order("full_name", { ascending: true, nullsFirst: false });

  const teamMembers = ((profilesResult.data || []) as TeamMember[]).filter(
    (member) => member.role !== "super_admin" && member.role !== "management"
  );
  const teamMemberIds = teamMembers.map((member) => member.id);
  const reportEmployeeIds =
    teamMemberIds.length > 0
      ? teamMemberIds
      : ["00000000-0000-0000-0000-000000000000"];
  const profileMap = new Map(teamMembers.map((member) => [member.id, member]));

  const dailySelect = `
    id,
    employee_id,
    report_date,
    institutions_contacted,
    activities_completed,
    new_leads_identified,
    meetings_held,
    opportunities_progressed,
    challenges,
    support_required,
    tomorrow_priorities,
    status,
    submitted_at,
    manager_feedback
  `;
  const weeklySelect = `
    id,
    employee_id,
    week_start,
    week_end,
    weekly_objectives,
    work_completed,
    institutions_engaged,
    pipeline_progress,
    opportunities_created,
    proposals_sent,
    wins_and_achievements,
    delays_and_challenges,
    lessons_learned,
    next_week_priorities,
    support_required,
    status,
    submitted_at,
    manager_feedback
  `;

  async function getFilteredReports(): Promise<ReportsQueryResult> {
    if (params.view === "daily") {
      let query = supabase
        .from("daily_reports")
        .select(dailySelect, { count: "exact" })
        .in("employee_id", reportEmployeeIds)
        .order("report_date", { ascending: false });

      if (params.employee && teamMemberIds.includes(params.employee)) {
        query = query.eq("employee_id", params.employee);
      }
      if (["submitted", "reviewed", "returned"].includes(params.status)) {
        query = query.eq("status", params.status);
      }
      if (params.from) query = query.gte("report_date", params.from);
      if (params.to) query = query.lte("report_date", params.to);
      if (params.support === "required") {
        query = query.not("support_required", "is", null);
      }

      return (await query.range(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE - 1
      )) as unknown as ReportsQueryResult;
    }

    let query = supabase
      .from("weekly_reports")
      .select(weeklySelect, { count: "exact" })
      .in("employee_id", reportEmployeeIds)
      .order("week_start", { ascending: false });

    if (params.employee && teamMemberIds.includes(params.employee)) {
      query = query.eq("employee_id", params.employee);
    }
    if (["submitted", "reviewed", "returned"].includes(params.status)) {
      query = query.eq("status", params.status);
    }
    if (params.from) query = query.gte("week_start", params.from);
    if (params.to) query = query.lte("week_start", params.to);
    if (params.support === "required") {
      query = query.not("support_required", "is", null);
    }

    return (await query.range(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE - 1
    )) as unknown as ReportsQueryResult;
  }

  const [
    reportsResult,
    todayReportsResult,
    currentWeekReportsResult,
    dailyPendingResult,
    weeklyPendingResult,
    dailySupportResult,
    weeklySupportResult,
    institutionsResult,
    interactionInstitutionsResult,
  ] = await Promise.all([
    getFilteredReports(),
    supabase
      .from("daily_reports")
      .select("employee_id, activities_completed")
      .in("employee_id", reportEmployeeIds)
      .eq("report_date", today),
    supabase
      .from("weekly_reports")
      .select("employee_id")
      .in("employee_id", reportEmployeeIds)
      .eq("week_start", weekStart),
    supabase
      .from("daily_reports")
      .select("id", { count: "exact", head: true })
      .in("employee_id", reportEmployeeIds)
      .eq("status", "submitted"),
    supabase
      .from("weekly_reports")
      .select("id", { count: "exact", head: true })
      .in("employee_id", reportEmployeeIds)
      .eq("status", "submitted"),
    supabase
      .from("daily_reports")
      .select("id", { count: "exact", head: true })
      .in("employee_id", reportEmployeeIds)
      .not("support_required", "is", null),
    supabase
      .from("weekly_reports")
      .select("id", { count: "exact", head: true })
      .in("employee_id", reportEmployeeIds)
      .not("support_required", "is", null),
    supabase
      .from("institutions")
      .select(
        "id, name, assigned_to, outreach_status, next_action, next_follow_up_at, status"
      )
      .order("name", { ascending: true }),
    supabase.from("interactions").select("institution_id"),
  ]);

  const reports = (reportsResult.data || []) as unknown as (
    | DailyReport
    | WeeklyReport
  )[];
  const totalReports = reportsResult.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
  const todayReportIds = new Set(
    (todayReportsResult.data || []).map((report) => report.employee_id)
  );
  const currentWeekReportIds = new Set(
    (currentWeekReportsResult.data || []).map((report) => report.employee_id)
  );
  const missingDaily = teamMembers.filter(
    (member) => !todayReportIds.has(member.id)
  );
  const missingWeekly = teamMembers.filter(
    (member) => !currentWeekReportIds.has(member.id)
  );
  const awaitingReview =
    (dailyPendingResult.count || 0) + (weeklyPendingResult.count || 0);
  const supportRequests =
    (dailySupportResult.count || 0) + (weeklySupportResult.count || 0);
  const todayActivityReports = (todayReportsResult.data || []) as Array<{
    employee_id: string;
    activities_completed: string | null;
  }>;
  const parsedTodayActivities = todayActivityReports.map((report) =>
    parseDailyActivitySummary(report.activities_completed)
  );
  const todayActivityTotals = parsedTodayActivities.reduce<DailyActivityCounts>(
    (totals, activity) => {
      if (!activity) return totals;

      for (const [key] of dailyMetricLabels) {
        totals[key] += activity[key];
      }

      return totals;
    },
    { ...EMPTY_DAILY_ACTIVITY }
  );
  const legacyDailyReports = parsedTodayActivities.filter(
    (activity) => !activity
  ).length;

  const contactedInstitutionIds = new Set(
    (interactionInstitutionsResult.data || []).map(
      (interaction) => interaction.institution_id
    )
  );
  const pipelineGaps = (
    (institutionsResult.data || []) as PipelineInstitution[]
  ).filter((institution) => {
    const stage = normaliseEngagementStage(institution.outreach_status);
    const isContacted =
      contactedInstitutionIds.has(institution.id) ||
      (stage !== null && stage !== "target_identified");

    return (
      isContacted &&
      (!institution.next_action || !institution.next_follow_up_at)
    );
  });

  const loadError =
    profilesResult.error?.message ||
    reportsResult.error?.message ||
    todayReportsResult.error?.message ||
    currentWeekReportsResult.error?.message ||
    dailyPendingResult.error?.message ||
    weeklyPendingResult.error?.message ||
    dailySupportResult.error?.message ||
    weeklySupportResult.error?.message ||
    institutionsResult.error?.message ||
    interactionInstitutionsResult.error?.message ||
    null;

  const currentFilters: Record<string, string> = {
    view: params.view,
    employee: params.employee,
    status: params.status,
    from: params.from,
    to: params.to,
    support: params.support,
  };
  const currentUrl = buildReportsHref(currentFilters, { page });
  const latestReport = reports[0] || null;
  const latestReportMember = latestReport
    ? profileMap.get(latestReport.employee_id)
    : undefined;
  const latestReportIsDaily = latestReport
    ? "report_date" in latestReport
    : false;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
              Management Oversight
            </p>
            <h1 className="mt-2 text-3xl font-black">Team Reports</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Review staff submissions, identify missing reports, resolve blockers
              and record clear management feedback.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-300">
            Staff submit reports from <strong className="text-white">My Reports</strong>.
            This page is for management review.
          </div>
        </div>
      </div>

      {params.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {params.success}
        </div>
      )}
      {params.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {params.error}
        </div>
      )}
      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Some report information could not be loaded: {loadError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Reports Found
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {totalReports}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {params.view === "daily" ? "Daily" : "Weekly"} reports in this view
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Daily Reports Today
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {todayReportIds.size}/{teamMembers.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {missingDaily.length} missing
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Weekly Reports
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {currentWeekReportIds.size}/{teamMembers.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Week of {formatDate(weekStart)}
          </p>
        </article>
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
            Awaiting Review
          </p>
          <p className="mt-2 text-2xl font-black text-blue-950">{awaitingReview}</p>
          <p className="mt-1 text-xs text-blue-700">Daily and weekly combined</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Support Requests
          </p>
          <p className="mt-2 text-2xl font-black text-amber-950">{supportRequests}</p>
          <p className="mt-1 text-xs text-amber-700">Reports requiring attention</p>
        </article>
        <article className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-700">
            Pipeline Gaps
          </p>
          <p className="mt-2 text-2xl font-black text-red-950">
            {pipelineGaps.length}
          </p>
          <p className="mt-1 text-xs text-red-700">
            Missing next action or date
          </p>
        </article>
      </div>

      {latestReport && (
        <article className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Latest Submission
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {memberName(latestReportMember)}
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {latestReportIsDaily
                  ? formatDate((latestReport as DailyReport).report_date)
                  : `${formatDate((latestReport as WeeklyReport).week_start)} — ${formatDate(
                      (latestReport as WeeklyReport).week_end
                    )}`}
                {" · "}Submitted {formatDateTime(latestReport.submitted_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusClass(
                  latestReport.status
                )}`}
              >
                {latestReport.status === "submitted"
                  ? "Awaiting Review"
                  : formatLabel(latestReport.status)}
              </span>
              <Link
                href={`${currentUrl}#report-${latestReport.id}`}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
              >
                Open Full Report
              </Link>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {latestReportIsDaily
              ? dailyNarrative((latestReport as DailyReport).activities_completed) ||
                "No activity summary recorded."
              : (latestReport as WeeklyReport).work_completed ||
                "No work summary recorded."}
          </p>
        </article>
      )}

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
              Required Pipeline Sequence
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ENGAGEMENT_STAGES.map((stage, index) => (
                <div key={stage.value} className="contents">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-800">
                    {index + 1}. {stage.label}
                  </span>
                  {index < ENGAGEMENT_STAGES.length - 1 && (
                    <span className="font-black text-amber-600">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-red-700">
              Target identified → ILCA sent is blocked. Stages must progress
              one step at a time.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              Controlled Stage 1 Pack
            </p>
            <ol className="mt-3 space-y-2 text-sm font-semibold text-slate-800">
              {CONTROLLED_STAGE_ONE_DOCUMENTS.map((document, index) => (
                <li key={document.field}>
                  {index + 1}. {document.label}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800">
              Do not send masterclass or training information unless the
              institution specifically requested training.
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              Daily Discipline · {formatDate(today)}
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Verified Activity Totals
            </h2>
          </div>
          <p className="text-xs font-bold text-slate-500">
            Based on {parsedTodayActivities.length - legacyDailyReports} structured
            report{parsedTodayActivities.length - legacyDailyReports === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-4">
          <DailyActivityMetrics counts={todayActivityTotals} tone="amber" />
        </div>
        {legacyDailyReports > 0 && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
            {legacyDailyReports} report{legacyDailyReports === 1 ? "" : "s"}
            {" "}cannot be verified because structured activity counts were not
            submitted.
          </p>
        )}
      </article>

      <article className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-700">
              CRM Follow-up Control
            </p>
            <h2 className="mt-1 text-xl font-black text-red-950">
              Contacted Institutions Missing a Next Action or Date
            </h2>
          </div>
          <span className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-black text-white">
            {pipelineGaps.length} gap{pipelineGaps.length === 1 ? "" : "s"}
          </span>
        </div>

        {pipelineGaps.length === 0 ? (
          <div className="px-5 py-8 text-sm font-bold text-emerald-700">
            Every contacted institution has a next action and follow-up date.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {pipelineGaps.slice(0, 12).map((institution) => (
              <div
                key={institution.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/institutions/${institution.id}`}
                    className="font-black text-slate-950 hover:text-amber-700 hover:underline"
                  >
                    {institution.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    Owner: {memberName(profileMap.get(institution.assigned_to || ""))}
                  </p>
                </div>
                <p className="text-xs font-bold text-slate-600">
                  {formatLabel(
                    normaliseEngagementStage(institution.outreach_status) ||
                      institution.outreach_status
                  )}
                </p>
                <p className="text-xs font-bold text-red-700">
                  {!institution.next_action
                    ? "No next action"
                    : institution.next_action}
                </p>
                <p className="text-xs font-black text-red-700">
                  {!institution.next_follow_up_at
                    ? "NO DATE"
                    : formatDateTime(institution.next_follow_up_at)}
                </p>
              </div>
            ))}
            {pipelineGaps.length > 12 && (
              <p className="px-5 py-4 text-xs font-bold text-slate-500">
                Showing 12 of {pipelineGaps.length} gaps. Use the Institutions
                area to correct the remaining records.
              </p>
            )}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-700">
                  Missing Today
                </p>
                <h2 className="mt-1 font-black text-slate-950">Daily Reports</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">{formatDate(today)}</span>
            </div>
            <div className="mt-3">
              <MissingNames members={missingDaily} />
            </div>
          </div>
          <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                  Missing This Week
                </p>
                <h2 className="mt-1 font-black text-slate-950">Weekly Reports</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {formatDate(weekStart)}–{formatDate(weekEnd)}
              </span>
            </div>
            <div className="mt-3">
              <MissingNames members={missingWeekly} />
            </div>
          </div>
        </div>
      </article>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <Link
          href={buildReportsHref(currentFilters, { view: "daily", page: 1 })}
          className={`min-w-fit rounded-xl px-5 py-3 text-sm font-black transition ${
            params.view === "daily"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Daily Reports
        </Link>
        <Link
          href={buildReportsHref(currentFilters, { view: "weekly", page: 1 })}
          className={`min-w-fit rounded-xl px-5 py-3 text-sm font-black transition ${
            params.view === "weekly"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Weekly Reports
        </Link>
      </div>

      <form
        action="/reports"
        method="get"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="view" value={params.view} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={labelClass}>Team Member</label>
            <select name="employee" defaultValue={params.employee} className={inputClass}>
              <option value="">All team members</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberName(member)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Review Status</label>
            <select name="status" defaultValue={params.status} className={inputClass}>
              <option value="">All statuses</option>
              <option value="submitted">Awaiting review</option>
              <option value="reviewed">Reviewed</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>From</label>
            <input name="from" type="date" defaultValue={params.from} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input name="to" type="date" defaultValue={params.to} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Attention</label>
            <select name="support" defaultValue={params.support} className={inputClass}>
              <option value="">All reports</option>
              <option value="required">Support requested</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
          >
            Apply Filters
          </button>
          <Link
            href={`/reports?view=${params.view}`}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-amber-500"
          >
            Clear Filters
          </Link>
        </div>
      </form>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
              Review Queue
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {params.view === "daily" ? "Daily Reports" : "Weekly Reports"}
            </h2>
          </div>
          <p className="text-xs font-bold text-slate-500">
            {totalReports} report{totalReports === 1 ? "" : "s"} found
          </p>
        </div>

        {!loadError && reports.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-black text-slate-900">No reports match these filters.</p>
            <p className="mt-2 text-sm text-slate-500">Clear the filters or select another report type.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {reports.map((report) => {
              const member = profileMap.get(report.employee_id);
              const isDaily = "report_date" in report;
              const primarySummary = isDaily
                ? dailyNarrative(report.activities_completed)
                : report.work_completed;
              const dailyActivity = isDaily
                ? parseDailyActivitySummary(report.activities_completed)
                : null;
              const challenge = isDaily
                ? report.challenges
                : report.delays_and_challenges;
              const reportPeriod = isDaily
                ? formatDate(report.report_date)
                : `${formatDate(report.week_start)} — ${formatDate(report.week_end)}`;

              return (
                <section id={`report-${report.id}`} key={report.id} className="scroll-mt-24 p-5 lg:p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-950">
                          {memberName(member)}
                        </h3>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(report.status)}`}>
                          {report.status === "submitted" ? "Awaiting Review" : formatLabel(report.status)}
                        </span>
                        {report.support_required && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                            Support Requested
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {memberRole(member)} · {reportPeriod}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">
                      Submitted {formatDateTime(report.submitted_at)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <ReportField
                      label={isDaily ? "Activities Completed" : "Work Completed"}
                      value={primarySummary}
                    />
                    <ReportField label={isDaily ? "Challenges" : "Delays & Challenges"} value={challenge} tone="warning" />
                    <ReportField label="Support Required" value={report.support_required} tone="support" />
                  </div>

                  {isDaily && dailyActivity && (
                    <div className="mt-4">
                      <DailyActivityMetrics counts={dailyActivity} />
                    </div>
                  )}

                  {isDaily && !dailyActivity && (
                    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
                      Structured activity counts are missing, so calls,
                      messages, meetings, follow-ups and documents sent cannot
                      be verified for this day.
                    </p>
                  )}

                  {report.manager_feedback && (
                    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                        Management Feedback
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
                        {report.manager_feedback}
                      </p>
                    </div>
                  )}

                  <details className="group mt-4 rounded-2xl border border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-slate-800">
                      <span>Open full report and management review</span>
                      <span className="text-lg text-amber-600 transition group-open:rotate-45">+</span>
                    </summary>
                    <div className="border-t border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        {isDaily ? (
                          <>
                            <ReportField label="Institutions Contacted" value={report.institutions_contacted} />
                            <ReportField label="New Leads Identified" value={report.new_leads_identified} />
                            <ReportField label="Meetings Held" value={report.meetings_held} />
                            <ReportField label="Opportunities Progressed" value={report.opportunities_progressed} />
                            <ReportField label="Tomorrow's Priorities" value={report.tomorrow_priorities} />
                          </>
                        ) : (
                          <>
                            <ReportField label="Weekly Objectives" value={report.weekly_objectives} />
                            <ReportField label="Institutions Engaged" value={report.institutions_engaged} />
                            <ReportField label="Pipeline Progress" value={report.pipeline_progress} />
                            <ReportField label="Opportunities Created" value={report.opportunities_created} />
                            <ReportField label="Proposals Sent" value={report.proposals_sent} />
                            <ReportField label="Wins & Achievements" value={report.wins_and_achievements} />
                            <ReportField label="Lessons Learned" value={report.lessons_learned} />
                            <ReportField label="Next Week's Priorities" value={report.next_week_priorities} />
                          </>
                        )}
                      </div>

                      <form action={reviewTeamReport} className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                        <input type="hidden" name="report_type" value={isDaily ? "daily" : "weekly"} />
                        <input type="hidden" name="report_id" value={report.id} />
                        <input type="hidden" name="return_to" value={`${currentUrl}#report-${report.id}`} />
                        <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Review Status
                            </label>
                            <select
                              name="status"
                              defaultValue={report.status || "submitted"}
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm font-bold text-white outline-none focus:border-amber-500"
                            >
                              <option value="submitted">Awaiting review</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="returned">Return to team member</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Management Feedback
                            </label>
                            <textarea
                              name="manager_feedback"
                              rows={2}
                              defaultValue={report.manager_feedback || ""}
                              placeholder="Record guidance, a decision or the correction required..."
                              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500"
                            />
                          </div>
                          <button
                            type="submit"
                            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                          >
                            Save Review
                          </button>
                        </div>
                      </form>
                    </div>
                  </details>
                </section>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            {page > 1 ? (
              <Link
                href={buildReportsHref(currentFilters, { page: page - 1 })}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs font-bold text-slate-500">
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildReportsHref(currentFilters, { page: page + 1 })}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </article>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/management"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-amber-500"
        >
          Back to Management Dashboard
        </Link>
        <Link
          href="/management/centre"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Management Centre
        </Link>
      </div>
    </section>
  );
}
