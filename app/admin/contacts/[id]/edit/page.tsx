import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateContactAdmin } from "../../actions";

type EditContactPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500";
const labelClass =
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

export default async function EditContactPage({
  params,
  searchParams,
}: EditContactPageProps) {
  const { id } = await params;
  const messages = await searchParams;
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!["super_admin", "management"].includes(profile?.role || "")) {
    redirect("/");
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .select(`
      id,
      institution_id,
      full_name,
      job_title,
      department,
      email,
      phone,
      whatsapp_number,
      is_primary,
      decision_maker
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !contact) {
    notFound();
  }

  const { data: institution } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("id", contact.institution_id)
    .maybeSingle();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Admin Edit
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {contact.full_name}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {institution?.name || "Institution not found"}
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

      <form
        action={updateContactAdmin}
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:grid-cols-2"
      >
        <input type="hidden" name="contact_id" value={contact.id} />
        <input
          type="hidden"
          name="institution_id"
          value={contact.institution_id}
        />

        <div className="sm:col-span-2">
          <label className={labelClass}>Full Name *</label>
          <input
            name="full_name"
            required
            defaultValue={contact.full_name}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Job Title</label>
          <input
            name="job_title"
            defaultValue={contact.job_title || ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Department</label>
          <input
            name="department"
            defaultValue={contact.department || ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            defaultValue={contact.email || ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            name="phone"
            defaultValue={contact.phone || ""}
            className={fieldClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>WhatsApp</label>
          <input
            name="whatsapp_number"
            defaultValue={contact.whatsapp_number || ""}
            className={fieldClass}
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            name="is_primary"
            defaultChecked={Boolean(contact.is_primary)}
            className="h-4 w-4 accent-amber-500"
          />
          <span className="text-sm font-black">Primary contact</span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            name="decision_maker"
            defaultChecked={Boolean(contact.decision_maker)}
            className="h-4 w-4 accent-amber-500"
          />
          <span className="text-sm font-black">Decision-maker</span>
        </label>

        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 sm:col-span-2"
        >
          Save Contact Changes
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/institutions/${contact.institution_id}/edit`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
        >
          Back to Institution Edit
        </Link>
        <Link
          href={`/contacts/${contact.id}`}
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          Open Contact Profile
        </Link>
      </div>
    </section>
  );
}