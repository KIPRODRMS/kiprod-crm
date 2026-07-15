"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GlobalSearchProps = {
  isAdmin: boolean;
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
};

type SearchItem = {
  id: string;
  type: "Page" | "Institution" | "Contact";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

const pageItems: SearchItem[] = [
  {
    id: "page-dashboard",
    type: "Page",
    title: "Dashboard",
    subtitle: "CRM overview and institutional pipeline",
    href: "/",
    keywords: "home overview cockpit dashboard",
  },
  {
    id: "page-institutions",
    type: "Page",
    title: "Institutions",
    subtitle: "Institutional database and SACCO master records",
    href: "/institutions",
    keywords:
      "institutions saccos banks partners prospects database",
  },
  {
    id: "page-contacts",
    type: "Page",
    title: "Contacts",
    subtitle: "Institutional contacts and decision-makers",
    href: "/contacts",
    keywords:
      "contacts people phonebook decision makers ceo managers",
  },
  {
    id: "page-opportunities",
    type: "Page",
    title: "Opportunities",
    subtitle: "Business opportunities and acquisition pipeline",
    href: "/opportunities",
    keywords:
      "opportunities deals pipeline proposals sales business",
  },
  {
    id: "page-tasks",
    type: "Page",
    title: "Tasks",
    subtitle: "Follow-ups, activities and staff assignments",
    href: "/tasks",
    keywords: "tasks actions follow ups assignments work",
  },
  {
    id: "page-reports",
    type: "Page",
    title: "Daily & Weekly Reports",
    subtitle: "Employee daily and weekly activity reports",
    href: "/reports",
    keywords:
      "reports daily weekly reporting employee performance",
  },
  {
    id: "page-academy",
    type: "Page",
    title: "KIPROD Academy",
    subtitle: "Internal courses and capability development",
    href: "/academy",
    keywords:
      "academy courses training learning lessons knowledge",
  },
  {
    id: "page-profile",
    type: "Page",
    title: "My Profile",
    subtitle: "View and manage your CRM profile",
    href: "/profile",
    keywords: "profile account personal details",
  },
  {
    id: "page-password",
    type: "Page",
    title: "Change Password",
    subtitle: "Update your CRM account password",
    href: "/change-password",
    keywords: "password security account",
  },
];

function formatLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function GlobalSearch({
  isAdmin,
}: GlobalSearchProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const [institutions, setInstitutions] = useState<
    InstitutionRecord[]
  >([]);

  const [contacts, setContacts] = useState<ContactRecord[]>([]);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || loaded || loading) {
      return;
    }

    let active = true;

    async function loadSearchRecords() {
      setLoading(true);
      setLoadError("");

      const [institutionResult, contactResult] =
        await Promise.all([
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
            .order("name", { ascending: true })
            .limit(500),

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
                phone
              `
            )
            .order("full_name", { ascending: true })
            .limit(500),
        ]);

      if (!active) {
        return;
      }

      setInstitutions(institutionResult.data || []);
      setContacts(contactResult.data || []);

      if (institutionResult.error || contactResult.error) {
        setLoadError(
          "Some CRM records could not be loaded. Page navigation is still available."
        );
      }

      setLoaded(true);
      setLoading(false);
    }

    void loadSearchRecords();

    return () => {
      active = false;
    };
  }, [loaded, loading, open, supabase]);

  const institutionNames = useMemo(
    () =>
      new Map(
        institutions.map((institution) => [
          institution.id,
          institution.name,
        ])
      ),
    [institutions]
  );

  const searchableItems = useMemo(() => {
    const pages = isAdmin
      ? [
          ...pageItems,
          {
            id: "page-admin",
            type: "Page" as const,
            title: "Super Admin Centre",
            subtitle:
              "Institution, contact and SACCO administration",
            href: "/admin",
            keywords:
              "admin super administration management imports",
          },
        ]
      : pageItems;

    const institutionItems: SearchItem[] =
      institutions.map((institution) => ({
        id: `institution-${institution.id}`,
        type: "Institution",
        title: institution.name,
        subtitle: [
          institution.institution_type,
          institution.location,
          formatLabel(institution.status),
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/institutions/${institution.id}`,
        keywords: [
          institution.name,
          institution.institution_type,
          institution.location,
          institution.status,
          "institution partner sacco",
        ]
          .filter(Boolean)
          .join(" "),
      }));

    const contactItems: SearchItem[] = contacts.map(
      (contact) => ({
        id: `contact-${contact.id}`,
        type: "Contact",
        title: contact.full_name,
        subtitle: [
          contact.job_title,
          institutionNames.get(contact.institution_id),
          contact.phone || contact.email,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/contacts/${contact.id}`,
        keywords: [
          contact.full_name,
          contact.job_title,
          contact.department,
          contact.email,
          contact.phone,
          institutionNames.get(contact.institution_id),
          "contact person",
        ]
          .filter(Boolean)
          .join(" "),
      })
    );

    return [
      ...pages,
      ...institutionItems,
      ...contactItems,
    ];
  }, [
    contacts,
    institutionNames,
    institutions,
    isAdmin,
  ]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return searchableItems
        .filter((item) => item.type === "Page")
        .slice(0, 10);
    }

    const terms = search.split(/\s+/).filter(Boolean);

    return searchableItems
      .filter((item) => {
        const content = [
          item.title,
          item.subtitle,
          item.keywords,
          item.type,
        ]
          .join(" ")
          .toLowerCase();

        return terms.every((term) =>
          content.includes(term)
        );
      })
      .slice(0, 15);
  }, [query, searchableItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function openResult(item: SearchItem) {
    closeSearch();
    router.push(item.href);
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.min(current + 1, results.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.max(current - 1, 0)
      );
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      openResult(results[activeIndex]);
    }
  }

  return (
    <>
      <div className="ml-auto flex shrink-0 md:ml-0 md:min-w-0 md:flex-1 md:justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search KIPROD CRM"
          aria-haspopup="dialog"
          className="hidden w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:border-amber-400 hover:bg-white md:flex"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <span className="min-w-0 flex-1 truncate">
            Search pages, institutions and contacts...
          </span>

          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search KIPROD CRM"
          aria-haspopup="dialog"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/65 px-3 pt-[8vh] backdrop-blur-sm sm:px-6"
          onMouseDown={closeSearch}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search KIPROD CRM"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            className="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={handleInputKeyDown}
                placeholder="Search KIPROD CRM..."
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={closeSearch}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
              >
                ESC
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {query.trim()
                    ? "Search Results"
                    : "Quick Navigation"}
                </p>

                {query.trim() && (
                  <p className="text-[10px] font-bold text-slate-400">
                    {results.length} result
                    {results.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              {loading && (
                <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">
                  Loading CRM records...
                </div>
              )}

              {loadError && (
                <div className="mx-2 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                  {loadError}
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="font-black text-slate-800">
                    No results found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Try a page name, institution, contact,
                    phone number or email.
                  </p>
                </div>
              )}

              {results.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() =>
                    setActiveIndex(index)
                  }
                  onClick={() => openResult(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    activeIndex === index
                      ? "bg-amber-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                      item.type === "Page"
                        ? "bg-slate-950 text-amber-400"
                        : item.type === "Institution"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-50 text-blue-800"
                    }`}
                  >
                    {item.type === "Page"
                      ? "PG"
                      : item.type === "Institution"
                        ? "IN"
                        : "CO"}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-950">
                      {item.title}
                    </span>

                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {item.subtitle || item.type}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs font-black text-slate-300">
                    ↵
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-400">
              <span>↑ ↓ Navigate</span>
              <span>Enter Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}