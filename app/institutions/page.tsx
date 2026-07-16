import Link from "next/link";
import { requireManagement } from "@/lib/auth";
import InstitutionDirectory from "./InstitutionDirectory";
import { createInstitution } from "./actions";

type InstitutionsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

type InstitutionRecord = {
  id: string;
  name: string;
  institution_type: string | null;
  segment: string | null;
  sector: string | null;
  tier: string | null;
  asset_size_billions: number | null;
  ceo_name: string | null;
  location: string | null;
  status: string | null;
  outreach_status: string | null;
  next_action: string | null;
  next_follow_up_at: string | null;
  created_at: string | null;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500";

const labelClass =
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

export default async function InstitutionsPage({
  searchParams,
}: InstitutionsPageProps) {
  const messages = await searchParams;
  const { supabase, accessLevel } =
    await requireManagement();

  const { data, error } = await supabase
    .from("institutions")
    .select(
      `
        id,
        name,
        institution_type,
        segment,
        sector,
        tier,
        asset_size_billions,
        ceo_name,
        location,
        status,
        outreach_status,
        next_action,
        next_follow_up_at,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(1000);

  const institutions =
    (data || []) as InstitutionRecord[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Institutional Database
          </p>

          <h1 className="mt-2 font-black">
            Institutions
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Search and filter institutional
            accounts by type, tier, CRM status,
            outreach status, location and
            follow-up activity.
          </p>
        </div>

        {accessLevel === "super_admin" && (
          <Link
            href="/admin/institutions"
            className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950"
          >
            Bulk Assign Institutions
          </Link>
        )}
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

      <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg xl:open:block">
          <summary className="cursor-pointer font-black text-slate-950">
            Add Institution
          </summary>

          <form
            action={createInstitution}
            className="mt-5 space-y-4"
          >
            <div>
              <label className={labelClass}>
                Institution Name *
              </label>
              <input
                name="name"
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Institution Type
              </label>
              <select
                name="institution_type"
                defaultValue=""
                className={fieldClass}
              >
                <option value="">
                  Select type
                </option>
                <option value="SACCO">
                  SACCO
                </option>
                <option value="Bank">
                  Bank
                </option>
                <option value="Microfinance Institution">
                  Microfinance Institution
                </option>
                <option value="Insurance Company">
                  Insurance Company
                </option>
                <option value="Corporate">
                  Corporate
                </option>
                <option value="Government Institution">
                  Government Institution
                </option>
                <option value="NGO">
                  NGO
                </option>
                <option value="Training Partner">
                  Training Partner
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Sector
              </label>
              <input
                name="sector"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Location
              </label>
              <input
                name="location"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                General Email
              </label>
              <input
                name="email"
                type="email"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Phone
              </label>
              <input
                name="phone"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Website
              </label>
              <input
                name="website"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Lead Source
              </label>
              <select
                name="source"
                defaultValue=""
                className={fieldClass}
              >
                <option value="">
                  Select source
                </option>
                <option value="Referral">
                  Referral
                </option>
                <option value="Cold Outreach">
                  Cold Outreach
                </option>
                <option value="Website">
                  Website
                </option>
                <option value="Event">
                  Event
                </option>
                <option value="Existing Relationship">
                  Existing Relationship
                </option>
                <option value="Social Media">
                  Social Media
                </option>
                <option value="Tender or RFP">
                  Tender or RFP
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                CRM Status
              </label>
              <select
                name="status"
                defaultValue="prospect"
                className={fieldClass}
              >
                <option value="prospect">
                  Prospect
                </option>
                <option value="engaged">
                  Engaged
                </option>
                <option value="active_opportunity">
                  Active Opportunity
                </option>
                <option value="active_partner">
                  Active Partner
                </option>
                <option value="deferred">
                  Deferred
                </option>
                <option value="lost">
                  Lost
                </option>
                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Next Action
              </label>
              <textarea
                name="next_action"
                rows={3}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Follow-up Date
              </label>
              <input
                name="next_follow_up_at"
                type="datetime-local"
                className={fieldClass}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950"
            >
              Save Institution
            </button>
          </form>
        </details>

        <InstitutionDirectory
          institutions={institutions}
          errorMessage={
            error?.message || null
          }
        />
      </div>
    </section>
  );
}