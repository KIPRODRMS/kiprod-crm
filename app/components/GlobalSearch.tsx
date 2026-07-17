"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { AccessLevel } from "@/lib/roles";

type GlobalSearchProps = {
  accessLevel: AccessLevel;
  userId: string;
};

type SearchSuggestion = {
  id: string;
  kind: "institution" | "contact";
  label: string;
  secondary: string;
  href: string;
};

export default function GlobalSearch({
  accessLevel,
  userId,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] =
    useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [isOpen, setIsOpen] =
    useState(false);
  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const placeholder =
    accessLevel === "team_member"
      ? "Search my accounts and contacts..."
      : "Search institutions, contacts and pages...";

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!userId || trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        setIsLoading(true);

        try {
          const response = await fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              trimmed
            )}`,
            {
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              "Unable to load suggestions"
            );
          }

          const payload =
            (await response.json()) as {
              suggestions?: SearchSuggestion[];
            };

          setSuggestions(
            payload.suggestions || []
          );
          setIsOpen(true);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setSuggestions([]);
          setIsOpen(true);
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      },
      250
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, userId]);

  const trimmedQuery = query.trim();

  return (
    <div
      ref={wrapperRef}
      className="relative ml-auto min-w-0 flex-1 md:max-w-xl"
    >
      <form
        action="/search"
        method="get"
        className="flex min-w-0 items-center gap-2"
      >
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onFocus={() => {
            if (trimmedQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
          disabled={!userId}
          autoComplete="off"
          placeholder={placeholder}
          aria-label="Search KIPROD CRM"
          aria-expanded={isOpen}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-amber-400 focus:bg-white"
        />

        <button
          type="submit"
          disabled={
            !userId ||
            trimmedQuery.length === 0
          }
          className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {isOpen &&
        trimmedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {isLoading ? (
            <p className="px-4 py-4 text-sm font-bold text-slate-500">
              Searching CRM...
            </p>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {suggestions.map(
                (suggestion) => (
                  <Link
                    key={`${suggestion.kind}-${suggestion.id}`}
                    href={suggestion.href}
                    onClick={() =>
                      setIsOpen(false)
                    }
                    className="block px-4 py-3 transition hover:bg-amber-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-950">
                        {suggestion.label}
                      </p>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                        {suggestion.kind}
                      </span>
                    </div>

                    {suggestion.secondary && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {suggestion.secondary}
                      </p>
                    )}
                  </Link>
                )
              )}
            </div>
          ) : (
            <p className="px-4 py-4 text-sm text-slate-500">
              No quick suggestions found.
            </p>
          )}

          <Link
            href={`/search?q=${encodeURIComponent(
              trimmedQuery
            )}`}
            onClick={() =>
              setIsOpen(false)
            }
            className="block border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            View all results for "{trimmedQuery}"
          </Link>
        </div>
      )}
    </div>
  );
}