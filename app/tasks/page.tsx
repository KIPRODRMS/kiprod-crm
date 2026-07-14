import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTask, updateTaskStatus } from "./actions";

type TasksPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function priorityClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default async function TasksPage({
  searchParams,
}: TasksPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [
    institutionsResult,
    contactsResult,
    opportunitiesResult,
    profilesResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select("id, name")
      .order("name"),

    supabase
      .from("contacts")
      .select("id, full_name, institution_id")
      .order("full_name"),

    supabase
      .from("opportunities")
      .select("id, title, institution_id")
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, full_name, email, job_title, role")
      .eq("is_active", true)
      .order("full_name"),

    supabase
      .from("tasks")
      .select(`
        id,
        title,
        description,
        task_type,
        priority,
        status,
        institution_id,
        contact_id,
        opportunity_id,
        assigned_to,
        assigned_by,
        due_at,
        completed_at,
        completion_notes,
        blocker_reason,
        created_at
      `)
      .order("created_at", { ascending: false }),
  ]);

  const institutions = institutionsResult.data || [];
  const contacts = contactsResult.data || [];
  const opportunities = opportunitiesResult.data || [];
  const profiles = profilesResult.data || [];
  const tasks = tasksResult.data || [];

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const contactMap = new Map(
    contacts.map((contact) => [contact.id, contact.full_name])
  );

  const opportunityMap = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      opportunity.title,
    ])
  );

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile.full_name ||
        profile.email ||
        "KIPROD Employee",
    ])
  );

  const openTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  );

  const overdueTasks = openTasks.filter(
    (task) =>
      task.due_at &&
      new Date(task.due_at).getTime() < Date.now()
  );

  const myTasks = openTasks.filter(
    (task) => task.assigned_to === user.id
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
              Tasks & Follow-ups
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assign work, monitor deadlines and record completion.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Open Tasks
              </p>

              <p className="mt-1 text-xl font-black">
                {openTasks.length}
              </p>
            </div>

            <div className="rounded-2xl bg-red-600 px-5 py-3 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-red-100">
                Overdue
              </p>

              <p className="mt-1 text-xl font-black">
                {overdueTasks.length}
              </p>
            </div>
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
              My Active Tasks
            </p>

            <p className="mt-3 text-3xl font-black">
              {myTasks.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Team Open Tasks
            </p>

            <p className="mt-3 text-3xl font-black">
              {openTasks.length}
            </p>
          </article>

          <article className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-600">
              Overdue
            </p>

            <p className="mt-3 text-3xl font-black text-red-800">
              {overdueTasks.length}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Completed
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-800">
              {completedTasks.length}
            </p>
          </article>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="bg-slate-950 px-6 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                New Assignment
              </p>

              <h2 className="mt-2 text-xl font-black">
                Create Task
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Assign a follow-up, meeting, proposal or internal action.
              </p>
            </div>

            <form action={createTask} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Task Title *
                </label>

                <input
                  name="title"
                  required
                  placeholder="Example: Send ILCA invitation"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Task Type
                </label>

                <select
                  name="task_type"
                  defaultValue="other"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">Meeting</option>
                  <option value="proposal">Proposal</option>
                  <option value="ilca_follow_up">
                    ILCA Follow-up
                  </option>
                  <option value="icdf_preparation">
                    ICDF Preparation
                  </option>
                  <option value="report">Report</option>
                  <option value="internal">Internal Task</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Priority
                </label>

                <select
                  name="priority"
                  defaultValue="medium"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Responsible Employee *
                </label>

                <select
                  name="assigned_to"
                  required
                  defaultValue={user.id}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name ||
                        profile.email ||
                        "KIPROD Employee"}
                      {profile.job_title
                        ? ` — ${profile.job_title}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Institution
                </label>

                <select
                  name="institution_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="">No institution selected</option>

                  {institutions.map((institution) => (
                    <option
                      key={institution.id}
                      value={institution.id}
                    >
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Contact
                </label>

                <select
                  name="contact_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="">No contact selected</option>

                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} —{" "}
                      {institutionMap.get(contact.institution_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Opportunity
                </label>

                <select
                  name="opportunity_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                >
                  <option value="">No opportunity selected</option>

                  {opportunities.map((opportunity) => (
                    <option
                      key={opportunity.id}
                      value={opportunity.id}
                    >
                      {opportunity.title} —{" "}
                      {institutionMap.get(
                        opportunity.institution_id
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Deadline
                </label>

                <input
                  name="due_at"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe what must be done and the expected result..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              >
                Assign Task
              </button>
            </form>
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-200 px-6 py-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                Execution Tracker
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Team Tasks
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Work assigned to you and the wider partnerships team.
              </p>
            </div>

            {tasksResult.error && (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {tasksResult.error.message}
              </div>
            )}

            {!tasksResult.error && tasks.length === 0 && (
              <div className="px-8 py-24 text-center">
                <p className="text-lg font-black text-slate-800">
                  No tasks assigned
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Create the first task using the assignment form.
                </p>
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-5 bg-slate-50/70 p-6">
                {tasks.map((task) => {
                  const overdue =
                    task.due_at &&
                    task.status !== "completed" &&
                    task.status !== "cancelled" &&
                    new Date(task.due_at).getTime() < Date.now();

                  return (
                    <section
                      key={task.id}
                      className={`rounded-2xl border bg-white p-6 shadow-sm ${
                        overdue
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${priorityClass(
                                task.priority
                              )}`}
                            >
                              {formatLabel(task.priority)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                                task.status
                              )}`}
                            >
                              {formatLabel(task.status)}
                            </span>

                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                              {formatLabel(task.task_type)}
                            </span>

                            {overdue && (
                              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                                Overdue
                              </span>
                            )}
                          </div>

                          <h3 className="mt-4 text-xl font-black">
                            {task.title}
                          </h3>

                          <p className="mt-2 text-sm font-semibold text-slate-600">
                            Assigned to:{" "}
                            {profileMap.get(task.assigned_to) ||
                              "Unknown employee"}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Deadline
                          </p>

                          <p
                            className={`mt-2 text-sm font-bold ${
                              overdue
                                ? "text-red-700"
                                : "text-slate-700"
                            }`}
                          >
                            {formatDate(task.due_at)}
                          </p>
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {task.institution_id && (
                          <Link
                            href={`/institutions/${task.institution_id}`}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                          >
                            Institution:{" "}
                            {institutionMap.get(
                              task.institution_id
                            )}
                          </Link>
                        )}

                        {task.contact_id && (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                            Contact:{" "}
                            {contactMap.get(task.contact_id)}
                          </span>
                        )}

                        {task.opportunity_id && (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                            Opportunity:{" "}
                            {opportunityMap.get(
                              task.opportunity_id
                            )}
                          </span>
                        )}
                      </div>

                      {task.completion_notes && (
                        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Completion Notes
                          </p>

                          <p className="mt-2 text-sm text-emerald-950">
                            {task.completion_notes}
                          </p>
                        </div>
                      )}

                      {task.blocker_reason && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-red-700">
                            Blocker
                          </p>

                          <p className="mt-2 text-sm text-red-950">
                            {task.blocker_reason}
                          </p>
                        </div>
                      )}

                      {task.status !== "completed" &&
                        task.status !== "cancelled" && (
                          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50">
                            <summary className="cursor-pointer px-5 py-4 text-sm font-black text-slate-700">
                              Update Task Status
                            </summary>

                            <form
                              action={updateTaskStatus}
                              className="space-y-4 border-t border-slate-200 p-5"
                            >
                              <input
                                type="hidden"
                                name="task_id"
                                value={task.id}
                              />

                              <select
                                name="status"
                                defaultValue={task.status}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
                              >
                                <option value="not_started">
                                  Not Started
                                </option>
                                <option value="in_progress">
                                  In Progress
                                </option>
                                <option value="completed">
                                  Completed
                                </option>
                                <option value="blocked">
                                  Blocked
                                </option>
                                <option value="cancelled">
                                  Cancelled
                                </option>
                              </select>

                              <textarea
                                name="completion_notes"
                                rows={3}
                                placeholder="Completion notes, results or evidence..."
                                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
                              />

                              <textarea
                                name="blocker_reason"
                                rows={3}
                                placeholder="Explain the blocker when marking the task as blocked..."
                                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
                              />

                              <button
                                type="submit"
                                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                              >
                                Save Task Update
                              </button>
                            </form>
                          </details>
                        )}
                    </section>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}