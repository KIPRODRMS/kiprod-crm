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

function formatDateTime(value: string | null) {
  if (!value) {
    return "No activity recorded";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatReportRecency(
  reportDate: string | null | undefined,
  today: string
) {
  if (!reportDate) {
    return "No recent report";
  }

  if (reportDate === today) {
    return "Today";
  }

  const yesterday = new Date(`${today}T12:00:00+03:00`);
  yesterday.setDate(yesterday.getDate() - 1);

  if (reportDate === yesterday.toISOString().slice(0, 10)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(new Date(`${reportDate}T12:00:00+03:00`));
}

function isOpenTask(status: string | null) {
  return (
    status !== "completed" &&
    status !== "cancelled"
  );
}

export default async function TeamAccountability() {
  const { supabase, accessLevel } =
    await requireManagement();

  const today = getNairobiDate();
  const todayStart = new Date(
    `${today}T00:00:00+03:00`
  );
  const weekStart = new Date(
    todayStart.getTime() -
      6 * 24 * 60 * 60 * 1000
  );
  const reportWeekStart = new Date(`${today}T12:00:00+03:00`);
  reportWeekStart.setDate(reportWeekStart.getDate() - 6);
  const reportWeekStartDate = reportWeekStart.toISOString().slice(0, 10);

  const [
    profilesResult,
    institutionsResult,
    contactsResult,
    interactionsResult,
    tasksResult,
    opportunitiesResult,
    reportsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, job_title, department, role, is_active"
      )
      .eq("is_active", true)
      .order("full_name", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("institutions")
      .select("id, assigned_to"),

    supabase
      .from("contacts")
      .select(
        "id, institution_id, assigned_to"
      ),

    supabase
      .from("interactions")
      .select(
        "id, institution_id, recorded_by, interaction_type, subject, occurred_at, created_at"
      )
      .gte(
        "created_at",
        weekStart.toISOString()
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1000),

    supabase
      .from("tasks")
      .select(
        "id, assigned_to, status, due_at"
      ),

    supabase
      .from("opportunities")
      .select(
        "id, assigned_to, status"
      ),

    supabase
      .from("daily_reports")
      .select(
        "employee_id, report_date, status, submitted_at"
      )
      .gte("report_date", reportWeekStartDate)
      .order("report_date", {
        ascending: false,
      })
      .order("submitted_at", {
        ascending: false,
      }),
  ]);

  const profiles =
    profilesResult.data || [];
  const institutions =
    institutionsResult.data || [];
  const contacts = contactsResult.data || [];
  const interactions =
    interactionsResult.data || [];
  const tasks = tasksResult.data || [];
  const opportunities =
    opportunitiesResult.data || [];
  const reports = reportsResult.data || [];

  const teamMembers = profiles.filter(
    (member) =>
      member.role !== "super_admin" &&
      member.role !== "management"
  );

  const reportMap = new Map<
    string,
    (typeof reports)[number]
  >();
  const reportCountMap = new Map<string, number>();

  for (const report of reports) {
    if (!reportMap.has(report.employee_id)) {
      reportMap.set(report.employee_id, report);
    }

    reportCountMap.set(
      report.employee_id,
      (reportCountMap.get(report.employee_id) || 0) + 1
    );
  }

  const rows = teamMembers.map(
    (member) => {
      const assignedInstitutionIds =
        new Set(
          institutions
            .filter(
              (institution) =>
                institution.assigned_to ===
                member.id
            )
            .map(
              (institution) =>
                institution.id
            )
        );

      const directContacts =
        contacts.filter(
          (contact) =>
            contact.assigned_to ===
            member.id
        );

      const visibleContactIds = new Set(
        contacts
          .filter(
            (contact) =>
              contact.assigned_to ===
                member.id ||
              assignedInstitutionIds.has(
                contact.institution_id
              )
          )
          .map((contact) => contact.id)
      );

      const memberInteractions =
        interactions.filter(
          (interaction) =>
            interaction.recorded_by ===
            member.id
        );

      const interactionsToday =
        memberInteractions.filter(
          (interaction) =>
            new Date(
              interaction.created_at
            ).getTime() >=
            todayStart.getTime()
        ).length;

      const memberTasks = tasks.filter(
        (task) =>
          task.assigned_to === member.id
      );

      const openTasks = memberTasks.filter(
        (task) =>
          isOpenTask(task.status)
      );

      const overdueTasks = openTasks.filter(
        (task) =>
          Boolean(task.due_at) &&
          new Date(
            task.due_at as string
          ).getTime() < Date.now()
      );

      const openOpportunities =
        opportunities.filter(
          (opportunity) =>
            opportunity.assigned_to ===
              member.id &&
            opportunity.status === "open"
        ).length;

      const latestReport = reportMap.get(member.id);
      const lastInteractionAt = memberInteractions[0]?.created_at || null;
      const latestReportAt = latestReport?.submitted_at || null;
      const lastActivity = [lastInteractionAt, latestReportAt]
        .filter((value): value is string => Boolean(value))
        .sort(
          (first, second) =>
            new Date(second).getTime() - new Date(first).getTime()
        )[0] || null;

      return {
        member,
        assignedInstitutions:
          assignedInstitutionIds.size,
        directContacts:
          directContacts.length,
        visibleContacts:
          visibleContactIds.size,
        interactionsToday,
        interactionsThisWeek:
          memberInteractions.length,
        openTasks: openTasks.length,
        overdueTasks:
          overdueTasks.length,
        openOpportunities,
        report: latestReport,
        reportsThisWeek: reportCountMap.get(member.id) || 0,
        lastActivity,
      };
    }
  );

  const loadError =
    profilesResult.error?.message ||
    institutionsResult.error?.message ||
    contactsResult.error?.message ||
    interactionsResult.error?.message ||
    tasksResult.error?.message ||
    opportunitiesResult.error?.message ||
    reportsResult.error?.message ||
    null;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Team Accountability
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Assignment and Activity Tracker
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Track account ownership, contact
            coverage, CRM interactions, tasks,
            pipeline and reports from the last 7 days.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={
              accessLevel === "super_admin"
                ? "/admin/institutions"
                : "/institutions"
            }
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
          >
            {accessLevel === "super_admin"
              ? "Manage Assignments"
              : "View Institutions"}
          </Link>
          <Link
            href="/reports"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-black text-slate-800"
          >
            Review Reports
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800">
          Some team activity could not be
          loaded: {loadError}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          No active Team Members found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left">
            <thead className="bg-slate-950 text-white">
              <tr className="text-[10px] font-black uppercase tracking-wide">
                <th className="px-5 py-3">
                  Team Member
                </th>
                <th className="px-4 py-3">
                  Institutions
                </th>
                <th className="px-4 py-3">
                  Contacts
                </th>
                <th className="px-4 py-3">
                  Interactions
                </th>
                <th className="px-4 py-3">
                  Tasks
                </th>
                <th className="px-4 py-3">
                  Pipeline
                </th>
                <th className="px-4 py-3">
                  Daily Report
                </th>
                <th className="px-5 py-3">
                  Last CRM Activity
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => {
                const ownerHref =
                  accessLevel ===
                  "super_admin"
                    ? `/admin/institutions?owner=${encodeURIComponent(
                        row.member.id
                      )}`
                    : "/institutions";

                const reportSubmitted =
                  Boolean(row.report);

                return (
                  <tr
                    key={row.member.id}
                    className="align-top transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={ownerHref}
                        className="font-black text-slate-950 hover:text-amber-700"
                      >
                        {row.member
                          .full_name ||
                          row.member.email ||
                          "Unnamed Team Member"}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          row.member.job_title,
                          row.member.department,
                        ]
                          .filter(Boolean)
                          .join(" Â· ") ||
                          "Team Member"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-lg font-black text-slate-950">
                        {
                          row.assignedInstitutions
                        }
                      </p>
                      <p className="text-[10px] text-slate-500">
                        assigned accounts
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-lg font-black text-slate-950">
                        {row.visibleContacts}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {row.directContacts} direct
                        assignments
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {row.interactionsToday}{" "}
                        today
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {
                          row.interactionsThisWeek
                        }{" "}
                        in 7 days
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {row.openTasks} open
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-bold ${
                          row.overdueTasks > 0
                            ? "text-red-700"
                            : "text-slate-500"
                        }`}
                      >
                        {row.overdueTasks} overdue
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {row.openOpportunities}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        open opportunities
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">
                        {row.reportsThisWeek} in 7 days
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
                          reportSubmitted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {reportSubmitted
                          ? `Latest: ${formatReportRecency(
                              row.report?.report_date,
                              today
                            )}`
                          : "No report in 7 days"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-bold text-slate-600">
                      {formatDateTime(
                        row.lastActivity
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
