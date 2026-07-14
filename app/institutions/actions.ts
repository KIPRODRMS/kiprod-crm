"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function createInstitution(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const name = readField(formData, "name");
  const institutionType = readField(formData, "institution_type");
  const sector = readField(formData, "sector");
  const location = readField(formData, "location");
  const website = readField(formData, "website");
  const email = readField(formData, "email");
  const phone = readField(formData, "phone");
  const source = readField(formData, "source");
  const status = readField(formData, "status") || "prospect";
  const nextAction = readField(formData, "next_action");
  const followUpValue = readField(formData, "next_follow_up_at");

  if (!name) {
    redirect(
      `/institutions?error=${encodeURIComponent(
        "Institution name is required"
      )}`
    );
  }

  let nextFollowUpAt: string | null = null;

  if (followUpValue) {
    const followUpDate = new Date(followUpValue);

    if (Number.isNaN(followUpDate.getTime())) {
      redirect(
        `/institutions?error=${encodeURIComponent(
          "Enter a valid follow-up date"
        )}`
      );
    }

    nextFollowUpAt = followUpDate.toISOString();
  }

  const { error } = await supabase.from("institutions").insert({
    name,
    institution_type: institutionType || null,
    sector: sector || null,
    location: location || null,
    website: website || null,
    email: email || null,
    phone: phone || null,
    source: source || null,
    status,
    assigned_to: user.id,
    next_action: nextAction || null,
    next_follow_up_at: nextFollowUpAt,
    created_by: user.id,
  });

  if (error) {
    redirect(
      `/institutions?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/institutions");

  redirect(
    `/institutions?success=${encodeURIComponent(
      "Institution added successfully"
    )}`
  );
}

function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];

    if (character === '"') {
      const nextCharacter = csvText[index + 1];

      if (insideQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        csvText[index + 1] === "\n"
      ) {
        index += 1;
      }

      currentRow.push(currentField.trim());

      if (currentRow.some((value) => value !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  currentRow.push(currentField.trim());

  if (currentRow.some((value) => value !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function normaliseHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getCsvValue(
  row: string[],
  headerMap: Map<string, number>,
  possibleHeaders: string[]
) {
  for (const header of possibleHeaders) {
    const columnIndex = headerMap.get(header);

    if (columnIndex !== undefined) {
      return String(row[columnIndex] || "").trim();
    }
  }

  return "";
}

export async function importInstitutionsCsv(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const permittedRoles = [
    "super_admin",
    "management",
    "team_lead",
  ];

  if (
    !profile ||
    !permittedRoles.includes(profile.role)
  ) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "You are not authorised to import institutions"
      )}`
    );
  }

  const uploadedFile = formData.get("csv_file");

  if (
    !(uploadedFile instanceof File) ||
    uploadedFile.size === 0
  ) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "Please select a CSV file"
      )}`
    );
  }

  if (!uploadedFile.name.toLowerCase().endsWith(".csv")) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "The uploaded file must be a CSV file"
      )}`
    );
  }

  if (uploadedFile.size > 5 * 1024 * 1024) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "The CSV file must be smaller than 5 MB"
      )}`
    );
  }

  const csvText = await uploadedFile.text();
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "The CSV contains no institution records"
      )}`
    );
  }

  if (rows.length > 1001) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "Import a maximum of 1,000 institutions at a time"
      )}`
    );
  }

  const headers = rows[0].map(normaliseHeader);

  const headerMap = new Map<string, number>();

  headers.forEach((header, index) => {
    headerMap.set(header, index);
  });

  const hasNameColumn =
    headerMap.has("name") ||
    headerMap.has("institution_name");

  if (!hasNameColumn) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "The CSV must contain a name column"
      )}`
    );
  }

  const { data: existingInstitutions } = await supabase
    .from("institutions")
    .select("name");

  const existingNames = new Set(
    (existingInstitutions || []).map((institution) =>
      institution.name.trim().toLowerCase()
    )
  );

  const validStatuses = new Set([
    "prospect",
    "engaged",
    "active_opportunity",
    "active_partner",
    "deferred",
    "lost",
    "inactive",
  ]);

  const recordsToInsert: Array<{
    name: string;
    institution_type: string | null;
    sector: string | null;
    location: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: string;
    next_action: string | null;
    next_follow_up_at: string | null;
    assigned_to: string;
    created_by: string;
  }> = [];

  let skippedRows = 0;

  for (const row of rows.slice(1)) {
    const name = getCsvValue(row, headerMap, [
      "name",
      "institution_name",
    ]);

    if (!name) {
      skippedRows += 1;
      continue;
    }

    const normalisedName = name.toLowerCase();

    if (existingNames.has(normalisedName)) {
      skippedRows += 1;
      continue;
    }

    const rawStatus = getCsvValue(row, headerMap, [
      "status",
      "institution_status",
    ])
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    const status = validStatuses.has(rawStatus)
      ? rawStatus
      : "prospect";

    const followUpValue = getCsvValue(row, headerMap, [
      "next_follow_up_at",
      "follow_up_date",
      "follow_up",
    ]);

    let nextFollowUpAt: string | null = null;

    if (followUpValue) {
      const parsedDate = new Date(followUpValue);

      if (!Number.isNaN(parsedDate.getTime())) {
        nextFollowUpAt = parsedDate.toISOString();
      }
    }

    recordsToInsert.push({
      name,

      institution_type:
        getCsvValue(row, headerMap, [
          "institution_type",
          "type",
        ]) || null,

      sector:
        getCsvValue(row, headerMap, [
          "sector",
          "industry",
        ]) || null,

      location:
        getCsvValue(row, headerMap, [
          "location",
          "county",
          "city",
        ]) || null,

      website:
        getCsvValue(row, headerMap, [
          "website",
          "url",
        ]) || null,

      email:
        getCsvValue(row, headerMap, [
          "email",
          "general_email",
        ]) || null,

      phone:
        getCsvValue(row, headerMap, [
          "phone",
          "telephone",
          "mobile",
        ]) || null,

      source:
        getCsvValue(row, headerMap, [
          "source",
          "lead_source",
        ]) || null,

      status,

      next_action:
        getCsvValue(row, headerMap, [
          "next_action",
        ]) || null,

      next_follow_up_at: nextFollowUpAt,
      assigned_to: user.id,
      created_by: user.id,
    });

    existingNames.add(normalisedName);
  }

  if (recordsToInsert.length === 0) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        "No new institutions were found. Records may be blank or already exist."
      )}`
    );
  }

  const { error: insertError } = await supabase
    .from("institutions")
    .insert(recordsToInsert);

  if (insertError) {
    redirect(
      `/institutions/import?error=${encodeURIComponent(
        insertError.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath("/institutions/import");

  redirect(
    `/institutions?success=${encodeURIComponent(
      `${recordsToInsert.length} institutions imported successfully. ${skippedRows} rows skipped.`
    )}`
  );
}