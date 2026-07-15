import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const tools = [
  {
    title: "SACCO Master Import",
    description:
      "Import the confirmed 174 SACCO institutions, contacts and historical outreach records.",
    href: "/admin/sacco-import",
    label: "Open SACCO Import",
  },
  {
    title: "Institution Management",
    description:
      "Search, filter and edit institutional records, tiers, contacts and follow-ups.",
    href: "/admin/institutions",
    label: "Manage Institutions",
  },
  {
    title: "Reports Review",
    description:
      "Review daily and weekly staff reports and monitor delivery.",
    href: "/reports",
    label: "Open Reports",
  },
  {
    title: "Academy Administration",
    description:
      "Create courses, modules, lessons and staff enrolments.",
    href: "/academy",
    label: "Open Academy",
  },
  {
    title: "Pipeline Oversight",
    description:
      "Monitor active opportunities, value and engagement stages.",
    href: "/opportunities",
    label: "Open Opportunities",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!["super_admin", "management"].includes(profile?.role || "")) {
    redirect("/");
  }

  return (
    <section className="space-y-7">
      <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Restricted Administration
        </p>
        <h1 className="mt-2 text-3xl font-black">
          Super Admin Centre
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Management controls for KIPROD CRM operations, reporting,
          institutional data and internal capability development.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="flex min-h-56 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
          >
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Admin Tool
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

      <article className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
          Next Administration Layer
        </p>
        <h2 className="mt-2 text-xl font-black">
          User and Role Management
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          The next control will create employee accounts, assign roles,
          deactivate users and control management-only access.
        </p>
      </article>
    </section>
  );
}