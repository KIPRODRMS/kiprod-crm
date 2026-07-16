import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";

type MyInstitutionsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 20;

function formatLabel(
  value: string | null
) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }
  ).format(new Date(value));
}

export default async function MyInstitutionsPage({
  searchParams,
}: MyInstitutionsPageProps) {
  const params = await searchParams;

  const {
    supabase,
    user,
  } = await requireTeamMember();

  const search = String(
    params.q || ""
  ).trim();

  const status = String(
    params.status || ""
  ).trim();

  const requestedPage = Number(
    params.page || "1"
  );

  const currentPage =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const start =
    (currentPage - 1) * PAGE_SIZE;

  const end =
    start + PAGE_SIZE - 1;

  let query = supabase
    .from("institutions")
    .select(
      `
        id,
        name,
        institution_type,
        sector,
        segment,
        tier,
        location,
        status,
        outreach_status,
        next_action,
        next_follow_up_at,
        created_at
      `,
      {
        count: "exact",
      }
    )
    .eq("assigned_to", user.id)
    .order("name", {
      ascending: true,
    });

  if (search) {
    query = query.ilike(
      "name",
      `%${search}%`
    );
  }

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  const {
    data: institutions,
    error,
    count,
  } = await query.range(start, end);

  const totalRecords = count || 0;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalRecords / PAGE_SIZE
    )
  );

  function pageHref(
    pageNumber: number
  ) {
    const queryParams =
      new URLSearchParams();

    if (search) {
      queryParams.set("q", search);
    }

    if (status) {
      queryParams.set(
        "status",
        status
      );
    }

    queryParams.set(
      "page",
      String(pageNumber)
    );

    return `/my-institutions?${queryParams.toString()}`;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Assigned Institutions
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Review the institutions assigned
          to you, open account profiles and
          record relationship activity.
        </p>
      </div>

      {params.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {params.error}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load your assigned
          institutions: {error.message}
        </div>
      )}

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search my institutions..."
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"
        >
          <option value="">
            All statuses
          </option>

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
            <h2 className="font-black">
              Assigned Accounts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {totalRecords} institution
              {totalRecords === 1
                ? ""
                : "s"}{" "}
              assigned to you
            </p>
          </div>

          <Link
            href="/my-workspace"
            className="text-sm font-black text-amber-700 hover:text-amber-600"
          >
            Back to My Workspace
          </Link>
        </div>

        {!error &&
        (!institutions ||
          institutions.length === 0) ? (
          <div className="px-6 py-16 text-center">
            <p className="font-black text-slate-700">
              No assigned institutions
              found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try clearing the filters or
              ask management to assign an
              account to you.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {(institutions || []).map(
              (institution) => (
                <Link
                  key={institution.id}
                  href={`/my-institutions/${institution.id}`}
                  className="block px-5 py-5 transition hover:bg-slate-50"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.2fr)_170px_160px_minmax(220px,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {institution.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {[
                          institution.institution_type,
                          institution.location,
                        ]
                          .filter(Boolean)
                          .join(" · ") ||
                          "Institution details not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Status
                      </p>

                      <span className="mt-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800">
                        {formatLabel(
                          institution.status
                        )}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Outreach
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {formatLabel(
                          institution.outreach_status
                        )}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Next action
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                        {institution.next_action ||
                          "No next action recorded"}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {formatDateTime(
                          institution.next_follow_up_at
                        )}
                      </p>
                    </div>

                    <span className="text-sm font-black text-amber-700">
                      Open →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
            <Link
              href={pageHref(
                Math.max(
                  1,
                  currentPage - 1
                )
              )}
              aria-disabled={
                currentPage === 1
              }
              className={`rounded-xl border px-4 py-2 text-sm font-black ${
                currentPage === 1
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-700 hover:border-amber-500"
              }`}
            >
              Previous
            </Link>

            <p className="text-xs font-bold text-slate-500">
              Page {currentPage} of{" "}
              {totalPages}
            </p>

            <Link
              href={pageHref(
                Math.min(
                  totalPages,
                  currentPage + 1
                )
              )}
              aria-disabled={
                currentPage ===
                totalPages
              }
              className={`rounded-xl border px-4 py-2 text-sm font-black ${
                currentPage ===
                totalPages
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-700 hover:border-amber-500"
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}