import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";
import CopyContactButton from "./CopyContactButton";

type MyContactsPageProps = {
  searchParams: Promise<{
    q?: string;
    institution?: string;
  }>;
};

type InstitutionRecord = {
  id: string;
  name: string;
};

type ContactRecord = {
  id: string;
  institution_id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  is_primary: boolean | null;
  decision_maker: boolean | null;
  assigned_to: string | null;
};

function normaliseWhatsApp(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const digits = value.replace(
    /[^\d]/g,
    ""
  );

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  if (
    (digits.startsWith("7") ||
      digits.startsWith("1")) &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return digits;
}

function matchesSearch({
  contact,
  institutionName,
  search,
}: {
  contact: ContactRecord;
  institutionName: string;
  search: string;
}) {
  if (!search) {
    return true;
  }

  const content = [
    contact.full_name,
    contact.job_title,
    contact.department,
    contact.email,
    contact.phone,
    contact.whatsapp_number,
    institutionName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) =>
      content.includes(term)
    );
}

export default async function MyContactsPage({
  searchParams,
}: MyContactsPageProps) {
  const params = await searchParams;

  const { supabase, user } =
    await requireTeamMember();

  const search = String(
    params.q || ""
  ).trim();

  const selectedInstitution =
    String(
      params.institution || ""
    ).trim();

  const {
    data: assignedInstitutionData,
    error: assignedInstitutionError,
  } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("assigned_to", user.id)
    .order("name");

  const assignedInstitutions =
    (assignedInstitutionData ||
      []) as InstitutionRecord[];

  const assignedInstitutionIds =
    assignedInstitutions.map(
      (institution) =>
        institution.id
    );

  const directResult =
    await supabase
      .from("contacts")
      .select(
        `
          id,
          institution_id,
          full_name,
          job_title,
          department,
          email,
          phone,
          whatsapp_number,
          is_primary,
          decision_maker,
          assigned_to
        `
      )
      .eq("assigned_to", user.id)
      .order("full_name");

  let inheritedContacts:
    ContactRecord[] = [];

  let inheritedError:
    | string
    | null = null;

  if (
    assignedInstitutionIds.length >
    0
  ) {
    const inheritedResult =
      await supabase
        .from("contacts")
        .select(
          `
            id,
            institution_id,
            full_name,
            job_title,
            department,
            email,
            phone,
            whatsapp_number,
            is_primary,
            decision_maker,
            assigned_to
          `
        )
        .in(
          "institution_id",
          assignedInstitutionIds
        )
        .order("is_primary", {
          ascending: false,
        })
        .order("full_name");

    inheritedContacts =
      (inheritedResult.data ||
        []) as ContactRecord[];

    inheritedError =
      inheritedResult.error
        ?.message || null;
  }

  const directContacts =
    (directResult.data ||
      []) as ContactRecord[];

  const contactMap =
    new Map<string, ContactRecord>();

  for (const contact of [
    ...inheritedContacts,
    ...directContacts,
  ]) {
    contactMap.set(
      contact.id,
      contact
    );
  }

  const contacts = Array.from(
    contactMap.values()
  );

  const relevantInstitutionIds =
    Array.from(
      new Set(
        contacts.map(
          (contact) =>
            contact.institution_id
        )
      )
    );

  let relevantInstitutions =
    assignedInstitutions;

  if (
    relevantInstitutionIds.length >
    0
  ) {
    const result = await supabase
      .from("institutions")
      .select("id, name")
      .in(
        "id",
        relevantInstitutionIds
      )
      .order("name");

    if (result.data) {
      relevantInstitutions =
        result.data as InstitutionRecord[];
    }
  }

  const institutionMap =
    new Map(
      relevantInstitutions.map(
        (institution) => [
          institution.id,
          institution.name,
        ]
      )
    );

  for (
    const institution of
    assignedInstitutions
  ) {
    institutionMap.set(
      institution.id,
      institution.name
    );
  }

  const institutionOptions =
    Array.from(
      institutionMap.entries()
    )
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  const assignedInstitutionSet =
    new Set(
      assignedInstitutionIds
    );

  const filteredContacts =
    contacts.filter((contact) => {
      const institutionName =
        institutionMap.get(
          contact.institution_id
        ) || "Linked Institution";

      const institutionMatches =
        !selectedInstitution ||
        contact.institution_id ===
          selectedInstitution;

      return (
        institutionMatches &&
        matchesSearch({
          contact,
          institutionName,
          search,
        })
      );
    });

  const primaryContacts =
    filteredContacts.filter(
      (contact) =>
        contact.is_primary
    ).length;

  const directAssignments =
    filteredContacts.filter(
      (contact) =>
        contact.assigned_to ===
        user.id
    ).length;

  const errorMessage =
    assignedInstitutionError
      ?.message ||
    directResult.error?.message ||
    inheritedError;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          Team Workspace
        </p>

        <h1 className="mt-2 font-black">
          My Contacts
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Contacts from your assigned
          accounts and contacts assigned
          directly to you.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load all contacts:{" "}
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Visible Contacts
          </p>

          <p className="mt-2 text-2xl font-black">
            {filteredContacts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Direct Assignments
          </p>

          <p className="mt-2 text-2xl font-black">
            {directAssignments}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Primary Contacts
          </p>

          <p className="mt-2 text-2xl font-black">
            {primaryContacts}
          </p>
        </article>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_280px_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search name, role, phone, email or institution..."
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />

        <select
          name="institution"
          defaultValue={
            selectedInstitution
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">
            All visible institutions
          </option>

          {institutionOptions.map(
            (institution) => (
              <option
                key={institution.id}
                value={institution.id}
              >
                {institution.name}
              </option>
            )
          )}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-black">
            Assigned Contacts
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredContacts.length}{" "}
            contact
            {filteredContacts.length ===
            1
              ? ""
              : "s"}{" "}
            available
          </p>
        </div>

        {filteredContacts.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-black text-slate-700">
              No contacts found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Clear the filters or ask a
              Super Admin to assign an
              account or contact.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredContacts.map(
              (contact) => {
                const institutionName =
                  institutionMap.get(
                    contact.institution_id
                  ) ||
                  "Linked Institution";

                const inherited =
                  assignedInstitutionSet.has(
                    contact.institution_id
                  );

                const direct =
                  contact.assigned_to ===
                  user.id;

                const whatsapp =
                  normaliseWhatsApp(
                    contact.whatsapp_number ||
                      contact.phone
                  );

                return (
                  <article
                    key={contact.id}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] xl:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-black text-slate-950">
                          {
                            contact.full_name
                          }
                        </p>

                        {contact.is_primary && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                            Primary
                          </span>
                        )}

                        {direct && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-800">
                            Direct
                          </span>
                        )}

                        {inherited && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                            Account
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {[
                          contact.job_title,
                          contact.department,
                        ]
                          .filter(Boolean)
                          .join(" · ") ||
                          "Role not recorded"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      {inherited ? (
                        <Link
                          href={`/my-institutions/${contact.institution_id}`}
                          className="block truncate text-sm font-black text-amber-700"
                        >
                          {institutionName}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-black text-slate-700">
                          {institutionName}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {contact.phone ||
                          "Phone not recorded"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {contact.email ||
                          "Email not recorded"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {contact.phone && (
                        <>
                          <a
                            href={`tel:${contact.phone}`}
                            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"
                          >
                            Call
                          </a>

                          <a
                            href={`sms:${contact.phone}`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700"
                          >
                            SMS
                          </a>
                        </>
                      )}

                      {whatsapp && (
                        <a
                          href={`https://wa.me/${whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                        >
                          WhatsApp
                        </a>
                      )}

                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700"
                        >
                          Email
                        </a>
                      )}

                      <CopyContactButton
                        name={
                          contact.full_name
                        }
                        institution={
                          institutionName
                        }
                        jobTitle={
                          contact.job_title
                        }
                        phone={contact.phone}
                        email={contact.email}
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}