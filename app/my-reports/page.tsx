import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";
import { parseDailyActivitySummary } from "@/lib/engagement";
import {
  submitMyDailyReport,
  submitMyWeeklyReport,
} from "./actions";

type MyReportsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function getNairobiDate() {
  const parts =
    new Intl.DateTimeFormat("en-GB", {
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

function getWeekDates(
  dateString: string
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  const day = date.getDay();

  const differenceToMonday =
    day === 0 ? -6 : 1 - day;

  const monday = new Date(date);

  monday.setDate(
    date.getDate() +
      differenceToMonday
  );

  const sunday = new Date(monday);

  sunday.setDate(
    monday.getDate() + 6
  );

  return {
    weekStart: monday
      .toISOString()
      .slice(0, 10),

    weekEnd: sunday
      .toISOString()
      .slice(0, 10),
  };
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeZone: "Africa/Nairobi",
    }
  ).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }
  ).format(new Date(value));
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

function statusClass(
  status: string | null
) {
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
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

function CountField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label} *</label>
      <input
        name={name}
        type="number"
        min="0"
        step="1"
        required
        defaultValue="0"
        className={inputClass}
      />
    </div>
  );
}

function DailyActivityBreakdown({ value }: { value: string | null }) {
  const counts = parseDailyActivitySummary(value);

  if (!counts) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
        This older report does not contain the required daily activity counts.
      </div>
    );
  }

  const metrics = [
    ["Calls", counts.calls],
    ["WhatsApp", counts.whatsapp],
    ["Emails", counts.emails],
    ["Meetings", counts.meetings],
    ["Follow-ups", counts.followUps],
    ["Stage 1 packs", counts.stageOnePacks],
    ["ILCAs sent", counts.ilcasSent],
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {metrics.map(([label, count]) => (
        <div key={label} className="rounded-xl bg-slate-100 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">{count}</p>
        </div>
      ))}
    </div>
  );
}

