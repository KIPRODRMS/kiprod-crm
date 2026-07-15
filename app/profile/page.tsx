import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ProfilePage() {
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
    .select("full_name, email, job_title, department, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const details = [
    ["Full name", profile?.full_name || "Not recorded"],
    ["Email address", profile?.email || user.email || "Not recorded"],
    ["Job title", profile?.job_title || "Not recorded"],
    ["Department", profile?.department || "Not recorded"],
    ["System role", formatLabel(profile?.role || null)],
    ["Account status", profile?.is_active === false ? "Inactive" : "Active"],
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-black">My Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Review your KIPROD CRM account, role and access information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">Profile Information</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-2 px-6 py-5 sm:grid-cols-[190px_1fr]"
              >
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
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
              Update the password used to access the KIPROD CRM.
            </p>
          </Link>

          {["super_admin", "management"].includes(profile?.role || "") && (
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
                Open management controls and system administration tools.
              </p>
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}

