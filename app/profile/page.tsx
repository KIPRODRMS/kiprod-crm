import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  formatRoleLabel,
  getDashboardPath,
} from "@/lib/roles";

function getAccessDescription(
  accessLevel:
    | "team_member"
    | "management"
    | "super_admin"
) {
  if (accessLevel === "super_admin") {
    return "Full CRM access, including system administration, user access, imports and organisation-wide management.";
  }

  if (accessLevel === "management") {
    return "Organisation-wide access to institutions, contacts, opportunities, tasks, reports and Academy oversight.";
  }

  return "Access to your assigned institutions, contacts, opportunities, tasks, reports and Academy programmes.";
}

function getAccessBadgeClasses(
  accessLevel:
    | "team_member"
    | "management"
    | "super_admin"
) {
  if (accessLevel === "super_admin") {
    return "bg-amber-100 text-amber-900";
  }

  if (accessLevel === "management") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function ProfilePage() {
  const {
    profile,
    user,
    accessLevel,
  } = await requireUser();

  const dashboardPath =
    getDashboardPath(profile.role);

  const details = [
    {
      label: "Full Name",
      value:
        profile.full_name ||
        "Not recorded",
    },
    {
      label: "Email Address",
      value:
        profile.email ||
        user.email ||
        "Not recorded",
    },
    {
      label: "Job Title",
      value:
        profile.job_title ||
        "Not recorded",
    },
    {
      label: "Department",
      value:
        profile.department ||
        "Not recorded",
    },
    {
      label: "Access Level",
      value: formatRoleLabel(
        profile.role
      ),
    },
    {
      label: "Account Status",
      value:
        profile.is_active === false
          ? "Inactive"
          : "Active",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Profile
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Review your KIPROD CRM
          account information, access
          level and security settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your personal and
              organisational CRM details.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="grid gap-2 px-6 py-5 sm:grid-cols-[190px_1fr]"
              >
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {detail.label}
                </p>

                <p className="font-bold text-slate-800">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              CRM Access
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${getAccessBadgeClasses(
                accessLevel
              )}`}
            >
              {formatRoleLabel(
                profile.role
              )}
            </span>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {getAccessDescription(
                accessLevel
              )}
            </p>

            <Link
              href={dashboardPath}
              className="mt-5 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
            >
              Open My Dashboard
            </Link>
          </article>

          <Link
            href="/change-password"
            className="block rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition hover:border-amber-400"
          >
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Security
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Change Password
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update the password used
              to access your KIPROD CRM
              account.
            </p>
          </Link>

          {accessLevel !==
            "team_member" && (
            <Link
              href="/management"
              className="block rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm transition hover:border-blue-400"
            >
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Management
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Management Workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open organisation-wide
                pipeline, reporting and
                execution oversight.
              </p>
            </Link>
          )}

          {accessLevel ===
            "super_admin" && (
            <Link
              href="/admin"
              className="block rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm transition hover:border-amber-500"
            >
              <p className="text-xs font-black uppercase tracking-wide text-amber-400">
                Administration
              </p>

              <h2 className="mt-2 text-xl font-black">
                Super Admin Centre
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Manage user access,
                institutional data,
                imports and sensitive
                system controls.
              </p>
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}