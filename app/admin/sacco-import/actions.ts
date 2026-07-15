"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SACCO_MASTER_DATA } from "./data";

const IMPORT_SUBJECT = "Imported SACCO outreach history";

function normaliseName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function requireAdmin() {
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

  if (!["super_admin", "management"].includes(profile?.role || "")) {
    redirect("/");
  }

  return { supabase, user };
}

export async function importSaccoMasterData() {
  const { supabase, user } = await requireAdmin();

  const schemaCheck = await supabase
    .from("institutions")
    .select("id, segment, tier, asset_size_billions")
    .limit(1);

  if (schemaCheck.error) {
    redirect(
      `/admin/sacco-import?error=${encodeURIComponent(
        "The SACCO database columns are missing. Run 01-kiprod-sacco-schema.sql in Supabase first."
      )}`
    );
  }

  const { data: existingInstitutions, error: existingError } =
    await supabase
      .from("institutions")
      .select("id, name");

  if (existingError) {
    redirect(
      `/admin/sacco-import?error=${encodeURIComponent(
        existingError.message
      )}`
    );
  }

  const institutionIdByName = new Map<string, string>(
    (existingInstitutions || []).map(
      (institution: { id: string; name: string }) => [
        normaliseName(institution.name),
        institution.id,
      ]
    )
  );

  const newInstitutionRecords = SACCO_MASTER_DATA.filter(
    (record) => !institutionIdByName.has(normaliseName(record.name))
  ).map((record) => ({
    name: record.name,
    institution_type: record.institution_type,
    sector: record.sector,
    segment: record.segment,
    tier: record.tier,
    asset_size_billions: record.asset_size_billions,
    ceo_name: record.ceo_name,
    location: record.location,
    website: null,
    email: record.email,
    phone: record.phone,
    source: record.source,
    status: record.status,
    outreach_status: record.outreach_status,
    invoice_status: record.invoice_status,
    registration_status: record.registration_status,
    follow_up_owner: record.follow_up_owner,
    next_action: record.next_action,
    next_follow_up_at: record.next_follow_up_at,
    historical_notes: record.historical_notes,
    assigned_to: user.id,
    created_by: user.id,
  }));

  let institutionsInserted = 0;

  for (const institutionChunk of chunk(newInstitutionRecords, 80)) {
    const { data: inserted, error } = await supabase
      .from("institutions")
      .insert(institutionChunk)
      .select("id, name");

    if (error) {
      redirect(
        `/admin/sacco-import?error=${encodeURIComponent(
          `Institution import stopped: ${error.message}`
        )}`
      );
    }

    for (const institution of inserted || []) {
      institutionIdByName.set(
        normaliseName(institution.name),
        institution.id
      );
    }

    institutionsInserted += inserted?.length || 0;
  }

  const institutionIds = Array.from(
    new Set(
      SACCO_MASTER_DATA.map((record) =>
        institutionIdByName.get(normaliseName(record.name))
      ).filter((value): value is string => Boolean(value))
    )
  );

  const existingContactKeys = new Set<string>();

  for (const idChunk of chunk(institutionIds, 100)) {
    const { data: existingContacts, error } = await supabase
      .from("contacts")
      .select("institution_id, full_name")
      .in("institution_id", idChunk);

    if (error) {
      redirect(
        `/admin/sacco-import?error=${encodeURIComponent(
          `Could not check existing contacts: ${error.message}`
        )}`
      );
    }

    for (const contact of existingContacts || []) {
      existingContactKeys.add(
        `${contact.institution_id}:${normaliseName(contact.full_name)}`
      );
    }
  }

  const contactsToInsert = SACCO_MASTER_DATA.flatMap((record) => {
    const institutionId = institutionIdByName.get(
      normaliseName(record.name)
    );

    if (!institutionId) return [];

    return record.contacts
      .filter(
        (contact) =>
          !existingContactKeys.has(
            `${institutionId}:${normaliseName(contact.full_name)}`
          )
      )
      .map((contact) => ({
        institution_id: institutionId,
        full_name: contact.full_name,
        job_title: contact.job_title,
        department: contact.department,
        email: contact.email,
        phone: contact.phone,
        whatsapp_number: contact.whatsapp_number,
        is_primary: contact.is_primary,
        decision_maker: contact.decision_maker,
        created_by: user.id,
      }));
  });

  let contactsInserted = 0;

  for (const contactChunk of chunk(contactsToInsert, 100)) {
    const { error } = await supabase
      .from("contacts")
      .insert(contactChunk);

    if (error) {
      redirect(
        `/admin/sacco-import?error=${encodeURIComponent(
          `Contacts import stopped: ${error.message}`
        )}`
      );
    }

    contactsInserted += contactChunk.length;
  }

  const institutionsWithImportedHistory = new Set<string>();

  for (const idChunk of chunk(institutionIds, 100)) {
    const { data: existingHistory, error } = await supabase
      .from("interactions")
      .select("institution_id")
      .eq("subject", IMPORT_SUBJECT)
      .in("institution_id", idChunk);

    if (error) {
      redirect(
        `/admin/sacco-import?error=${encodeURIComponent(
          `Could not check interaction history: ${error.message}`
        )}`
      );
    }

    for (const interaction of existingHistory || []) {
      institutionsWithImportedHistory.add(interaction.institution_id);
    }
  }

  const interactionsToInsert = SACCO_MASTER_DATA.flatMap((record) => {
    const institutionId = institutionIdByName.get(
      normaliseName(record.name)
    );

    if (
      !institutionId ||
      !record.interaction ||
      institutionsWithImportedHistory.has(institutionId)
    ) {
      return [];
    }

    return [
      {
        institution_id: institutionId,
        interaction_type: record.interaction.interaction_type,
        subject: IMPORT_SUBJECT,
        conversation_summary:
          record.interaction.conversation_summary,
        customer_feedback: null,
        objections: null,
        kiprod_commitments: null,
        institution_commitments: null,
        outcome: record.interaction.outcome,
        sentiment: record.interaction.sentiment,
        next_action: record.interaction.next_action,
        follow_up_at: record.interaction.follow_up_at,
        occurred_at:
          record.interaction.occurred_at ||
          new Date().toISOString(),
        recorded_by: user.id,
      },
    ];
  });

  let interactionsInserted = 0;

  for (const interactionChunk of chunk(interactionsToInsert, 100)) {
    const { error } = await supabase
      .from("interactions")
      .insert(interactionChunk);

    if (error) {
      redirect(
        `/admin/sacco-import?error=${encodeURIComponent(
          `History import stopped: ${error.message}`
        )}`
      );
    }

    interactionsInserted += interactionChunk.length;
  }

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath("/contacts");
  revalidatePath("/admin");
  revalidatePath("/admin/institutions");
  revalidatePath("/admin/sacco-import");

  redirect(
    `/admin/sacco-import?success=${encodeURIComponent(
      `${institutionsInserted} institutions, ${contactsInserted} contacts and ${interactionsInserted} history records imported. Existing records were preserved.`
    )}`
  );
}