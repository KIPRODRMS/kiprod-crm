import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";
import CopyContactButton from "./CopyContactButton";

type MyContactsPageProps = {
  searchParams: Promise<{
    q?: string;
    institution?: string;
  }>;
};

type AssignedInstitution = {
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

  const searchableText = [
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

  return searchableText.includes(
    search.toLowerCase()
  );
}

export default async function MyContactsPage({
  searchParams,
}: MyContactsPageProps) {
  const params = await searchParams;

  const {
    supabase,
    user,
  } = await requireTeamMember();

  const search = String(
    params.q || ""
  ).trim();

  const selectedInstitution = String(
    params.institution || ""
  ).trim();

  const {
    data: institutionData,
    error: institutionsError,
  } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("assigned_to", user.id)
    .order("name", {
      ascending: true,
    });

  const institutions =
    (institutionData ||
      []) as AssignedInstitution[];

  const institutionIds =
    institutions.map(
      (institution) => institution.id
    );

  const institutionMap = new Map(
    institutions.map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  let contacts: ContactRecord[] = [];
  let contactsError: string | null = null;

  if (institutionIds.length > 0) {
    const result = await supabase
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
          decision_maker
        `
      )
      .in(
        "institution_id",
        institutionIds
      )
      .order("is_primary", {
        ascending: false,
      })
      .order("full_name", {
        ascending: true,
      });

    contacts =
      (result.data ||
        []) as ContactRecord[];

    contactsError =
      result.error?.message || null;
  }

  const filteredContacts = contacts.filter(
    (contact) => {
      const institutionName =
        institutionMap.get(
          contact.institution_id
        ) || "Unknown Institution";

      const matchesInstitution =
        !selectedInstitution ||
        contact.institution_id ===
          selectedInstitution;

      return (
        matchesInstitution &&
        matchesSearch({
          contact,
          institutionName,
          search,
        })
      );
    }
  );

  const primaryContacts =
    filteredContacts.filter(
      (contact) =>
        contact.is_primary
    ).length;

  const decisionMakers =
    filteredContacts.filter(
      (contact) =>
        contact.decision_maker
    ).length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Contacts
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Contact people connected to the
          institutions currently assigned
          to you.
        </p>
      </div>

      {(institutionsError ||
        contactsError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load all contacts:{" "}
          {institutionsError?.message ||
            contactsError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Visible Contacts
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {filteredContacts.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Across assigned accounts
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Primary Contacts
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {primaryContacts}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Main institutional contacts
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Decision-Makers
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {decisionMakers}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Strategic relationship contacts
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
            All assigned institutions
          </option>

          {institutions.map(
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
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-black text-slate-950">
              Assigned Account Contacts
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

          <Link
            href="/my-workspace"
            className="text-sm font-black text-amber-700 hover:text-amber-600"
          >
            Back to My Workspace
          </Link>
        </div>

        {institutions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-black text-slate-700">
              No institutions are assigned
              to you
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Contacts will appear after an
              institution has been assigned
              to your workspace.
            </p>
          </div>
        ) : filteredContacts.length ===
          0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-black text-slate-700">
              No contacts found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try clearing the current
              search or institution filter.
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
                  "Unknown Institution";

                const whatsappNumber =
                  normaliseWhatsApp(
                    contact.whatsapp_number ||
                      contact.phone
                  );

                return (
                  <article
                    key={contact.id}
                    className="px-5 py-5"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-black text-slate-950">
                            {contact.full_name}
                          </p>

                          {contact.is_primary && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                              Primary
                            </span>
                          )}

                          {contact.decision_maker && (
                            <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                              Decision-Maker
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
                        <Link
                          href={`/my-institutions/${contact.institution_id}`}
                          className="truncate text-sm font-black text-amber-700 hover:text-amber-600"
                        >
                          {institutionName}
                        </Link>

                        <div className="mt-1 space-y-1 text-xs text-slate-500">
                          <p>
                            {contact.phone ||
                              "Phone not recorded"}
                          </p>

                          <p className="truncate">
                            {contact.email ||
                              "Email not recorded"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                          >
                            Call
                          </a>
                        )}

                        {contact.phone && (
                          <a
                            href={`sms:${contact.phone}`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-amber-500 hover:bg-amber-50"
                          >
                            SMS
                          </a>
                        )}

                        {whatsappNumber && (
                          <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-500"
                          >
                            WhatsApp
                          </a>
                        )}

                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-500"
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
                          phone={
                            contact.phone
                          }
                          email={
                            contact.email
                          }
                        />

                        <Link
                          href={`/my-institutions/${contact.institution_id}`}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100"
                        >
                          Account
                        </Link>
                      </div>
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