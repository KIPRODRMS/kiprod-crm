import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { updateInstitutionAdmin } from "../../actions";
import { assignContactOwner } from "../../../contacts/actions";

type EditInstitutionPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

type TeamProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type ContactRecord = {
  id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean | null;
  assigned_to: string | null;
};

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
  span?: boolean;
};

type SelectOption = {
  value: string;
  label: string;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500";

const labelClass =
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

function localDateTime(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function roleLabel(
  role: string | null
) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "management") {
    return "Management";
  }

  return "Team Member";
}

function InputField({
  label,
  name,
  defaultValue = "",
  type = "text",
  required,
  min,
  step,
  span,
}: FieldProps) {
  return (
    <div
      className={
        span
          ? "md:col-span-2"
          : undefined
      }
    >
      <label className={labelClass}>
        {label}
      </label>

      <input
        name={name}
        type={type}
        required={required}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className={fieldClass}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  span,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: SelectOption[];
  span?: boolean;
}) {
  return (
    <div
      className={
        span
          ? "md:col-span-2"
          : undefined
      }
    >
      <label className={labelClass}>
        {label}
      </label>

      <select
        name={name}
        defaultValue={defaultValue}
        className={fieldClass}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <div className="md:col-span-2">
      <label className={labelClass}>
        {label}
      </label>

      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={fieldClass}
      />
    </div>
  );
}

