"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type Contact = {
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
  created_at: string | null;
};

type ContactDirectoryProps = {
  contacts: Contact[];
  institutionNames: Record<string, string>;
};

const PAGE_SIZE = 50;

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "C"
  );
}

function normaliseWhatsApp(value: string | null) {
  if (!value) return "";

  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;

  if (
    (digits.startsWith("7") || digits.startsWith("1")) &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return digits;
}

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/75">
      {children}
    </span>
  );
}

const disabledActionClass =
  "flex min-h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-[10px] font-black text-slate-400";

export default function ContactDirectory({
  contacts,
  institutionNames,
}: ContactDirectoryProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  const filteredContacts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return contacts;

    return contacts.filter((contact) => {
      const institution = institutionNames[contact.institution_id] || "";

      return [
        contact.full_name,
        contact.job_title,
        contact.department,
        contact.email,
        contact.phone,
        contact.whatsapp_number,
        institution,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [contacts, institutionNames, query]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContacts.length / PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const visibleContacts = filteredContacts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function updateSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    setNotice(`${label} copied`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function launchWithCopy(
    href: string,
    value: string,
    label: string
  ) {
    await copyValue(value, label);
    window.location.href = href;
  }

  return (
    <div className="relative">
      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-2xl lg:left-auto lg:right-6 lg:translate-x-0">
          {notice}
        </div>
      )}

      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
              Contact Directory
            </p>
            <h2 className="mt-1 text-xl font-black">
              {filteredContacts.length} People
            </h2>
          </div>

          <div className="w-full xl:max-w-md">
            <input
              type="search"
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search name, institution, phone or email..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            />
          </div>
        </div>
      </div>

      {visibleContacts.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <p className="text-lg font-black text-slate-800">
            No contacts found
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Change the search term or add a new contact.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 bg-slate-50/70 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {visibleContacts.map((contact, index) => {
            const institutionName =
              institutionNames[contact.institution_id] ||
              "Unknown institution";
            const whatsappNumber = normaliseWhatsApp(
              contact.whatsapp_number || contact.phone
            );
            const channelSummary =
              contact.phone ||
              contact.email ||
              "No phone or email recorded";

            return (
              <article
                key={contact.id}
                className="contact-card-enter flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                style={{
                  animationDelay: `${Math.min(index, 12) * 35}ms`,
                }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-amber-400">
                    {initials(contact.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="min-w-0 text-sm font-black leading-5 text-slate-950 hover:text-amber-700"
                      >
                        {contact.full_name}
                      </Link>

                      {contact.is_primary && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">
                          Primary
                        </span>
                      )}

                      {contact.decision_maker && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-black text-white">
                          Decision-maker
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {contact.job_title || "Role not recorded"}
                      {contact.department ? ` · ${contact.department}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <Link
                    href={`/institutions/${contact.institution_id}`}
                    className="block truncate text-xs font-black uppercase tracking-wide text-slate-700 hover:text-amber-700"
                  >
                    {institutionName}
                  </Link>

                  <button
                    type="button"
                    disabled={!contact.phone && !contact.email}
                    onClick={() => {
                      const value = contact.phone || contact.email;
                      if (value) {
                        void copyValue(
                          value,
                          contact.phone ? "Phone number" : "Email"
                        );
                      }
                    }}
                    className="mt-1 block max-w-full truncate text-left text-xs text-slate-500 transition enabled:hover:text-slate-800 disabled:cursor-default"
                    title={
                      contact.phone || contact.email
                        ? "Tap to copy"
                        : undefined
                    }
                  >
                    {channelSummary}
                  </button>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:flex sm:flex-wrap">
                  {contact.phone ? (
                    <button
                      type="button"
                      onClick={() =>
                        void launchWithCopy(
                          `tel:${contact.phone}`,
                          contact.phone!,
                          "Phone number"
                        )
                      }
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-2 text-[10px] font-black text-white transition hover:bg-slate-800"
                      title="Call contact"
                    >
                      <ActionIcon>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.45.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.5 21 3 13.5 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.45 1 1 0 0 1-.25 1Z" />
                        </svg>
                      </ActionIcon>
                      Call
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={disabledActionClass}
                      title="No phone number recorded"
                    >
                      Call
                    </button>
                  )}

                  {contact.phone ? (
                    <button
                      type="button"
                      onClick={() =>
                        void launchWithCopy(
                          `sms:${contact.phone}`,
                          contact.phone!,
                          "Phone number"
                        )
                      }
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-black text-amber-900 transition hover:bg-amber-100"
                      title="Send a message"
                    >
                      <ActionIcon>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                        </svg>
                      </ActionIcon>
                      Message
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={disabledActionClass}
                      title="No phone number recorded"
                    >
                      Message
                    </button>
                  )}

                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-black text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <ActionIcon>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 11.5a8 8 0 0 1-11.8 7L3 20l1.5-5.1A8 8 0 1 1 20 11.5Z" />
                          <path d="M8.5 8.5c.5 3 2 4.5 5 5" />
                        </svg>
                      </ActionIcon>
                      WhatsApp
                    </a>
                  )}

                  {contact.email && (
                    <button
                      type="button"
                      onClick={() =>
                        void launchWithCopy(
                          `mailto:${contact.email}`,
                          contact.email!,
                          "Email"
                        )
                      }
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-[10px] font-black text-blue-800 transition hover:bg-blue-100"
                      title="Open email"
                    >
                      <ActionIcon>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m3 7 9 6 9-6" />
                        </svg>
                      </ActionIcon>
                      Email
                    </button>
                  )}

                  <Link
                    href={`/contacts/${contact.id}`}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] font-black text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                    Profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Page {safePage} of {totalPages} · {PAGE_SIZE} contacts per page
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
