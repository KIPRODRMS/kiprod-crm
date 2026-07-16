import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import BulkInstitutionAssignment from "./BulkInstitutionAssignment";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    tier?: string;
    status?: string;
    outreach?: string;
    owner?: string;
    success?: string;
    error?: string;
  }>;
};

type InstitutionRecord = {
  id: string;
  name: string;
  institution_type: string | null;
  segment: string | null;
  tier: string | null;
  location: string | null;
  status: string | null;
  outreach_status: string | null;
  assigned_to: string | null;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

function uniqueValues(
  values: Array<
    string | null | undefined
  >
) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value?.trim())
      )
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );
}

function profileName(
  profile: ProfileRecord
) {
  return (
    profile.full_name ||
    profile.email ||
    "Unnamed Team Member"
  );
}

function formatLabel(
  value: string
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default async function AdminInstitutionsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { supabase } =
    await requireSuperAdmin();

  const [
    institutionResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select(
        `
          id,
          name,
          institution_type,
          segment,
          tier,
          location,
          status,
          outreach_status,
          assigned_to
        `
      )
      .order("name")
      .limit(1000),

    supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          email,
          role,
          is_active
        `
      )
      .order("full_name", {
        ascending: true,
        nullsFirst: false,
      }),
  ]);

  const institutions =
    (institutionResult.data ||
      []) as InstitutionRecord[];

  const profiles =
    (
      (profileResult.data ||
        []) as ProfileRecord[]
    ).filter(
      (profile) =>
        profile.is_active !== false
    );

  const q = String(
    params.q || ""
  ).trim();

  const type = String(
    params.type || ""
  ).trim();

  const tier = String(
    params.tier || ""
  ).trim();

  const status = String(
    params.status || ""
  ).trim();

  const outreach = String(
    params.outreach || ""
  ).trim();

  const owner = String(
    params.owner || ""
  ).trim();

  const terms = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filteredInstitutions =
    institutions.filter(
      (institution) => {
        const searchable = [
          institution.name,
          institution.institution_type,
          institution.segment,
          institution.tier,
          institution.location,
          institution.status,
          institution.outreach_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          terms.length === 0 ||
          terms.every((term) =>
            searchable.includes(term)
          );

        const matchesType =
          !type ||
          institution.segment === type ||
          institution.institution_type ===
            type;

        const matchesOwner =
          !owner ||
          (owner === "unassigned"
            ? !institution.assigned_to
            : institution.assigned_to ===
              owner);

        return (
          matchesSearch &&
          matchesType &&
          (!tier ||
            institution.tier ===
              tier) &&
          (!status ||
            institution.status ===
              status) &&
          (!outreach ||
            institution.outreach_status ===
              outreach) &&
          matchesOwner
        );
      }
    );

  const typeOptions =
    uniqueValues(
      institutions.flatMap(
        (institution) => [
          institution.segment,
          institution.institution_type,
        ]
      )
    );

  const tierOptions =
    uniqueValues(
      institutions.map(
        (institution) =>
          institution.tier
      )
    );

  const statusOptions =
    uniqueValues(
      institutions.map(
        (institution) =>
          institution.status
      )
    );

  const outreachOptions =
    uniqueValues(
      institutions.map(
        (institution) =>
          institution.outreach_status
      )
    );

  const returnParams =
    new URLSearchParams();

  if (q) {
    returnParams.set("q", q);
  }
  if (type) {
    returnParams.set("type", type);
  }
  if (tier) {
    returnParams.set("tier", tier);
  }
  if (status) {
    returnParams.set(
      "status",
      status
    );
  }
  if (outreach) {
    returnParams.set(
      "outreach",
      outreach
    );
  }
  if (owner) {
    returnParams.set(
      "owner",
      owner
    );
  }

  const returnQuery =
    returnParams.toString();

  const returnUrl = returnQuery
    ? `/admin/institutions?${returnQuery}`
    : "/admin/institutions";

  const unassigned =
    institutions.filter(
      (institution) =>
        !institution.assigned_to
    ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Super Admin
          </p>

          <h1 className="mt-2 font-black">
            Institution Assignment
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Filter institutions, select
            multiple accounts and assign
            them in one action.
          </p>
        </div>

        <Link
          href="/institutions"
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-white"
        >
          Open Institution Database
        </Link>
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

      {(institutionResult.error ||
        profileResult.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {institutionResult.error
            ?.message ||
            profileResult.error
              ?.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            All Institutions
          </p>
          <p className="mt-2 text-2xl font-black">
            {institutions.length}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Unassigned
          </p>
          <p className="mt-2 text-2xl font-black">
            {unassigned}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Filtered Results
          </p>
          <p className="mt-2 text-2xl font-black">
            {
              filteredInstitutions.length
            }
          </p>
        </article>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-6"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search institution, location, type, tier or status..."
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm sm:col-span-2 xl:col-span-6"
        />

        <select
          name="type"
          defaultValue={type}
        >
          <option value="">
            All types
          </option>
          {typeOptions.map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            )
          )}
        </select>

        <select
          name="tier"
          defaultValue={tier}
        >
          <option value="">
            All tiers
          </option>
          {tierOptions.map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            )
          )}
        </select>

        <select
          name="status"
          defaultValue={status}
        >
          <option value="">
            All CRM statuses
          </option>
          {statusOptions.map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {formatLabel(value)}
              </option>
            )
          )}
        </select>

        <select
          name="outreach"
          defaultValue={outreach}
        >
          <option value="">
            All outreach statuses
          </option>
          {outreachOptions.map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {formatLabel(value)}
              </option>
            )
          )}
        </select>

        <select
          name="owner"
          defaultValue={owner}
        >
          <option value="">
            All owners
          </option>
          <option value="unassigned">
            Unassigned only
          </option>
          {profiles.map(
            (profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profileName(profile)}
              </option>
            )
          )}
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Filter
          </button>

          <Link
            href="/admin/institutions"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700"
          >
            Clear
          </Link>
        </div>
      </form>

      <BulkInstitutionAssignment
        institutions={
          filteredInstitutions
        }
        profiles={profiles}
        returnUrl={returnUrl}
      />
    </section>
  );
}