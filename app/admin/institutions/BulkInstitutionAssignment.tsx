"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import { bulkAssignInstitutions } from "./bulk-actions";

type InstitutionRecord = {
  id: string;
  name: string;
  institution_type: string | null;
  segment: string | null;
  tier: string | null;
  location: string | null;
  status: string | null;
  assigned_to: string | null;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

type Props = {
  institutions: InstitutionRecord[];
  profiles: ProfileRecord[];
  returnUrl: string;
};

function profileLabel(
  profile: ProfileRecord
) {
  return (
    profile.full_name ||
    profile.email ||
    "Unnamed Team Member"
  );
}

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

export default function BulkInstitutionAssignment({
  institutions,
  profiles,
  returnUrl,
}: Props) {
  const [selected, setSelected] =
    useState<Set<string>>(
      new Set()
    );

  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((profile) => [
          profile.id,
          profileLabel(profile),
        ])
      ),
    [profiles]
  );

  function toggle(
    institutionId: string
  ) {
    setSelected((current) => {
      const next = new Set(current);

      if (
        next.has(institutionId)
      ) {
        next.delete(institutionId);
      } else {
        next.add(institutionId);
      }

      return next;
    });
  }

  function selectAll() {
    setSelected(
      new Set(
        institutions.map(
          (institution) =>
            institution.id
        )
      )
    );
  }

  function clearSelection() {
    setSelected(new Set());
  }

  if (institutions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="font-black text-slate-700">
          No institutions match these
          filters.
        </p>
      </div>
    );
  }

  return (
    <form
      action={bulkAssignInstitutions}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
    >
      <input
        type="hidden"
        name="return_url"
        value={returnUrl}
      />

      <div className="border-b border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Bulk Assignment
            </p>

            <h2 className="mt-1 font-black">
              Select Institutions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {selected.size} selected
              from {institutions.length}{" "}
              visible institutions
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-black text-slate-700"
            >
              Select All Visible
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-black text-slate-700"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <select
            name="assigned_to"
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
          >
            <option value="">
              Unassign Selected
            </option>

            {profiles.map(
              (profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profileLabel(profile)}
                </option>
              )
            )}
          </select>

          <button
            type="submit"
            disabled={
              selected.size === 0
            }
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Assign Selected
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {institutions.map(
          (institution) => {
            const checked =
              selected.has(
                institution.id
              );

            const owner =
              institution.assigned_to
                ? profileMap.get(
                    institution.assigned_to
                  ) ||
                  "Unknown Team Member"
                : "Unassigned";

            return (
              <article
                key={institution.id}
                className={`grid gap-4 px-5 py-4 lg:grid-cols-[40px_minmax(220px,1.5fr)_140px_100px_150px_180px_auto] lg:items-center ${
                  checked
                    ? "bg-amber-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  name="institution_ids"
                  value={institution.id}
                  checked={checked}
                  onChange={() =>
                    toggle(
                      institution.id
                    )
                  }
                  aria-label={`Select ${institution.name}`}
                  className="h-5 w-5 accent-amber-500"
                />

                <div className="min-w-0">
                  <Link
                    href={`/institutions/${institution.id}`}
                    className="block truncate font-black text-slate-950 hover:text-amber-700"
                  >
                    {institution.name}
                  </Link>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {institution.institution_type ||
                      institution.segment ||
                      "Type not recorded"}
                  </p>
                </div>

                <p className="text-xs font-bold text-slate-700">
                  {institution.segment ||
                    "No segment"}
                </p>

                <p className="text-xs font-bold text-slate-700">
                  {institution.tier ||
                    "No tier"}
                </p>

                <p className="text-xs text-slate-500">
                  {institution.location ||
                    "No location"}
                </p>

                <div>
                  <p className="text-xs font-black text-slate-700">
                    {owner}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatLabel(
                      institution.status
                    )}
                  </p>
                </div>

                <Link
                  href={`/admin/institutions/${institution.id}/edit`}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-center text-xs font-black text-white"
                >
                  Edit
                </Link>
              </article>
            );
          }
        )}
      </div>
    </form>
  );
}