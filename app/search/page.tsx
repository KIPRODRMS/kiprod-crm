import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const dynamic =
  "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type InstitutionRecord = {
  id: string;
  name: string;
  institution_type: string | null;
  location: string | null;
  status: string | null;
};

type ContactRecord = {
  id: string;
  institution_id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  assigned_to: string | null;
};

type PageResult = {
  title: string;
  description: string;
  href: string;
  keywords: string;
};

function matches(
  values: Array<
    string | null | undefined
  >,
  search: string
) {
  const content = values
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

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const query = String(
    params.q || ""
  ).trim();

  const {
    supabase,
    user,
    accessLevel,
  } = await requireUser();

  const teamPages: PageResult[] = [
    {
      title: "My Workspace",
      description:
        "Assigned accounts and activity overview",
      href: "/my-workspace",
      keywords:
        "workspace dashboard home",
    },
    {
      title: "Assigned Accounts",
      description:
        "Institutions assigned to me",
      href: "/my-institutions",
      keywords:
        "institutions accounts saccos partners",
    },
    {
      title: "My Contacts",
      description:
        "Inherited and directly assigned contacts",
      href: "/my-contacts",
      keywords:
        "contacts people phone email",
    },
    {
      title: "My Opportunities",
      description:
        "My assigned pipeline",
      href: "/my-opportunities",
      keywords:
        "opportunities pipeline deals",
    },
    {
      title: "My Tasks",
      description:
        "My assignments and actions",
      href: "/my-tasks",
      keywords:
        "tasks actions follow ups",
    },
    {
      title: "My Reports",
      description:
        "Daily and weekly reporting",
      href: "/my-reports",
      keywords:
        "reports daily weekly",
    },
    {
      title: "My Academy",
      description:
        "Assigned courses and learning",
      href: "/my-academy",
      keywords:
        "academy training courses",
    },
  ];

  const managementPages:
    PageResult[] = [
    {
      title:
        "Management Dashboard",
      description:
        "Organisation-wide CRM overview",
      href: "/management",
      keywords:
        "dashboard management overview",
    },
    {
      title: "Institutions",
      description:
        "Institutional database",
      href: "/institutions",
      keywords:
        "institutions saccos banks",
    },
    {
      title: "Contacts",
      description:
        "Organisation-wide contacts",
      href: "/contacts",
      keywords:
        "contacts people phonebook",
    },
    {
      title: "Opportunities",
      description:
        "Acquisition pipeline",
      href: "/opportunities",
      keywords:
        "pipeline deals opportunities",
    },
    {
      title: "Tasks",
      description:
        "Team assignments",
      href: "/tasks",
      keywords:
        "tasks assignments actions",
    },
    {
      title: "Team Reports",
      description:
        "Daily and weekly reports",
      href: "/reports",
      keywords:
        "reports performance",
    },
    {
      title: "KIPROD Academy",
      description:
        "Courses and enrolments",
      href: "/academy",
      keywords:
        "academy training courses",
    },
  ];

  let pages =
    accessLevel === "team_member"
      ? teamPages
      : managementPages;

  if (
    accessLevel === "super_admin"
  ) {
    pages = [
      ...pages,
      {
        title:
          "Super Admin Centre",
        description:
          "Access, assignments and administration",
        href: "/admin",
        keywords:
          "admin roles imports assignments",
      },
    ];
  }

  const matchedPages = query
    ? pages.filter((page) =>
        matches(
          [
            page.title,
            page.description,
            page.keywords,
          ],
          query
        )
      )
    : pages;

  let institutions:
    InstitutionRecord[] = [];

  let contacts: ContactRecord[] =
    [];

  const institutionMap =
    new Map<string, string>();

  let dataError:
    | string
    | null = null;

  if (query) {
    if (
      accessLevel === "team_member"
    ) {
      const institutionResult =
        await supabase
          .from("institutions")
          .select(
            `
              id,
              name,
              institution_type,
              location,
              status
            `
          )
          .eq(
            "assigned_to",
            user.id
          )
          .order("name");

      institutions =
        (institutionResult.data ||
          []) as InstitutionRecord[];

      const assignedIds =
        institutions.map(
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
              assigned_to
            `
          )
          .eq(
            "assigned_to",
            user.id
          )
          .order("full_name");

      let inherited:
        ContactRecord[] = [];

      if (assignedIds.length > 0) {
        const result =
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
                assigned_to
              `
            )
            .in(
              "institution_id",
              assignedIds
            )
            .order("full_name");

        inherited =
          (result.data ||
            []) as ContactRecord[];

        dataError =
          result.error?.message ||
          dataError;
      }

      const mergedContacts =
        new Map<
          string,
          ContactRecord
        >();

      for (const contact of [
        ...inherited,
        ...((directResult.data ||
          []) as ContactRecord[]),
      ]) {
        mergedContacts.set(
          contact.id,
          contact
        );
      }

      contacts = Array.from(
        mergedContacts.values()
      );

      const allInstitutionIds =
        Array.from(
          new Set(
            contacts.map(
              (contact) =>
                contact.institution_id
            )
          )
        );

      if (
        allInstitutionIds.length >
        0
      ) {
        const result =
          await supabase
            .from("institutions")
            .select("id, name")
            .in(
              "id",
              allInstitutionIds
            );

        for (
          const institution of
            result.data || []
        ) {
          institutionMap.set(
            institution.id,
            institution.name
          );
        }
      }

      dataError =
        institutionResult.error
          ?.message ||
        directResult.error?.message ||
        dataError;
    } else {
      const [
        institutionResult,
        contactResult,
      ] = await Promise.all([
        supabase
          .from("institutions")
          .select(
            `
              id,
              name,
              institution_type,
              location,
              status
            `
          )
          .order("name")
          .limit(1000),

        supabase
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
              assigned_to
            `
          )
          .order("full_name")
          .limit(1000),
      ]);

      institutions =
        (institutionResult.data ||
          []) as InstitutionRecord[];

      contacts =
        (contactResult.data ||
          []) as ContactRecord[];

      dataError =
        institutionResult.error
          ?.message ||
        contactResult.error
          ?.message ||
        null;

      for (
        const institution of
          institutions
      ) {
        institutionMap.set(
          institution.id,
          institution.name
        );
      }
    }
  }

  for (
    const institution of
      institutions
  ) {
    institutionMap.set(
      institution.id,
      institution.name
    );
  }

  const matchedInstitutions =
    query
      ? institutions.filter(
          (institution) =>
            matches(
              [
                institution.name,
                institution.institution_type,
                institution.location,
                institution.status,
              ],
              query
            )
        )
      : [];

  const matchedContacts = query
    ? contacts.filter((contact) =>
        matches(
          [
            contact.full_name,
            contact.job_title,
            contact.department,
            contact.email,
            contact.phone,
            institutionMap.get(
              contact.institution_id
            ),
          ],
          query
        )
      )
    : [];

  const resultCount =
    matchedPages.length +
    matchedInstitutions.length +
    matchedContacts.length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          KIPROD CRM
        </p>

        <h1 className="mt-2 font-black">
          Search
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Search only the CRM records
          available to your account.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search pages, institutions, contacts, phone numbers or email..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white"
        >
          Search CRM
        </button>
      </form>

      {dataError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Some records could not be
          searched: {dataError}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-black">
          {query
            ? `Results for “${query}”`
            : "Available Pages"}
        </h2>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {resultCount} results
        </span>
      </div>

      {resultCount === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="font-black text-slate-700">
            No results found
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Try a shorter name, phone
            number, institution or page
            title.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {matchedPages.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-black">
                  Pages
                </h3>
              </div>

              <div className="divide-y divide-slate-200">
                {matchedPages.map(
                  (page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="block px-5 py-4 transition hover:bg-amber-50"
                    >
                      <p className="font-black text-slate-950">
                        {page.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          page.description
                        }
                      </p>
                    </Link>
                  )
                )}
              </div>
            </section>
          )}

          {matchedInstitutions.length >
            0 && (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-black">
                  Institutions
                </h3>
              </div>

              <div className="divide-y divide-slate-200">
                {matchedInstitutions.map(
                  (institution) => (
                    <Link
                      key={
                        institution.id
                      }
                      href={
                        accessLevel ===
                        "team_member"
                          ? `/my-institutions/${institution.id}`
                          : `/institutions/${institution.id}`
                      }
                      className="block px-5 py-4 transition hover:bg-amber-50"
                    >
                      <p className="font-black text-slate-950">
                        {
                          institution.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          institution.institution_type,
                          institution.location,
                          institution.status,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>
                  )
                )}
              </div>
            </section>
          )}

          {matchedContacts.length >
            0 && (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-black">
                  Contacts
                </h3>
              </div>

              <div className="divide-y divide-slate-200">
                {matchedContacts.map(
                  (contact) => (
                    <Link
                      key={contact.id}
                      href={
                        accessLevel ===
                        "team_member"
                          ? `/my-contacts?q=${encodeURIComponent(
                              contact.full_name
                            )}`
                          : `/contacts/${contact.id}`
                      }
                      className="block px-5 py-4 transition hover:bg-blue-50"
                    >
                      <p className="font-black text-slate-950">
                        {
                          contact.full_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          contact.job_title,
                          institutionMap.get(
                            contact.institution_id
                          ),
                          contact.phone ||
                            contact.email,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}