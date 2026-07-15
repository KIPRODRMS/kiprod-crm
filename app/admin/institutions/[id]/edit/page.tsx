import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateInstitutionAdmin } from "../../actions";

type EditInstitutionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function localDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500";
const labelClass =
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

export default async function EditInstitutionPage({
  params,
  searchParams,
}: EditInstitutionPageProps) {
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

  const { data: institution, error } = await supabase
    .from("institutions")
    .select(`
      id,
      name,
      institution_type,
      sector,
      segment,
      tier,
      asset_size_billions,
      ceo_name,
      location,
      website,
      email,
      phone,
      source,
      status,
      outreach_status,
      invoice_status,
      registration_status,
      follow_up_owner,
      next_action,
      next_follow_up_at,
      historical_notes
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !institution) {
    notFound();
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, job_title, email, phone, is_primary")
    .eq("institution_id", id)
    .order("full_name");

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Admin Edit
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {institution.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Edit classification, contact channels, outreach status
            and historical information.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/institutions"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-white"
          >
            Back to Admin List
          </Link>
          <Link
            href={`/institutions/${institution.id}`}
            className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950"
          >
            Open CRM Profile
          </Link>
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          action={updateInstitutionAdmin}
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg md:grid-cols-2"
        >
          <input
            type="hidden"
            name="institution_id"
            value={institution.id}
          />

          <div className="md:col-span-2">
            <label className={labelClass}>Institution Name *</label>
            <input
              name="name"
              required
              defaultValue={institution.name}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Sector</label>
            <input
              name="sector"
              defaultValue={institution.sector || ""}
              placeholder="Financial Services"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Segment</label>
            <select
              name="segment"
              defaultValue={institution.segment || ""}
              className={fieldClass}
            >
              <option value="">Select segment</option>
              <option value="SACCO">SACCO</option>
              <option value="Bank">Bank</option>
              <option value="Microfinance">Microfinance</option>
              <option value="PSP / Fintech">PSP / Fintech</option>
              <option value="Forex Bureau">Forex Bureau</option>
              <option value="Insurance">Insurance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Institution Type</label>
            <input
              name="institution_type"
              defaultValue={institution.institution_type || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tier</label>
            <select
              name="tier"
              defaultValue={institution.tier || ""}
              className={fieldClass}
            >
              <option value="">No tier</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
              <option value="Tier 4">Tier 4</option>
              <option value="Tier 5">Tier 5</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Assets (KES Billions)
            </label>
            <input
              name="asset_size_billions"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                institution.asset_size_billions ?? ""
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>CEO Name</label>
            <input
              name="ceo_name"
              defaultValue={institution.ceo_name || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>County / Location</label>
            <input
              name="location"
              defaultValue={institution.location || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>CRM Status</label>
            <select
              name="status"
              defaultValue={institution.status || "prospect"}
              className={fieldClass}
            >
              <option value="prospect">Prospect</option>
              <option value="engaged">Engaged</option>
              <option value="active_opportunity">
                Active Opportunity
              </option>
              <option value="active_partner">
                Active Partner
              </option>
              <option value="deferred">Deferred</option>
              <option value="lost">Lost</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Outreach Status</label>
            <input
              name="outreach_status"
              defaultValue={institution.outreach_status || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Public Phone</label>
            <input
              name="phone"
              defaultValue={institution.phone || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Public Email</label>
            <input
              name="email"
              defaultValue={institution.email || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Website</label>
            <input
              name="website"
              defaultValue={institution.website || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Follow-up Owner</label>
            <input
              name="follow_up_owner"
              defaultValue={institution.follow_up_owner || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Invoice Status</label>
            <input
              name="invoice_status"
              defaultValue={institution.invoice_status || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Registration Status
            </label>
            <input
              name="registration_status"
              defaultValue={
                institution.registration_status || ""
              }
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Next Action</label>
            <textarea
              name="next_action"
              rows={3}
              defaultValue={institution.next_action || ""}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Next Follow-up</label>
            <input
              name="next_follow_up_at"
              type="datetime-local"
              defaultValue={localDateTime(
                institution.next_follow_up_at
              )}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Data Source</label>
            <input
              name="source"
              defaultValue={institution.source || ""}
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Historical Notes</label>
            <textarea
              name="historical_notes"
              rows={8}
              defaultValue={institution.historical_notes || ""}
              className={fieldClass}
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 md:col-span-2"
          >
            Save Institution Changes
          </button>
        </form>

        <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Linked Contacts
            </p>
            <h2 className="mt-1 text-xl font-black">
              {contacts?.length || 0} Contacts
            </h2>
          </div>

          {!contacts || contacts.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No contacts are linked to this institution.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {contacts.map(
                (contact: {
                  id: string;
                  full_name: string;
                  job_title: string | null;
                  is_primary: boolean | null;
                }) => (
                <div key={contact.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {contact.full_name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {contact.job_title || "Role not recorded"}
                      </p>
                    </div>

                    {contact.is_primary && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">
                        Primary
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/contacts/${contact.id}/edit`}
                    className="mt-3 block rounded-lg bg-slate-950 px-3 py-2 text-center text-xs font-black text-white"
                  >
                    Edit Contact
                  </Link>
                </div>
                )
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}