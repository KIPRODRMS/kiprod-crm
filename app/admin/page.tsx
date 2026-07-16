import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { updateUserAccess } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const tools = [
  {
    title: "SACCO Master Import",
    description:
      "Import and maintain the confirmed SACCO institutional dataset, contacts and historical outreach records.",
    href: "/admin/sacco-import",
    label: "Open SACCO Import",
  },
  {
    title: "Institution Management",
    description:
      "Edit institutional records, classifications, assignments, contacts and engagement history.",
    href: "/admin/institutions",
    label: "Manage Institutions",
  },
  {
    title: "Reports Oversight",
    description:
      "Review daily and weekly reports, delivery gaps, feedback and management-support requests.",
    href: "/reports",
    label: "Open Reports",
  },
  {
    title: "Academy Administration",
    description:
      "Create courses, modules, lessons and assign learning programmes to team members.",
    href: "/academy",
    label: "Open Academy",
  },
  {
    title: "Pipeline Oversight",
    description:
      "Review organisation-wide opportunities, values, ownership, stages and next actions.",
    href: "/opportunities",
    label: "Open Opportunities",
  },
  {
    title: "Management Workspace",
    description:
      "Return to the organisation-wide management dashboard and operational review tools.",
    href: "/management",
    label: "Open Management",
  },
];

function roleLabel(
  role: string | null
) {
  switch (role) {
    case "super_admin":
      return "Super Admin";

    case "management":
      return "Management";

    case "team_lead":
      return "Team Lead";

    default:
      return "Team Member";
  }
}

function roleClasses(
  role: string | null
) {
  switch (role) {
    case "super_admin":
      return "bg-amber-100 text-amber-900";

    case "management":
      return "bg-blue-100 text-blue-800";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const messages = await searchParams;

  const {
    supabase,
    user,
    profile,
  } = await requireSuperAdmin();

  const {
    data: profileData,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        job_title,
        department,
        role,
        is_active,
        created_at
      `
    )
    .order("full_name", {
      ascending: true,
      nullsFirst: false,
    });

  const profiles =
    profileData || [];

  const activeProfiles =
    profiles.filter(
      (account) =>
        account.is_active !== false
    );

  const superAdmins =
    activeProfiles.filter(
      (account) =>
        account.role ===
        "super_admin"
    );

  const managementAccounts =
    activeProfiles.filter(
      (account) =>
        account.role ===
        "management"
    );

  const teamMemberAccounts =
    activeProfiles.filter(
      (account) =>
        ![
          "super_admin",
          "management",
        ].includes(
          account.role || ""
        )
    );

  return (
    <section className="space-y-7">
      <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
              Restricted Administration
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Super Admin Centre
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Full system control for user
              access, institutional data,
              imports, reporting, Academy
              administration and CRM
              governance.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Signed In
            </p>

            <p className="mt-1 font-black text-white">
              {profile.full_name ||
                profile.email ||
                "Super Admin"}
            </p>

            <p className="mt-1 text-xs font-bold text-amber-400">
              Full System Access
            </p>
          </div>
        </div>
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

      {profilesError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load user accounts:{" "}
          {profilesError.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Active Accounts
          </p>

          <p className="mt-2 text-2xl font-black">
            {activeProfiles.length}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Super Admins
          </p>

          <p className="mt-2 text-2xl font-black text-amber-900">
            {superAdmins.length}
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
            Management
          </p>

          <p className="mt-2 text-2xl font-black text-blue-900">
            {managementAccounts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Team Members
          </p>

          <p className="mt-2 text-2xl font-black">
            {teamMemberAccounts.length}
          </p>
        </article>
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

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            User Access Management
          </p>

          <h2 className="mt-2 text-2xl font-black">
            CRM Accounts and Access Levels
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Super Admin gives full system
            access. Management gives
            organisation-wide operational
            visibility. Team Member access
            is limited to assigned accounts,
            tasks, reports and Academy
            enrolments.
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No CRM accounts were found.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {profiles.map((account) => {
              const isCurrentUser =
                account.id === user.id;

              return (
                <section
                  key={account.id}
                  className="grid gap-5 px-6 py-5 xl:grid-cols-[minmax(240px,1fr)_160px_minmax(360px,1.1fr)] xl:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-slate-950">
                        {account.full_name ||
                          account.email ||
                          "Unnamed Account"}
                      </p>

                      {isCurrentUser && (
                        <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                          You
                        </span>
                      )}

                      {account.is_active ===
                        false && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {account.email ||
                        "Email not recorded"}
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-slate-600">
                      {[
                        account.job_title,
                        account.department,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                        "Role details not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      Current Access
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${roleClasses(
                        account.role
                      )}`}
                    >
                      {roleLabel(
                        account.role
                      )}
                    </span>
                  </div>

                  {isCurrentUser ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Your own access cannot
                      be changed here. Another
                      Super Admin must update
                      it.
                    </div>
                  ) : (
                    <form
                      action={
                        updateUserAccess
                      }
                      className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"
                    >
                      <input
                        type="hidden"
                        name="profile_id"
                        value={account.id}
                      />

                      <select
                        name="role"
                        defaultValue={
                          [
                            "super_admin",
                            "management",
                            "employee",
                          ].includes(
                            account.role || ""
                          )
                            ? account.role ||
                              "employee"
                            : "employee"
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
                      >
                        <option value="employee">
                          Team Member
                        </option>

                        <option value="management">
                          Management
                        </option>

                        <option value="super_admin">
                          Super Admin
                        </option>
                      </select>

                      <select
                        name="is_active"
                        defaultValue={
                          account.is_active ===
                          false
                            ? "false"
                            : "true"
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
                      >
                        <option value="true">
                          Active
                        </option>

                        <option value="false">
                          Inactive
                        </option>
                      </select>

                      <button
                        type="submit"
                        className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-black uppercase tracking-wide text-amber-800">
          Full Access Requirement
        </p>

        <h2 className="mt-2 text-xl font-black">
          Joseph Millighan and John Martin
          Ambetsa
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Both accounts should be assigned
          the Super Admin access level. The
          CRM also prevents the final active
          Super Admin from being removed,
          reducing the risk of system
          lockout.
        </p>
      </article>
    </section>
  );
}