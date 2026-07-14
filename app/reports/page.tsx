import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  submitDailyReport,
  submitWeeklyReport,
} from "./actions";

type ReportsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not submitted";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  const differenceToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + differenceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

function statusClass(status: string) {
  switch (status) {
    case "reviewed":
      return "bg-emerald-100 text-emerald-800";
    case "returned":
      return "bg-red-100 text-red-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-amber-500";

const labelClass =
  "mb-2 block text-xs font-black uppercase tracking-wide text-slate-600";

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const today = getNairobiDate();
  const { weekStart, weekEnd } = getWeekDates(today);

  const [
    profileResult,
    profilesResult,
    dailyReportsResult,
    weeklyReportsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, job_title, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name"),

    supabase
      .from("daily_reports")
      .select(`
        id,
        employee_id,
        report_date,
        institutions_contacted,
        activities_completed,
        challenges,
        support_required,
        tomorrow_priorities,
        status,
        submitted_at,
        manager_feedback
      `)
      .order("report_date", { ascending: false })
      .limit(20),

    supabase
      .from("weekly_reports")
      .select(`
        id,
        employee_id,
        week_start,
        week_end,
        weekly_objectives,
        work_completed,
        pipeline_progress,
        wins_and_achievements,
        delays_and_challenges,
        next_week_priorities,
        support_required,
        status,
        submitted_at,
        manager_feedback
      `)
      .order("week_start", { ascending: false })
      .limit(20),
  ]);

  const profile = profileResult.data;
  const profiles = profilesResult.data || [];
  const dailyReports = dailyReportsResult.data || [];
  const weeklyReports = weeklyReportsResult.data || [];

  const profileMap = new Map(
    profiles.map((employee) => [
      employee.id,
      employee.full_name ||
        employee.email ||
        "KIPROD Employee",
    ])
  );

  const myDailyReports = dailyReports.filter(
    (report) => report.employee_id === user.id
  );

  const myWeeklyReports = weeklyReports.filter(
    (report) => report.employee_id === user.id
  );

  const isManager = [
    "super_admin",
    "management",
    "team_lead",
  ].includes(profile?.role || "");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-amber-700 hover:text-amber-600"
            >
              ← CRM Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Daily & Weekly Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record work completed, institutional progress,
              challenges and required management support.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Logged In As
            </p>

            <p className="mt-1 font-black">
              {profile?.full_name ||
                profile?.email ||
                "KIPROD Employee"}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {messages.success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            {messages.success}
          </div>
        )}

        {messages.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
            {messages.error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              My Daily Reports
            </p>

            <p className="mt-3 text-3xl font-black">
              {myDailyReports.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              My Weekly Reports
            </p>

            <p className="mt-3 text-3xl font-black">
              {myWeeklyReports.length}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Team Daily Reports
            </p>

            <p className="mt-3 text-3xl font-black text-blue-900">
              {isManager ? dailyReports.length : "—"}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Team Weekly Reports
            </p>

            <p className="mt-3 text-3xl font-black text-amber-900">
              {isManager ? weeklyReports.length : "—"}
            </p>
          </article>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                Daily Reporting
              </p>

              <h2 className="mt-2 text-xl font-black">
                Submit Daily Report
              </h2>
            </div>

            <form
              action={submitDailyReport}
              className="space-y-5 p-6"
            >
              <div>
                <label className={labelClass}>
                  Report Date *
                </label>

                <input
                  name="report_date"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Institutions Contacted
                </label>

                <textarea
                  name="institutions_contacted"
                  rows={3}
                  placeholder="List the institutions contacted today..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Activities Completed
                </label>

                <textarea
                  name="activities_completed"
                  rows={4}
                  placeholder="Calls, emails, meetings, proposals, follow-ups..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  New Leads Identified
                </label>

                <textarea
                  name="new_leads_identified"
                  rows={3}
                  placeholder="New institutions or contacts identified..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Meetings Held
                </label>

                <textarea
                  name="meetings_held"
                  rows={3}
                  placeholder="Meetings held and key outcomes..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Opportunities Progressed
                </label>

                <textarea
                  name="opportunities_progressed"
                  rows={3}
                  placeholder="Which opportunities moved forward?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Challenges
                </label>

                <textarea
                  name="challenges"
                  rows={3}
                  placeholder="What slowed down or blocked progress?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Support Required
                </label>

                <textarea
                  name="support_required"
                  rows={3}
                  placeholder="What assistance is required from management?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tomorrow&apos;s Priorities
                </label>

                <textarea
                  name="tomorrow_priorities"
                  rows={3}
                  placeholder="What will be prioritised tomorrow?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-amber-400"
              >
                Submit Daily Report
              </button>
            </form>
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                Weekly Reporting
              </p>

              <h2 className="mt-2 text-xl font-black">
                Submit Weekly Report
              </h2>
            </div>

            <form
              action={submitWeeklyReport}
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Week Start *
                  </label>

                  <input
                    name="week_start"
                    type="date"
                    required
                    defaultValue={weekStart}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Week End *
                  </label>

                  <input
                    name="week_end"
                    type="date"
                    required
                    defaultValue={weekEnd}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Weekly Objectives
                </label>

                <textarea
                  name="weekly_objectives"
                  rows={3}
                  placeholder="What were the objectives for this week?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Work Completed
                </label>

                <textarea
                  name="work_completed"
                  rows={4}
                  placeholder="Summarise the work completed..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Institutions Engaged
                </label>

                <textarea
                  name="institutions_engaged"
                  rows={3}
                  placeholder="Which institutions were engaged?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Pipeline Progress
                </label>

                <textarea
                  name="pipeline_progress"
                  rows={3}
                  placeholder="Which institutions or opportunities progressed?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Opportunities Created
                </label>

                <textarea
                  name="opportunities_created"
                  rows={3}
                  placeholder="New opportunities created during the week..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Proposals Sent
                </label>

                <textarea
                  name="proposals_sent"
                  rows={3}
                  placeholder="Proposals, concept notes or documents sent..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Wins & Achievements
                </label>

                <textarea
                  name="wins_and_achievements"
                  rows={3}
                  placeholder="Key wins and achievements..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Delays & Challenges
                </label>

                <textarea
                  name="delays_and_challenges"
                  rows={3}
                  placeholder="Delays, risks or blockers..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Lessons Learned
                </label>

                <textarea
                  name="lessons_learned"
                  rows={3}
                  placeholder="What was learned this week?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Next Week Priorities
                </label>

                <textarea
                  name="next_week_priorities"
                  rows={3}
                  placeholder="What must be prioritised next week?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Support Required
                </label>

                <textarea
                  name="support_required"
                  rows={3}
                  placeholder="Management decisions or assistance required..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-amber-400"
              >
                Submit Weekly Report
              </button>
            </form>
          </article>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-black">
                Recent Daily Reports
              </h2>
            </div>

            {dailyReportsResult.error && (
              <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                {dailyReportsResult.error.message}
              </div>
            )}

            {!dailyReportsResult.error &&
              dailyReports.length === 0 && (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  No daily reports submitted.
                </div>
              )}

            {dailyReports.length > 0 && (
              <div className="divide-y divide-slate-200">
                {dailyReports.map((report) => (
                  <section key={report.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {profileMap.get(report.employee_id) ||
                            "KIPROD Employee"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(report.report_date)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          report.status
                        )}`}
                      >
                        {formatLabel(report.status)}
                      </span>
                    </div>

                    {report.activities_completed && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Activities Completed
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {report.activities_completed}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-slate-400">
                      Submitted:{" "}
                      {formatDateTime(report.submitted_at)}
                    </p>
                  </section>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-black">
                Recent Weekly Reports
              </h2>
            </div>

            {weeklyReportsResult.error && (
              <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                {weeklyReportsResult.error.message}
              </div>
            )}

            {!weeklyReportsResult.error &&
              weeklyReports.length === 0 && (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  No weekly reports submitted.
                </div>
              )}

            {weeklyReports.length > 0 && (
              <div className="divide-y divide-slate-200">
                {weeklyReports.map((report) => (
                  <section key={report.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {profileMap.get(report.employee_id) ||
                            "KIPROD Employee"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(report.week_start)} —{" "}
                          {formatDate(report.week_end)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          report.status
                        )}`}
                      >
                        {formatLabel(report.status)}
                      </span>
                    </div>

                    {report.work_completed && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Work Completed
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {report.work_completed}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-slate-400">
                      Submitted:{" "}
                      {formatDateTime(report.submitted_at)}
                    </p>
                  </section>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}