export default async function MyReportsPage({
  searchParams,
}: MyReportsPageProps) {
  const messages = await searchParams;

  const { supabase, user } =
    await requireTeamMember();

  const today = getNairobiDate();

  const { weekStart, weekEnd } =
    getWeekDates(today);

  const [
    dailyReportsResult,
    weeklyReportsResult,
  ] = await Promise.all([
    supabase
      .from("daily_reports")
      .select(
        `
          id,
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
        `
      )
      .eq("employee_id", user.id)
      .order("report_date", {
        ascending: false,
      })
      .limit(10),

    supabase
      .from("weekly_reports")
      .select(
        `
          id,
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
        `
      )
      .eq("employee_id", user.id)
      .order("week_start", {
        ascending: false,
      })
      .limit(10),
  ]);

  const dailyReports =
    dailyReportsResult.data || [];

  const weeklyReports =
    weeklyReportsResult.data || [];

  const todayReport =
    dailyReports.find(
      (report) =>
        report.report_date === today
    );

  const currentWeekReport =
    weeklyReports.find(
      (report) =>
        report.week_start ===
        weekStart
    );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Reports
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Submit daily and weekly updates
          covering institutional engagement,
          pipeline progress, challenges and
          support required.
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

      {(dailyReportsResult.error ||
        weeklyReportsResult.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load all reports:{" "}
          {dailyReportsResult.error
            ?.message ||
            weeklyReportsResult.error
              ?.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Daily Reports
          </p>

          <p className="mt-2 text-2xl font-black">
            {dailyReports.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recent submissions
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Weekly Reports
          </p>

          <p className="mt-2 text-2xl font-black">
            {weeklyReports.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recent submissions
          </p>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm ${
            todayReport
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              todayReport
                ? "text-emerald-700"
                : "text-red-700"
            }`}
          >
            Today&apos;s Report
          </p>

          <p
            className={`mt-2 text-lg font-black ${
              todayReport
                ? "text-emerald-900"
                : "text-red-900"
            }`}
          >
            {todayReport
              ? "Submitted"
              : "Not Submitted"}
          </p>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm ${
            currentWeekReport
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              currentWeekReport
                ? "text-emerald-700"
                : "text-amber-700"
            }`}
          >
            Current Week
          </p>

          <p
            className={`mt-2 text-lg font-black ${
              currentWeekReport
                ? "text-emerald-900"
                : "text-amber-900"
            }`}
          >
            {currentWeekReport
              ? "Submitted"
              : "Pending"}
          </p>
        </article>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="#daily-report"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Daily Report
        </a>

        <a
          href="#weekly-report"
          className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-black text-amber-900 transition hover:bg-amber-100"
        >
          Weekly Report
        </a>

        <Link
          href="/my-workspace"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-amber-500"
        >
          Back to My Workspace
        </Link>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <article
          id="daily-report"
          className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Daily Reporting
            </p>

            <h2 className="mt-2 text-xl font-black">
              Submit Daily Report
            </h2>
          </div>

          <form
            action={
              submitMyDailyReport
            }
            className="space-y-5 p-6"
          >
            <div>
              <label
                className={labelClass}
              >
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

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                Daily Activity Counts
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-700">
                Enter zero where there was no activity. A Stage 1 pack means the
                Institutional Introduction, Ecosystem One-Pager and ILCA Invitation
                Note were sent together.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <CountField name="new_targets_count" label="New Targets Added" />
                <CountField name="contacts_attempted_count" label="Contacts Attempted" />
                <CountField name="calls_count" label="Calls Made" />
                <CountField name="whatsapp_count" label="WhatsApp Messages" />
                <CountField name="emails_count" label="Emails Sent" />
                <CountField name="meetings_count" label="Visits / Meetings" />
                <CountField name="follow_ups_count" label="Follow-ups Completed" />
                <CountField name="stage_1_packs_count" label="Stage 1 Packs Sent" />
                <CountField name="ilcas_sent_count" label="ILCAs Sent" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Institutions Contacted and Outcome *</label>
              <textarea
                name="institutions_contacted"
                required
                rows={5}
                placeholder="For each institution: who was contacted, what happened and what they said. Enter ‘None’ if no contact was made."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>End-of-Day Summary *</label>
              <textarea
                name="daily_summary"
                required
                rows={4}
                placeholder="Summarise the day’s work and the actual result—not just the contact list."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                New Leads Identified *
              </label>

              <textarea
                name="new_leads_identified"
                required
                rows={3}
                placeholder="List new targets or enter ‘None’."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                Meetings Held
              </label>

              <textarea
                name="meetings_held"
                rows={3}
                placeholder="Meetings held and their key outcomes..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>What Was Sent *</label>
              <textarea
                name="materials_sent"
                required
                rows={3}
                placeholder="Name the exact controlled documents sent. Enter ‘None’ if nothing was sent. Do not list masterclass information unless training was requested."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Follow-up Completed *</label>
              <textarea
                name="follow_up_summary"
                required
                rows={3}
                placeholder="State which institution was followed up, what happened and the next action date. Enter ‘None’ if no follow-up occurred."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Pipeline Movement *</label>
              <textarea
                name="pipeline_progress"
                required
                rows={3}
                placeholder="State each institution’s old stage and new stage, or enter ‘None’."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                Issues or Challenges *
              </label>

              <textarea
                name="challenges"
                required
                rows={3}
                placeholder="Record issues or enter ‘None’."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                Support Required
              </label>

              <textarea
                name="support_required"
                rows={3}
                placeholder="What support or decision is required?"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                Tomorrow&apos;s Next Actions and Dates *
              </label>

              <textarea
                name="tomorrow_priorities"
                required
                rows={3}
                placeholder="Institution — next action — follow-up date. Every contacted institution must have a dated next action."
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Submit Daily Report
            </button>
          </form>
        </article>

        <article
          id="weekly-report"
          className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Weekly Reporting
            </p>

            <h2 className="mt-2 text-xl font-black">
              Submit Weekly Report
            </h2>
          </div>

          <form
            action={
              submitMyWeeklyReport
            }
            className="space-y-5 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                >
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
                <label
                  className={labelClass}
                >
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
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
                Pipeline Progress
              </label>

              <textarea
                name="pipeline_progress"
                rows={3}
                placeholder="Which accounts or opportunities progressed?"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
                Wins and Achievements
              </label>

              <textarea
                name="wins_and_achievements"
                rows={3}
                placeholder="Key wins and achievements..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
                Delays and Challenges
              </label>

              <textarea
                name="delays_and_challenges"
                rows={3}
                placeholder="Delays, risks or blockers..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
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
              <label
                className={labelClass}
              >
                Next Week&apos;s Priorities
              </label>

              <textarea
                name="next_week_priorities"
                rows={3}
                placeholder="What must be prioritised next week?"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label
                className={labelClass}
              >
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
              className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Submit Weekly Report
            </button>
          </form>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">
              My Recent Daily Reports
            </h2>
          </div>

          {dailyReports.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No daily reports submitted
              yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {dailyReports.map(
                (report) => (
                  <section
                    key={report.id}
                    className="p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {formatDate(
                            report.report_date
                          )}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Submitted{" "}
                          {formatDateTime(
                            report.submitted_at
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          report.status
                        )}`}
                      >
                        {formatLabel(
                          report.status
                        )}
                      </span>
                    </div>

                    <DailyActivityBreakdown value={report.activities_completed} />

                    {report.manager_feedback && (
                      <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                          Management Feedback
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            report.manager_feedback
                          }
                        </p>
                      </div>
                    )}
                  </section>
                )
              )}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">
              My Recent Weekly Reports
            </h2>
          </div>

          {weeklyReports.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No weekly reports submitted
              yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {weeklyReports.map(
                (report) => (
                  <section
                    key={report.id}
                    className="p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {formatDate(
                            report.week_start
                          )}{" "}
                          —{" "}
                          {formatDate(
                            report.week_end
                          )}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Submitted{" "}
                          {formatDateTime(
                            report.submitted_at
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          report.status
                        )}`}
                      >
                        {formatLabel(
                          report.status
                        )}
                      </span>
                    </div>

                    {report.work_completed && (
                      <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Work Completed
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            report.work_completed
                          }
                        </p>
                      </div>
                    )}

                    {report.manager_feedback && (
                      <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                          Management Feedback
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            report.manager_feedback
                          }
                        </p>
                      </div>
                    )}
                  </section>
                )
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
