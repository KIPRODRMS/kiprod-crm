"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AccessLevel } from "@/lib/roles";

type GlobalSearchProps = {
  accessLevel: AccessLevel;
  userId: string;
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
  type:
    | "Page"
    | "Institution"
    | "Contact";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

const teamMemberPages: SearchItem[] = [
  {
    id: "page-my-workspace",
    type: "Page",
    title: "My Workspace",
    subtitle:
      "My assigned accounts and activity overview",
    href: "/my-workspace",
    keywords:
      "workspace dashboard overview home",
  },
  {
    id: "page-my-institutions",
    type: "Page",
    title: "My Institutions",
    subtitle:
      "Institutions assigned to my workspace",
    href: "/my-institutions",
    keywords:
      "institutions assigned accounts saccos partners",
  },
  {
    id: "page-my-contacts",
    type: "Page",
    title: "My Contacts",
    subtitle:
      "Contacts from my assigned institutions",
    href: "/my-contacts",
    keywords:
      "contacts people phonebook decision makers",
  },
  {
    id: "page-my-opportunities",
    type: "Page",
    title: "My Opportunities",
    subtitle:
      "Opportunities assigned to me",
    href: "/my-opportunities",
    keywords:
      "opportunities pipeline proposals business",
  },
  {
    id: "page-my-tasks",
    type: "Page",
    title: "My Tasks",
    subtitle:
      "My assignments and follow-up actions",
    href: "/my-tasks",
    keywords:
      "tasks work actions follow ups",
  },
  {
    id: "page-my-reports",
    type: "Page",
    title: "My Reports",
    subtitle:
      "My daily and weekly reports",
    href: "/my-reports",
    keywords:
      "reports daily weekly reporting",
  },
  {
    id: "page-my-academy",
    type: "Page",
    title: "My Academy",
    subtitle:
      "My assigned learning programmes",
    href: "/my-academy",
    keywords:
      "academy courses learning lessons",
  },
  {
    id: "page-profile",
    type: "Page",
    title: "My Profile",
    subtitle:
      "View my CRM profile",
    href: "/profile",
    keywords:
      "profile account personal details",
  },
];

const managementPages: SearchItem[] = [
  {
    id: "page-management",
    type: "Page",
    title: "Management Dashboard",
    subtitle:
      "Organisation-wide CRM overview",
    href: "/management",
    keywords:
      "management dashboard overview cockpit",
  },
  {
    id: "page-management-centre",
    type: "Page",
    title: "Management Centre",
    subtitle:
      "Management review and oversight tools",
    href: "/management/centre",
    keywords:
      "management centre oversight review",
  },
  {
    id: "page-institutions",
    type: "Page",
    title: "Institutions",
    subtitle:
      "Organisation-wide institutional database",
    href: "/institutions",
    keywords:
      "institutions saccos banks partners prospects",
  },
  {
    id: "page-contacts",
    type: "Page",
    title: "Contacts",
    subtitle:
      "Organisation-wide institutional contacts",
    href: "/contacts",
    keywords:
      "contacts people decision makers ceo",
  },
  {
    id: "page-opportunities",
    type: "Page",
    title: "Opportunities",
    subtitle:
      "Organisation-wide acquisition pipeline",
    href: "/opportunities",
    keywords:
      "opportunities deals pipeline proposals",
  },
  {
    id: "page-tasks",
    type: "Page",
    title: "Tasks",
    subtitle:
      "Team assignments and follow-ups",
    href: "/tasks",
    keywords:
      "tasks actions assignments work",
  },
  {
    id: "page-reports",
    type: "Page",
    title: "Team Reports",
    subtitle:
      "Daily and weekly team reports",
    href: "/reports",
    keywords:
      "reports daily weekly performance",
  },
  {
    id: "page-academy",
    type: "Page",
    title: "KIPROD Academy",
    subtitle:
      "Courses and capability development",
    href: "/academy",
    keywords:
      "academy courses training learning",
  },
  {
    id: "page-profile",
    type: "Page",
    title: "My Profile",
    subtitle:
      "View my CRM profile",
    href: "/profile",
    keywords:
      "profile account personal details",
  },
];

function formatLabel(
  value: string | null
) {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function GlobalSearch({
  accessLevel,
  userId,
}: GlobalSearchProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    institutions,
    setInstitutions,
  ] = useState<
    InstitutionRecord[]
  >([]);

  const [contacts, setContacts] =
    useState<ContactRecord[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    setLoaded(false);
    setInstitutions([]);
    setContacts([]);
    setLoadError("");
  }, [accessLevel, userId]);

  useEffect(() => {
    function handleShortcut(
      event: KeyboardEvent
    ) {
      const target =
        event.target as HTMLElement | null;

      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName ===
          "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(
          target?.isContentEditable
        );

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (
        event.key === "/" &&
        !typing
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleShortcut
    );

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

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 30);

    return () => {
      window.clearTimeout(
        focusTimer
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      loaded ||
      loading ||
      !userId
    ) {
      return;
    }

    let active = true;

    async function loadSearchRecords() {
      setLoading(true);
      setLoadError("");

      let institutionQuery =
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
          );

      if (
        accessLevel ===
        "team_member"
      ) {
        institutionQuery =
          institutionQuery.eq(
            "assigned_to",
            userId
          );
      }

      const institutionResult =
        await institutionQuery
          .order("name", {
            ascending: true,
          })
          .limit(500);

      if (!active) {
        return;
      }

      const visibleInstitutions =
        institutionResult.data || [];

      let visibleContacts: ContactRecord[] =
        [];

      let contactError:
        | string
        | null = null;

      if (
        accessLevel ===
        "team_member"
      ) {
        const institutionIds =
          visibleInstitutions.map(
            (institution) =>
              institution.id
          );

        if (
          institutionIds.length > 0
        ) {
          const contactResult =
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
                  phone
                `
              )
              .in(
                "institution_id",
                institutionIds
              )
              .order("full_name", {
                ascending: true,
              })
              .limit(500);

          visibleContacts =
            contactResult.data || [];

          contactError =
            contactResult.error
              ?.message || null;
        }
      } else {
        const contactResult =
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
                phone
              `
            )
            .order("full_name", {
              ascending: true,
            })
            .limit(500);

        visibleContacts =
          contactResult.data || [];

        contactError =
          contactResult.error
            ?.message || null;
      }

      if (!active) {
        return;
      }

      setInstitutions(
        visibleInstitutions
      );

      setContacts(
        visibleContacts
      );

      if (
        institutionResult.error ||
        contactError
      ) {
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
  }, [
    accessLevel,
    loaded,
    loading,
    open,
    supabase,
    userId,
  ]);

  const institutionNames =
    useMemo(
      () =>
        new Map(
          institutions.map(
            (institution) => [
              institution.id,
              institution.name,
            ]
          )
        ),
      [institutions]
    );

  const searchableItems =
    useMemo(() => {
      let pages =
        accessLevel ===
        "team_member"
          ? teamMemberPages
          : managementPages;

      if (
        accessLevel ===
        "super_admin"
      ) {
        pages = [
          ...pages,
          {
            id: "page-admin",
            type: "Page",
            title:
              "Super Admin Centre",
            subtitle:
              "User access, imports and system administration",
            href: "/admin",
            keywords:
              "admin super access roles imports",
          },
        ];
      }

      const institutionItems:
        SearchItem[] =
        institutions.map(
          (institution) => ({
            id: `institution-${institution.id}`,
            type: "Institution",
            title: institution.name,

            subtitle: [
              institution.institution_type,
              institution.location,
              formatLabel(
                institution.status
              ),
            ]
              .filter(Boolean)
              .join(" · "),

            href:
              accessLevel ===
              "team_member"
                ? `/my-institutions/${institution.id}`
                : `/institutions/${institution.id}`,

            keywords: [
              institution.name,
              institution.institution_type,
              institution.location,
              institution.status,
              "institution partner sacco",
            ]
              .filter(Boolean)
              .join(" "),
          })
        );

      const contactItems:
        SearchItem[] = contacts.map(
        (contact) => ({
          id: `contact-${contact.id}`,
          type: "Contact",
          title: contact.full_name,

          subtitle: [
            contact.job_title,
            institutionNames.get(
              contact.institution_id
            ),
            contact.phone ||
              contact.email,
          ]
            .filter(Boolean)
            .join(" · "),

          href:
            accessLevel ===
            "team_member"
              ? `/my-institutions/${contact.institution_id}`
              : `/contacts/${contact.id}`,

          keywords: [
            contact.full_name,
            contact.job_title,
            contact.department,
            contact.email,
            contact.phone,
            institutionNames.get(
              contact.institution_id
            ),
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
      accessLevel,
      contacts,
      institutionNames,
      institutions,
    ]);

  const results = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    if (!search) {
      return searchableItems
        .filter(
          (item) =>
            item.type === "Page"
        )
        .slice(0, 10);
    }

    const terms = search
      .split(/\s+/)
      .filter(Boolean);

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

  function openResult(
    item: SearchItem
  ) {
    closeSearch();
    router.push(item.href);
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      results.length === 0
    ) {
      return;
    }

    if (
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.min(
          current + 1,
          results.length - 1
        )
      );
    }

    if (
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.max(current - 1, 0)
      );
    }

    if (
      event.key === "Enter" &&
      results[activeIndex]
    ) {
      event.preventDefault();

      openResult(
        results[activeIndex]
      );
    }
  }

  return (
    <>
      <div className="ml-auto flex shrink-0 md:ml-0 md:min-w-0 md:flex-1 md:justify-center">
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Search KIPROD CRM"
          aria-haspopup="dialog"
          className="hidden w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:border-amber-400 hover:bg-white md:flex"
        >
          <span className="text-base">
            ⌕
          </span>

          <span className="min-w-0 flex-1 truncate">
            Search pages, institutions
            and contacts...
          </span>

          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Search KIPROD CRM"
          aria-haspopup="dialog"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-600 transition hover:border-amber-400 hover:bg-white md:hidden"
        >
          ⌕
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/70 px-3 pt-16 backdrop-blur-sm sm:px-6 sm:pt-24">
          <button
            type="button"
            aria-label="Close search"
            onClick={closeSearch}
            className="absolute inset-0"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Search KIPROD CRM"
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="text-xl text-slate-500">
                  ⌕
                </span>

                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleInputKeyDown
                  }
                  placeholder="Search the CRM..."
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 transition hover:border-amber-400 hover:text-slate-950"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-2 sm:p-3">
              {loading && (
                <div className="px-5 py-12 text-center text-sm font-bold text-slate-500">
                  Loading available CRM
                  records...
                </div>
              )}

              {loadError && (
                <div className="m-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                  {loadError}
                </div>
              )}

              {!loading &&
                results.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <p className="font-black text-slate-700">
                      No results found
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Try another name,
                      institution or page.
                    </p>
                  </div>
                )}

              {!loading &&
                results.map(
                  (item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        openResult(item)
                      }
                      onMouseEnter={() =>
                        setActiveIndex(
                          index
                        )
                      }
                      className={`flex w-full items-start gap-4 rounded-2xl px-4 py-4 text-left transition ${
                        index ===
                        activeIndex
                          ? "bg-amber-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                          item.type ===
                          "Page"
                            ? "bg-slate-950 text-amber-400"
                            : item.type ===
                                "Institution"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.type ===
                        "Institution"
                          ? "IN"
                          : item.type ===
                              "Contact"
                            ? "CO"
                            : "PG"}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-slate-950">
                          {item.title}
                        </span>

                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {item.subtitle}
                        </span>
                      </span>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                        {item.type}
                      </span>
                    </button>
                  )
                )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}