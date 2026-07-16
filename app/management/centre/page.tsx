import Link from "next/link";
import { requireManagement } from "@/lib/auth";

const managementTools = [
  {
    title: "Team Reports",
    description:
      "Review daily and weekly reports, missing submissions, blockers and requests for management support.",
    href: "/reports",
    label: "Review Reports",
  },
  {
    title: "Institutional Follow-ups",
    description:
      "Review organisation-wide next actions, overdue follow-ups and institutional engagement progress.",
    href: "/institutions",
    label: "Review Institutions",
  },
  {
    title: "Team Tasks",
    description:
      "Review assigned work, overdue actions, priority tasks and completion status across the team.",
    href: "/tasks",
    label: "Review Tasks",
  },
  {
    title: "Pipeline Performance",
    description:
      "Review opportunities, pipeline value, stages, next actions and conversion activity.",
    href: "/opportunities",
    label: "Review Pipeline",
  },
  {
    title: "Institutional Contacts",
    description:
      "Access decision-makers, primary contacts and relationship information across all institutions.",
    href: "/contacts",
    label: "Review Contacts",
  },
  {
    title: "KIPROD Academy",
    description:
      "Review internal learning programmes, team enrolments and capability-development progress.",
    href: "/academy",
    label: "Open Academy",
  },
];

export default async function ManagementCentrePage() {
  const { accessLevel } =
    await requireManagement();

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Management Oversight
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Management Centre
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Organisation-wide review tools
          for institutional engagement,
          pipeline management, reporting,
          execution and team capability.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {managementTools.map((tool) => (
          <article
            key={tool.title}
            className="flex min-h-52 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
          >
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Management Tool
            </p>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              {tool.title}
            </h2>

            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
              {tool.description}
            </p>

            <Link
              href={tool.href}
              className="mt-5 inline-flex justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              {tool.label}
            </Link>
          </article>
        ))}
      </div>

      {accessLevel === "super_admin" && (
        <article className="rounded-3xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">
            System Administration
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Super Admin controls are
                kept separate
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                User access, permissions,
                imports and sensitive system
                controls remain inside the
                Super Admin Centre.
              </p>
            </div>

            <Link
              href="/admin"
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Open Super Admin Centre
            </Link>
          </div>
        </article>
      )}
    </section>
  );
}