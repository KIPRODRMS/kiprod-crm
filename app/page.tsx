import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Institutions", href: "/institutions" },
  { label: "Contacts", href: "/contacts" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Tasks", href: "/tasks" },
  { label: "Daily & Weekly Reports", href: "/reports" },
  { label: "KIPROD Academy", href: "/academy" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";

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

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [
    profileResult,
    institutionsResult,
    opportunitiesResult,
    tasksResult,
    stagesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, job_title, department, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("institutions")
      .select(`
        id,
        name,
        status,
        next_action,
        next_follow_up_at,
        created_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("opportunities")
      .select(`
        id,
        institution_id,
        stage_id,
        title,
        estimated_value,
        probability,
        status,
        next_action,
        next_follow_up_at,
        created_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("tasks")
      .select(`
        id,
        title,
        status,
        priority,
        assigned_to,
        institution_id,
        due_at,
        created_at
      `)
      .order("due_at", { ascending: true, nullsFirst: false }),

    supabase
      .from("pipeline_stages")
      .select("id, stage_name"),
  ]);

  const profile = profileResult.data;
  const institutions = institutionsResult.data || [];
  const opportunities = opportunitiesResult.data || [];
  const tasks = tasksResult.data || [];
  const stages = stagesResult.data || [];

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "KIPROD User";

  const role = profile?.role || "partnership_officer";

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  const stageMap = new Map(
    stages.map((stage) => [stage.id, stage.stage_name])
  );

  const activeInstitutions = institutions.filter(
    (institution) =>
      institution.status !== "lost" &&
      institution.status !== "inactive"
  );

  const openOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === "open"
  );

  const pipelineValue = openOpportunities.reduce(
    (total, opportunity) =>
      total + Number(opportunity.estimated_value || 0),
    0
  );

  const openTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled"
  );

  const now = new Date();

  const followUpsDue = openTasks.filter(
    (task) =>
      task.due_at &&
      new Date(task.due_at).getTime() <= now.getTime()
  );

  const myTasks = openTasks
    .filter((task) => task.assigned_to === user.id)
    .slice(0, 5);

  const recentOpportunities = openOpportunities.slice(0, 5);

  const metrics = [
    {
      label: "Active Institutions",
      value: String(activeInstitutions.length),
      detail: `${institutions.length} total institutions`,
    },
    {
      label: "Open Opportunities",
      value: String(openOpportunities.length),
      detail: "Current institutional opportunities",
    },
    {
      label: "Follow-ups Due",
      value: String(followUpsDue.length),
      detail: "Overdue or due now",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      detail: "Total value of open opportunities",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col bg-slate-950 text-white lg:flex">
          <div className="border-b border-slate-800 px-7 py-7">
            <p className="text-sm font-black tracking-[0.3em] text-amber-500">
              KIPROD
            </p>

            <h1 className="mt-3 text-xl font-bold">
              Institutional Growth Hub
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Partnerships and Acquisition CRM
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  item.href === "/"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-800 px-6 py-5">
            <p className="text-sm font-bold">{displayName}</p>

            <p className="mt-1 text-xs capitalize text-slate-400">
              {formatLabel(role)}
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  KIPROD Institutional Growth Hub
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Welcome, {displayName}
                </h2>
              </div>

              <div className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">
                {formatLabel(role)}
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-10">
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-500">
                    {metric.label}
                  </p>

                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {metric.value}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {metric.detail}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-black">
                      Institutional Pipeline
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Current opportunities across the KIPROD pipeline.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/institutions#add-institution"
                      className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                    >
                      Add Institution
                    </Link>

                    <Link
                      href="/institutions/import"
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Import CSV
                    </Link>
                  </div>
                </div>

                {recentOpportunities.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="font-bold text-slate-700">
                      No active opportunities
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Add an institution and create its first opportunity.
                    </p>

                    <Link
                      href="/opportunities"
                      className="mt-5 inline-block rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950"
                    >
                      Create Opportunity
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {recentOpportunities.map((opportunity) => (
                      <Link
                        key={opportunity.id}
                        href="/opportunities"
                        className="block px-6 py-5 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <h4 className="font-black text-slate-950">
                              {opportunity.title}
                            </h4>

                            <p className="mt-1 text-sm font-semibold text-amber-700">
                              {institutionMap.get(
                                opportunity.institution_id
                              ) || "Unknown Institution"}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              {stageMap.get(opportunity.stage_id) ||
                                "Pipeline stage not recorded"}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="font-black text-slate-950">
                              {formatCurrency(
                                Number(
                                  opportunity.estimated_value || 0
                                )
                              )}
                            </p>

                            <p className="mt-1 text-xs font-bold text-slate-400">
                              {opportunity.probability}% probability
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-200 px-6 py-4">
                  <Link
                    href="/opportunities"
                    className="text-sm font-black text-amber-700 hover:text-amber-600"
                  >
                    View all opportunities →
                  </Link>
                </div>
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h3 className="text-lg font-black">
                    Today&apos;s Priorities
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Tasks assigned to you.
                  </p>
                </div>

                {myTasks.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No active tasks assigned
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {myTasks.map((task) => (
                      <Link
                        key={task.id}
                        href="/tasks"
                        className="block px-6 py-5 transition hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">
                              {task.title}
                            </p>

                            {task.institution_id && (
                              <p className="mt-1 text-xs text-slate-500">
                                {institutionMap.get(
                                  task.institution_id
                                )}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black capitalize text-amber-800">
                            {formatLabel(task.priority)}
                          </span>
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-400">
                          {formatDate(task.due_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-200 px-6 py-4">
                  <Link
                    href="/tasks"
                    className="text-sm font-black text-amber-700 hover:text-amber-600"
                  >
                    View all tasks →
                  </Link>
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-6 md:grid-cols-2">
              <Link
                href="/reports"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  Reporting
                </p>

                <h3 className="mt-3 text-xl font-black">
                  Daily & Weekly Reports
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Submit work updates, achievements, pipeline progress,
                  challenges and support requirements.
                </p>

                <p className="mt-5 text-sm font-black text-amber-700">
                  Open Reports →
                </p>
              </Link>

              <Link
                href="/academy"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  Learning
                </p>

                <h3 className="mt-3 text-xl font-black">
                  KIPROD Academy
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Access KIPROD courses, lessons, internal knowledge and
                  employee learning progress.
                </p>

                <p className="mt-5 text-sm font-black text-amber-700">
                  Open Academy →
                </p>
              </Link>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}