export default async function EditInstitutionPage({
  params,
  searchParams,
}: EditInstitutionPageProps) {
  const { id } = await params;
  const messages = await searchParams;

  const { supabase } =
    await requireSuperAdmin();

  const [
    institutionResult,
    contactsResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select(
        `
          id,
          name,
          assigned_to,
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
        `
      )
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("contacts")
      .select(
        `
          id,
          full_name,
          job_title,
          email,
          phone,
          is_primary,
          assigned_to
        `
      )
      .eq("institution_id", id)
      .order("is_primary", {
        ascending: false,
      })
      .order("full_name"),

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

  const institution =
    institutionResult.data;

  if (
    institutionResult.error ||
    !institution
  ) {
    notFound();
  }

  const contacts =
    (contactsResult.data ||
      []) as ContactRecord[];

  const profiles = (
    (profilesResult.data ||
      []) as TeamProfile[]
  ).filter(
    (profile) =>
      profile.is_active !== false
  );

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile.full_name ||
        profile.email ||
        "Unnamed Team Member",
    ])
  );

  const accountOwner =
    institution.assigned_to
      ? profileMap.get(
          institution.assigned_to
        ) || "Unknown Team Member"
      : "Unassigned";

  const ownerOptions: SelectOption[] =
    [
      {
        value: "",
        label: "Unassigned",
      },

      ...profiles.map((profile) => ({
        value: profile.id,
        label: `${
          profile.full_name ||
          profile.email ||
          "Unnamed Team Member"
        } — ${roleLabel(
          profile.role
        )}`,
      })),
    ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Account Administration
          </p>

          <h1 className="mt-2 font-black">
            {institution.name}
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Assign the full institution
            or allocate individual
            contacts separately.
          </p>

          <p className="mt-3 text-xs font-bold text-amber-300">
            Current account owner:{" "}
            {accountOwner}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/institutions"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black text-white"
          >
            Back to List
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          action={
            updateInstitutionAdmin
          }
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg md:grid-cols-2"
        >
          <input
            type="hidden"
            name="institution_id"
            value={institution.id}
          />

          <InputField
            label="Institution Name *"
            name="name"
            required
            span
            defaultValue={
              institution.name
            }
          />

          <SelectField
            label="Assigned Account Owner"
            name="assigned_to"
            span
            defaultValue={
              institution.assigned_to ||
              ""
            }
            options={ownerOptions}
          />

          <InputField
            label="Sector"
            name="sector"
            defaultValue={
              institution.sector || ""
            }
          />

          <SelectField
            label="Segment"
            name="segment"
            defaultValue={
              institution.segment || ""
            }
            options={[
              {
                value: "",
                label:
                  "Select segment",
              },
              {
                value: "SACCO",
                label: "SACCO",
              },
              {
                value: "Bank",
                label: "Bank",
              },
              {
                value: "Microfinance",
                label:
                  "Microfinance",
              },
              {
                value:
                  "PSP / Fintech",
                label:
                  "PSP / Fintech",
              },
              {
                value:
                  "Forex Bureau",
                label:
                  "Forex Bureau",
              },
              {
                value: "Insurance",
                label: "Insurance",
              },
              {
                value: "Other",
                label: "Other",
              },
            ]}
          />

          <InputField
            label="Institution Type"
            name="institution_type"
            defaultValue={
              institution.institution_type ||
              ""
            }
          />

          <SelectField
            label="Tier"
            name="tier"
            defaultValue={
              institution.tier || ""
            }
            options={[
              {
                value: "",
                label: "No tier",
              },
              {
                value: "Tier 1",
                label: "Tier 1",
              },
              {
                value: "Tier 2",
                label: "Tier 2",
              },
              {
                value: "Tier 3",
                label: "Tier 3",
              },
              {
                value: "Tier 4",
                label: "Tier 4",
              },
              {
                value: "Tier 5",
                label: "Tier 5",
              },
            ]}
          />

          <InputField
            label="Assets (KES Billions)"
            name="asset_size_billions"
            type="number"
            min="0"
            step="0.01"
            defaultValue={String(
              institution.asset_size_billions ??
                ""
            )}
          />

          <InputField
            label="CEO Name"
            name="ceo_name"
            defaultValue={
              institution.ceo_name ||
              ""
            }
          />

          <InputField
            label="County / Location"
            name="location"
            defaultValue={
              institution.location ||
              ""
            }
          />

          <SelectField
            label="CRM Status"
            name="status"
            defaultValue={
              institution.status ||
              "prospect"
            }
            options={[
              {
                value: "prospect",
                label: "Prospect",
              },
              {
                value: "engaged",
                label: "Engaged",
              },
              {
                value:
                  "active_opportunity",
                label:
                  "Active Opportunity",
              },
              {
                value:
                  "active_partner",
                label:
                  "Active Partner",
              },
              {
                value: "deferred",
                label: "Deferred",
              },
              {
                value: "lost",
                label: "Lost",
              },
              {
                value: "inactive",
                label: "Inactive",
              },
            ]}
          />

          <InputField
            label="Outreach Status"
            name="outreach_status"
            defaultValue={
              institution.outreach_status ||
              ""
            }
          />

          <InputField
            label="Public Phone"
            name="phone"
            defaultValue={
              institution.phone || ""
            }
          />

          <InputField
            label="Public Email"
            name="email"
            type="email"
            defaultValue={
              institution.email || ""
            }
          />

          <InputField
            label="Website"
            name="website"
            defaultValue={
              institution.website || ""
            }
          />

          <InputField
            label="Follow-up Owner"
            name="follow_up_owner"
            defaultValue={
              institution.follow_up_owner ||
              ""
            }
          />

          <InputField
            label="Invoice Status"
            name="invoice_status"
            defaultValue={
              institution.invoice_status ||
              ""
            }
          />

          <InputField
            label="Registration Status"
            name="registration_status"
            defaultValue={
              institution.registration_status ||
              ""
            }
          />

          <InputField
            label="Next Follow-up"
            name="next_follow_up_at"
            type="datetime-local"
            defaultValue={localDateTime(
              institution.next_follow_up_at
            )}
          />

          <InputField
            label="Data Source"
            name="source"
            defaultValue={
              institution.source || ""
            }
          />

          <TextareaField
            label="Next Action"
            name="next_action"
            rows={3}
            defaultValue={
              institution.next_action ||
              ""
            }
          />

          <TextareaField
            label="Historical Notes"
            name="historical_notes"
            rows={7}
            defaultValue={
              institution.historical_notes ||
              ""
            }
          />

          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 md:col-span-2"
          >
            Save Institution and
            Assignment
          </button>
        </form>

        <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Linked Contacts
            </p>

            <h2 className="mt-1 font-black">
              {contacts.length} Contacts
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              The account owner sees
              every contact automatically.
              A direct owner can also be
              assigned to one contact.
            </p>
          </div>

          {contacts.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No contacts are linked to
              this institution.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {contacts.map(
                (contact) => {
                  const directOwner =
                    contact.assigned_to
                      ? profileMap.get(
                          contact.assigned_to
                        ) ||
                        "Unknown Team Member"
                      : null;

                  return (
                    <section
                      key={contact.id}
                      className="space-y-4 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {
                              contact.full_name
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {contact.job_title ||
                              "Role not recorded"}
                          </p>

                          <p className="mt-2 text-[11px] font-bold text-slate-600">
                            {directOwner
                              ? `Direct owner: ${directOwner}`
                              : institution.assigned_to
                                ? `Inherited through account: ${accountOwner}`
                                : "Currently unassigned"}
                          </p>
                        </div>

                        {contact.is_primary && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">
                            Primary
                          </span>
                        )}
                      </div>

                      <form
                        action={
                          assignContactOwner
                        }
                        className="space-y-2"
                      >
                        <input
                          type="hidden"
                          name="contact_id"
                          value={contact.id}
                        />

                        <input
                          type="hidden"
                          name="institution_id"
                          value={
                            institution.id
                          }
                        />

                        <select
                          name="assigned_to"
                          defaultValue={
                            contact.assigned_to ||
                            ""
                          }
                          className={fieldClass}
                        >
                          {ownerOptions.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="submit"
                          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950"
                        >
                          Save Contact Owner
                        </button>
                      </form>

                      <Link
                        href={`/admin/contacts/${contact.id}/edit`}
                        className="block rounded-lg bg-slate-950 px-3 py-2 text-center text-xs font-black text-white"
                      >
                        Edit Contact Details
                      </Link>
                    </section>
                  );
                }
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}