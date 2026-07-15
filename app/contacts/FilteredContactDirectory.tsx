"use client";

import { useMemo, useState } from "react";
import ContactDirectory from "./ContactDirectory";

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

type FilteredContactDirectoryProps = {
  contacts: Contact[];
  institutionNames: Record<string, string>;
};

export default function FilteredContactDirectory({
  contacts,
  institutionNames,
}: FilteredContactDirectoryProps) {
  const [institutionFilter, setInstitutionFilter] =
    useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [relationshipFilter, setRelationshipFilter] =
    useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const institutionOptions = useMemo(
    () =>
      Object.entries(institutionNames).sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
    [institutionNames]
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          contacts
            .map((contact) => contact.department)
            .filter(
              (value): value is string =>
                Boolean(value?.trim())
            )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        const matchesInstitution =
          !institutionFilter ||
          contact.institution_id === institutionFilter;

        const matchesDepartment =
          !departmentFilter ||
          contact.department === departmentFilter;

        const matchesRelationship =
          !relationshipFilter ||
          (relationshipFilter === "primary" &&
            Boolean(contact.is_primary)) ||
          (relationshipFilter === "decision_maker" &&
            Boolean(contact.decision_maker));

        const matchesChannel =
          !channelFilter ||
          (channelFilter === "phone" &&
            Boolean(contact.phone?.trim())) ||
          (channelFilter === "whatsapp" &&
            Boolean(
              (
                contact.whatsapp_number ||
                contact.phone
              )?.trim()
            )) ||
          (channelFilter === "email" &&
            Boolean(contact.email?.trim()));

        return (
          matchesInstitution &&
          matchesDepartment &&
          matchesRelationship &&
          matchesChannel
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.full_name.localeCompare(b.full_name);
        }

        if (sortBy === "institution") {
          return (
            institutionNames[
              a.institution_id
            ] || ""
          ).localeCompare(
            institutionNames[b.institution_id] || ""
          );
        }

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
  }, [
    channelFilter,
    contacts,
    departmentFilter,
    institutionFilter,
    institutionNames,
    relationshipFilter,
    sortBy,
  ]);

  const hasFilters =
    institutionFilter ||
    departmentFilter ||
    relationshipFilter ||
    channelFilter ||
    sortBy !== "newest";

  function clearFilters() {
    setInstitutionFilter("");
    setDepartmentFilter("");
    setRelationshipFilter("");
    setChannelFilter("");
    setSortBy("newest");
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Directory Filters
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {filteredContacts.length} of {contacts.length}{" "}
              contacts shown
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Institution
            </label>

            <select
              value={institutionFilter}
              onChange={(event) =>
                setInstitutionFilter(event.target.value)
              }
              className="w-full"
            >
              <option value="">All institutions</option>

              {institutionOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Department
            </label>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value)
              }
              className="w-full"
            >
              <option value="">All departments</option>

              {departmentOptions.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Relationship Type
            </label>

            <select
              value={relationshipFilter}
              onChange={(event) =>
                setRelationshipFilter(
                  event.target.value
                )
              }
              className="w-full"
            >
              <option value="">All contact types</option>
              <option value="primary">
                Primary contacts
              </option>
              <option value="decision_maker">
                Decision-makers
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Contact Channel
            </label>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(event.target.value)
              }
              className="w-full"
            >
              <option value="">All channels</option>
              <option value="phone">Has phone</option>
              <option value="whatsapp">
                Has WhatsApp
              </option>
              <option value="email">Has email</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
              Sort By
            </label>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="w-full"
            >
              <option value="newest">
                Newest records
              </option>
              <option value="name">Contact name</option>
              <option value="institution">
                Institution name
              </option>
            </select>
          </div>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <p className="text-lg font-black text-slate-800">
            No matching contacts
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Change one of the filters or clear them.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <ContactDirectory
          contacts={filteredContacts}
          institutionNames={institutionNames}
        />
      )}
    </>
  );
}