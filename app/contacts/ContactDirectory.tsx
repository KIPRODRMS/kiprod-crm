"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export default function ContactDirectory({
  contacts,
  institutionNames,
}: ContactDirectoryProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredContacts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return contacts;

    return contacts.filter((contact) => {
      const institution =
        institutionNames[contact.institution_id] || "";

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
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
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

  return (
    <div>
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
              Contact Directory
            </p>
            <h2 className="mt-1 text-xl font-black">
              {filteredContacts.length} People
            </h2>
          </div>

          <div className="w-full max-w-xl">
            <input
              type="search"
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search name, institution, phone or email..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
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
        <div className="divide-y divide-slate-200">
          {visibleContacts.map((contact) => {
            const institutionName =
              institutionNames[contact.institution_id] ||
              "Unknown institution";

            const whatsappNumber = normaliseWhatsApp(
              contact.whatsapp_number || contact.phone
            );

            return (
              <article
                key={contact.id}
                className="flex flex-col gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-amber-400">
                    {initials(contact.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="truncate text-sm font-black text-slate-950 hover:text-amber-700"
                      >
                        {contact.full_name}
                      </Link>

                      {contact.is_primary && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          Primary
                        </span>
                      )}

                      {contact.decision_maker && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white">
                          Decision-maker
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {contact.job_title || "Role not recorded"}
                      {contact.department
                        ? ` · ${contact.department}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 lg:w-56">
                  <Link
                    href={`/institutions/${contact.institution_id}`}
                    className="block truncate text-xs font-black text-slate-700 hover:text-amber-700"
                  >
                    {institutionName}
                  </Link>

                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {contact.phone ||
                      contact.email ||
                      "No contact channel recorded"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                  {contact.phone && (
                    <>
                      <a
                        href={`tel:${contact.phone}`}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-200"
                      >
                        Call
                      </a>

                      <a
                        href={`sms:${contact.phone}`}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-200"
                      >
                        SMS
                      </a>
                    </>
                  )}

                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800 hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-800 hover:bg-blue-100"
                    >
                      Email
                    </a>
                  )}

                  <Link
                    href={`/contacts/${contact.id}`}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-black text-white hover:bg-slate-800"
                  >
                    View
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

