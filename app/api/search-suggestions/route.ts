import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type InstitutionRecord = {
  id: string;
  name: string;
  institution_type: string | null;
  location: string | null;
};

type ContactRecord = {
  id: string;
  institution_id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
};

type Suggestion = {
  id: string;
  kind: "institution" | "contact";
  label: string;
  secondary: string;
  href: string;
};

function contactSearchFilter(
  query: string
) {
  const safe = query
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [
    `full_name.ilike.%${safe}%`,
    `email.ilike.%${safe}%`,
    `phone.ilike.%${safe}%`,
  ].join(",");
}

function uniqueContacts(
  contacts: ContactRecord[]
) {
  const records = new Map<
    string,
    ContactRecord
  >();

  for (const contact of contacts) {
    records.set(contact.id, contact);
  }

  return Array.from(records.values());
}

export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const query = String(
    url.searchParams.get("q") || ""
  ).trim();

  if (query.length < 2) {
    return NextResponse.json({
      suggestions: [],
    });
  }

  const {
    supabase,
    user,
    accessLevel,
  } = await requireUser();

  let institutions: InstitutionRecord[] =
    [];
  let contacts: ContactRecord[] = [];

  if (accessLevel === "team_member") {
    const assignedInstitutionResult =
      await supabase
        .from("institutions")
        .select(
          "id, name, institution_type, location"
        )
        .eq("assigned_to", user.id)
        .order("name")
        .limit(1000);

    const assignedInstitutions =
      (assignedInstitutionResult.data ||
        []) as InstitutionRecord[];

    institutions = assignedInstitutions
      .filter((institution) =>
        [
          institution.name,
          institution.institution_type,
          institution.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .slice(0, 5);

    const institutionIds =
      assignedInstitutions.map(
        (institution) => institution.id
      );

    const directContactRequest =
      supabase
        .from("contacts")
        .select(
          "id, institution_id, full_name, job_title, email, phone"
        )
        .eq("assigned_to", user.id)
        .or(contactSearchFilter(query))
        .order("full_name")
        .limit(6);

    const inheritedContactRequest =
      institutionIds.length > 0
        ? supabase
            .from("contacts")
            .select(
              "id, institution_id, full_name, job_title, email, phone"
            )
            .in(
              "institution_id",
              institutionIds
            )
            .or(
              contactSearchFilter(query)
            )
            .order("full_name")
            .limit(6)
        : null;

    const directContactResult =
      await directContactRequest;

    const inheritedContactResult =
      inheritedContactRequest
        ? await inheritedContactRequest
        : null;

    contacts = uniqueContacts([
      ...((directContactResult.data ||
        []) as ContactRecord[]),
      ...(((inheritedContactResult?.data ||
        []) as ContactRecord[])),
    ]).slice(0, 5);
  } else {
    const [
      institutionResult,
      contactResult,
    ] = await Promise.all([
      supabase
        .from("institutions")
        .select(
          "id, name, institution_type, location"
        )
        .or(
          `name.ilike.%${query.replace(
            /[,%()]/g,
            " "
          )}%,location.ilike.%${query.replace(
            /[,%()]/g,
            " "
          )}%`
        )
        .order("name")
        .limit(5),

      supabase
        .from("contacts")
        .select(
          "id, institution_id, full_name, job_title, email, phone"
        )
        .or(contactSearchFilter(query))
        .order("full_name")
        .limit(5),
    ]);

    institutions =
      (institutionResult.data ||
        []) as InstitutionRecord[];

    contacts =
      (contactResult.data ||
        []) as ContactRecord[];
  }

  const institutionSuggestions:
    Suggestion[] = institutions.map(
    (institution) => ({
      id: institution.id,
      kind: "institution",
      label: institution.name,
      secondary: [
        institution.institution_type,
        institution.location,
      ]
        .filter(Boolean)
        .join(" Â· "),
      href:
        accessLevel === "team_member"
          ? `/my-institutions/${institution.id}`
          : `/institutions/${institution.id}`,
    })
  );

  const contactSuggestions:
    Suggestion[] = contacts.map(
    (contact) => ({
      id: contact.id,
      kind: "contact",
      label: contact.full_name,
      secondary: [
        contact.job_title,
        contact.phone || contact.email,
      ]
        .filter(Boolean)
        .join(" Â· "),
      href:
        accessLevel === "team_member"
          ? `/my-contacts?q=${encodeURIComponent(
              contact.full_name
            )}`
          : `/contacts/${contact.id}`,
    })
  );

  return NextResponse.json({
    suggestions: [
      ...institutionSuggestions,
      ...contactSuggestions,
    ].slice(0, 8),
  });
}