"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
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

  return supabase;
}

export async function updateInstitutionAdmin(formData: FormData) {
  const supabase = await requireAdmin();

  const institutionId = readField(formData, "institution_id");
  const name = readField(formData, "name");

  if (!institutionId || !name) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Institution ID and name are required"
      )}`
    );
  }

  const assetValue = readField(formData, "asset_size_billions");
  const assetSize = assetValue === "" ? null : Number(assetValue);

  if (
    assetSize !== null &&
    (!Number.isFinite(assetSize) || assetSize < 0)
  ) {
    redirect(
      `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
        "Enter a valid asset size"
      )}`
    );
  }

  const followUpValue = readField(
    formData,
    "next_follow_up_at"
  );

  let nextFollowUpAt: string | null = null;

  if (followUpValue) {
    const parsed = new Date(followUpValue);

    if (Number.isNaN(parsed.getTime())) {
      redirect(
        `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
          "Enter a valid follow-up date"
        )}`
      );
    }

    nextFollowUpAt = parsed.toISOString();
  }

  const { error } = await supabase
    .from("institutions")
    .update({
      name,
      institution_type:
        readField(formData, "institution_type") || null,
      sector: readField(formData, "sector") || null,
      segment: readField(formData, "segment") || null,
      tier: readField(formData, "tier") || null,
      asset_size_billions: assetSize,
      ceo_name: readField(formData, "ceo_name") || null,
      location: readField(formData, "location") || null,
      website: readField(formData, "website") || null,
      email: readField(formData, "email") || null,
      phone: readField(formData, "phone") || null,
      source: readField(formData, "source") || null,
      status: readField(formData, "status") || "prospect",
      outreach_status:
        readField(formData, "outreach_status") || null,
      invoice_status:
        readField(formData, "invoice_status") || null,
      registration_status:
        readField(formData, "registration_status") || null,
      follow_up_owner:
        readField(formData, "follow_up_owner") || null,
      next_action: readField(formData, "next_action") || null,
      next_follow_up_at: nextFollowUpAt,
      historical_notes:
        readField(formData, "historical_notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", institutionId);

  if (error) {
    redirect(
      `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institutionId}`);
  revalidatePath("/admin/institutions");
  revalidatePath(
    `/admin/institutions/${institutionId}/edit`
  );

  redirect(
    `/admin/institutions/${institutionId}/edit?success=${encodeURIComponent(
      "Institution updated successfully"
    )}`
  );
}