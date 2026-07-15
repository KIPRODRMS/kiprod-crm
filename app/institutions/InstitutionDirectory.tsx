"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Institution = {
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

type InstitutionDirectoryProps = {
  institutions: Institution[];
  errorMessage?: string | null;
};

const PAGE_SIZE = 40;

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateValue(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? fallback : parsed;
}

export default function InstitutionDirectory({
  institutions,
  errorMessage,
}: InstitutionDirectoryProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [outreachFilter, setOutreachFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          institutions
            .flatMap((institution) => [
              institution.segment,
              institution.institution_type,
            ])
            .filter((value): value is string => Boolean(value?.trim()))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [institutions]
  );

  const tierOptions = useMemo(
    () =>
      Array.from(
        new Set(
          institutions
            .map((institution) => institution.tier)
            .filter((value): value is string => Boolean(value?.trim()))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [institutions]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          institutions
            .map((institution) => institution.status)
            .filter((value): value is string => Boolean(value?.trim()))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [institutions]
  );

  const outreachOptions = useMemo(
    () =>
      Array.from(
        new Set(
          institutions
            .map((institution) => institution.outreach_status)
            .filter((value): value is string => Boolean(value?.trim()))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [institutions]
  );

  const filteredInstitutions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return institutions
      .filter((institution) => {
        const searchableValues = [
          institution.name,
          institution.institution_type,
          institution.segment,
          institution.sector,
          institution.tier,
          institution.ceo_name,
          institution.location,
          institution.status,
          institution.outreach_status,
          institution.next_action,
          institution.asset_size_billions,
        ];

        const matchesSearch =
          !search ||
          searchableValues
            .filter(
              (value) =>
                value !== null &&
                value !== undefined &&
                String(value).trim()
            )
            .some((value) =>
              String(value).toLowerCase().includes(search)
            );

        const matchesType =
          !typeFilter ||
          institution.segment === typeFilter ||
          institution.institution_type === typeFilter;

        const matchesTier =
          !tierFilter || institution.tier === tierFilter;

        const matchesStatus =
          !statusFilter || institution.status === statusFilter;

        const matchesOutreach =
          !outreachFilter ||
          institution.outreach_status === outreachFilter;

        return (
          matchesSearch &&
          matchesType &&
          matchesTier &&
          matchesStatus &&
          matchesOutreach
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === "assets") {
          return (
            Number(b.asset_size_billions || 0) -
            Number(a.asset_size_billions || 0)
          );
        }

        if (sortBy === "follow_up") {
          return (
            dateValue(
              a.next_follow_up_at,
              Number.MAX_SAFE_INTEGER
            ) -
            dateValue(
              b.next_follow_up_at,
              Number.MAX_SAFE_INTEGER
            )
          );
        }

        return (
          dateValue(b.created_at, 0) -
          dateValue(a.created_at, 0)
        );
      });
  }, [
    institutions,
    outreachFilter,
    query,
    sortBy,
    statusFilter,
    tierFilter,
    typeFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInstitutions.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const visibleInstitutions = filteredInstitutions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const hasFilters =
    query ||
    typeFilter ||
    tierFilter ||
    statusFilter ||
    outreachFilter ||
    sortBy !== "newest";

  function updateFilter(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("");
    setTierFilter("");
    setStatusFilter("");
    setOutreachFilter("");
    setSortBy("newest");
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-md">
      <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Institutional Database
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredInstitutions.length} of{" "}
              {institutions.length} institutions shown
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-left text-xs font-black text-amber-700 hover:text-amber-600"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-3">
            <label
              htmlFor="institution-search"
              className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500"
            >
              Search
            </label>

            <input
              id="institution-search"
              type="search"
              value={query}
              onChange={(event) =>
                updateFilter(setQuery, event.target.value)
              }
              placeholder="Search institution, CEO, county, sector or next action..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Institution Type
            </label>

            <select
              value={typeFilter}
              onChange={(event) =>
                updateFilter(
                  setTypeFilter,
                  event.target.value
                )
              }
              className="w-full"
            >
              <option value="">All types</option>

              {typeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Tier
            </label>

            <select
              value={tierFilter}
              onChange={(event) =>
                updateFilter(
                  setTierFilter,
                  event.target.value
                )
              }
              className="w-full"
            >
              <option value="">All tiers</option>

              {tierOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              CRM Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                updateFilter(
                  setStatusFilter,
                  event.target.value
                )
              }
              className="w-full"
            >
              <option value="">All CRM statuses</option>

              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Outreach Status
            </label>

            <select
              value={outreachFilter}
              onChange={(event) =>
                updateFilter(
                  setOutreachFilter,
                  event.target.value
                )
              }
              className="w-full"
            >
              <option value="">All outreach statuses</option>

              {outreachOptions.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Sort By
            </label>

            <select
              value={sortBy}
              onChange={(event) =>
                updateFilter(setSortBy, event.target.value)
              }
              className="w-full"
            >
              <option value="newest">Newest records</option>
              <option value="name">Institution name</option>
              <option value="assets">Largest asset size</option>
              <option value="follow_up">Next follow-up</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load institutions: {errorMessage}
        </div>
      )}

      {!errorMessage && institutions.length === 0 && (
        <div className="px-6 py-20 text-center">
          <p className="font-semibold text-slate-700">
            No institutions recorded yet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Use the form to add the first KIPROD prospect.
          </p>
        </div>
      )}

      {!errorMessage &&
        institutions.length > 0 &&
        visibleInstitutions.length === 0 && (
          <div className="px-6 py-20 text-center">
            <p className="font-semibold text-slate-700">
              No matching institutions
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the search term or clear a filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
            >
              Clear Filters
            </button>
          </div>
        )}

      {visibleInstitutions.length > 0 && (
        <div className="divide-y divide-slate-200">
          {visibleInstitutions.map((institution) => (
            <Link
              key={institution.id}
              href={`/institutions/${institution.id}`}
              className="block px-4 py-5 transition hover:bg-slate-50 sm:px-6"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-slate-950">
                    {institution.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {(institution.segment ||
                      institution.institution_type) && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {institution.segment ||
                          institution.institution_type}
                      </span>
                    )}

                    {institution.tier && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">
                        {institution.tier}
                      </span>
                    )}

                    {institution.asset_size_billions !==
                      null && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-800">
                        KES{" "}
                        {Number(
                          institution.asset_size_billions
                        ).toLocaleString()}B
                      </span>
                    )}

                    {institution.sector && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {institution.sector}
                      </span>
                    )}

                    {institution.location && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {institution.location}
                      </span>
                    )}
                  </div>

                  {institution.ceo_name && (
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-bold">CEO:</span>{" "}
                      {institution.ceo_name}
                    </p>
                  )}

                  {institution.next_action && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      <span className="font-bold">
                        Next action:
                      </span>{" "}
                      {institution.next_action}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {institution.outreach_status && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {formatLabel(
                        institution.outreach_status
                      )}
                    </span>
                  )}

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {formatLabel(institution.status)}
                  </span>

                  <span className="text-sm font-bold text-slate-400">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filteredInstitutions.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">
            Page {safePage} of {totalPages} · {PAGE_SIZE}{" "}
            institutions per page
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}