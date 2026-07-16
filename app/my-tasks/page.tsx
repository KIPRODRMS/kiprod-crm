import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";
import { updateMyTaskStatus } from "./actions";

type MyTasksPageProps = {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    success?: string;
    error?: string;
  }>;
};

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
    return "No deadline";
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

function isOverdue({
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

function getPriorityClasses(
  priority: string | null
) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800";

    case "high":
      return "bg-orange-100 text-orange-800";

    case "medium":
      return "bg-amber-100 text-amber-800";

    case "low":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusClasses(
  status: string | null
) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";

    case "in_progress":
      return "bg-blue-100 text-blue-800";

    case "cancelled":
      return "bg-slate-200 text-slate-700";

    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default async function MyTasksPage({
  searchParams,
}: MyTasksPageProps) {
  const params = await searchParams;

  const {
    supabase,
    user,
  } = await requireTeamMember();

  const selectedStatus = String(
    params.status || ""
  ).trim();

  const selectedPriority = String(
    params.priority || ""
  ).trim();

  let tasksQuery = supabase
    .from("tasks")
    .select(
      `
        id,
        title,
        description,
        status,
        priority,
        institution_id,
        opportunity_id,
        due_at,
        completed_at,
        created_at
      `
    )
    .eq("assigned_to", user.id)
    .order("due_at", {
      ascending: true,
      nullsFirst: false,
    });

  if (selectedStatus) {
    tasksQuery = tasksQuery.eq(
      "status",
      selectedStatus
    );
  }

  if (selectedPriority) {
    tasksQuery = tasksQuery.eq(
      "priority",
      selectedPriority
    );
  }

  const [
    tasksResult,
    institutionsResult,
    opportunitiesResult,
  ] = await Promise.all([
    tasksQuery,

    supabase
      .from("institutions")
      .select("id, name")
      .eq("assigned_to", user.id),

    supabase
      .from("opportunities")
      .select("id, title")
      .eq("assigned_to", user.id),
  ]);

  const tasks =
    tasksResult.data || [];

  const institutions =
    institutionsResult.data || [];

  const opportunities =
    opportunitiesResult.data || [];

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const opportunityMap = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      opportunity.title,
    ])
  );

  const pendingTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  const overdueTasks = tasks.filter(
    (task) =>
      isOverdue({
        dueAt: task.due_at,
        status: task.status,
      })
  );

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "completed"
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Tasks
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Review your assigned work,
          deadlines and follow-up actions,
          then update progress directly.
        </p>
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

      {tasksResult.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load your tasks:{" "}
          {tasksResult.error.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            All Tasks
          </p>

          <p className="mt-2 text-2xl font-black">
            {tasks.length}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Pending
          </p>

          <p className="mt-2 text-2xl font-black text-amber-900">
            {pendingTasks.length}
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
            Overdue
          </p>

          <p
            className={`mt-2 text-2xl font-black ${
              overdueTasks.length > 0
                ? "text-red-800"
                : "text-slate-950"
            }`}
          >
            {overdueTasks.length}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Completed
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-900">
            {completedTasks.length}
          </p>
        </article>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"
      >
        <select
          name="status"
          defaultValue={selectedStatus}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">
            All statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <select
          name="priority"
          defaultValue={
            selectedPriority
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">
            All priorities
          </option>

          <option value="urgent">
            Urgent
          </option>

          <option value="high">
            High
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="low">
            Low
          </option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Filter
        </button>
      </form>

      {!tasksResult.error &&
      tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-black text-slate-800">
            No tasks found
          </p>

          <p className="mt-2 text-sm text-slate-500">
            There are no tasks matching
            your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const overdue = isOverdue({
              dueAt: task.due_at,
              status: task.status,
            });

            const institutionName =
              task.institution_id
                ? institutionMap.get(
                    task.institution_id
                  )
                : null;

            const opportunityTitle =
              task.opportunity_id
                ? opportunityMap.get(
                    task.opportunity_id
                  )
                : null;

            return (
              <article
                key={task.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm ${
                  overdue
                    ? "border-red-200"
                    : "border-slate-200"
                }`}
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${getPriorityClasses(
                          task.priority
                        )}`}
                      >
                        {formatLabel(
                          task.priority
                        )}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusClasses(
                          task.status
                        )}`}
                      >
                        {formatLabel(
                          task.status
                        )}
                      </span>

                      {overdue && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                          Overdue
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-black text-slate-950">
                      {task.title}
                    </h2>

                    {task.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <p>
                        <span className="font-black text-slate-700">
                          Deadline:
                        </span>{" "}
                        {formatDateTime(
                          task.due_at
                        )}
                      </p>

                      {institutionName &&
                        task.institution_id && (
                          <p>
                            <span className="font-black text-slate-700">
                              Institution:
                            </span>{" "}
                            <Link
                              href={`/my-institutions/${task.institution_id}`}
                              className="font-black text-amber-700 hover:text-amber-600"
                            >
                              {
                                institutionName
                              }
                            </Link>
                          </p>
                        )}

                      {opportunityTitle && (
                        <p>
                          <span className="font-black text-slate-700">
                            Opportunity:
                          </span>{" "}
                          {opportunityTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <form
                    action={
                      updateMyTaskStatus
                    }
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <input
                      type="hidden"
                      name="task_id"
                      value={task.id}
                    />

                    <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Update Progress
                    </label>

                    <select
                      name="status"
                      defaultValue={
                        task.status ||
                        "pending"
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                    >
                      Save Status
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}