"use client";

import type { AccessLevel } from "@/lib/roles";

type GlobalSearchProps = {
  accessLevel: AccessLevel;
  userId: string;
};

export default function GlobalSearch({
  accessLevel,
  userId,
}: GlobalSearchProps) {
  const placeholder =
    accessLevel === "team_member"
      ? "Search my accounts and contacts..."
      : "Search institutions, contacts and pages...";

  return (
    <form
      action="/search"
      method="get"
      className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:justify-center"
    >
      <input
        type="search"
        name="q"
        disabled={!userId}
        placeholder={placeholder}
        aria-label="Search KIPROD CRM"
        className="hidden w-full max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-amber-400 focus:bg-white sm:block"
      />

      <button
        type="submit"
        disabled={!userId}
        className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Search
      </button>
    </form>
  );
}