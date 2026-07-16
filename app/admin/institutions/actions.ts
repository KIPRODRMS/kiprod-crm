"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";

function readField(
  formData: FormData,
  name: string
) {
  return String(
    formData.get(name) || ""
  ).trim();
}

export async function updateInstitutionAdmin(
  formData: FormData
) {
  const { supabase } =
    await requireSuperAdmin();

  const institutionId = readField(
    formData,
    "institution_id"
  );

  const name = readField(
    formData,
    "name"
  );

  if (!institutionId || !name) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Institution ID and name are required"
      )}`
    );
  }

  const assignedTo = readField(
    formData,
    "assigned_to"
  );

  if (assignedTo) {
    const {
      data: assignedProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", assignedTo)
      .maybeSingle();

    if (
      profileError ||
      !assignedProfile ||
      assignedProfile.is_active ===
        false
    ) {
      redirect(
        `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
          "The selected Team Member is unavailable"
        )}`
      );
    }
  }

  const assetValue = readField(
    formData,
    "asset_size_billions"
  );

  const assetSize =
    assetValue === ""
      ? null
      : Number(assetValue);

  if (
    assetSize !== null &&
    (!Number.isFinite(assetSize) ||
      assetSize < 0)
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

  let nextFollowUpAt:
    | string
    | null = null;

  if (followUpValue) {
    const parsedDate =
      new Date(followUpValue);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      redirect(
        `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
          "Enter a valid follow-up date"
        )}`
      );
    }

    nextFollowUpAt =
      parsedDate.toISOString();
  }

  const { error } = await supabase
    .from("institutions")
    .update({
      name,

      assigned_to:
        assignedTo || null,

      institution_type:
        readField(
          formData,
          "institution_type"
        ) || null,

      sector:
        readField(
          formData,
          "sector"
        ) || null,

      segment:
        readField(
          formData,
          "segment"
        ) || null,

      tier:
        readField(
          formData,
          "tier"
        ) || null,

      asset_size_billions:
        assetSize,

      ceo_name:
        readField(
          formData,
          "ceo_name"
        ) || null,

      location:
        readField(
          formData,
          "location"
        ) || null,

      website:
        readField(
          formData,
          "website"
        ) || null,

      email:
        readField(
          formData,
          "email"
        ) || null,

      phone:
        readField(
          formData,
          "phone"
        ) || null,

      source:
        readField(
          formData,
          "source"
        ) || null,

      status:
        readField(
          formData,
          "status"
        ) || "prospect",

      outreach_status:
        readField(
          formData,
          "outreach_status"
        ) || null,

      invoice_status:
        readField(
          formData,
          "invoice_status"
        ) || null,

      registration_status:
        readField(
          formData,
          "registration_status"
        ) || null,

      follow_up_owner:
        readField(
          formData,
          "follow_up_owner"
        ) || null,

      next_action:
        readField(
          formData,
          "next_action"
        ) || null,

      next_follow_up_at:
        nextFollowUpAt,

      historical_notes:
        readField(
          formData,
          "historical_notes"
        ) || null,

      updated_at:
        new Date().toISOString(),
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
  revalidatePath("/management");
  revalidatePath("/institutions");
  revalidatePath("/my-institutions");
  revalidatePath("/my-contacts");
  revalidatePath("/my-workspace");
  revalidatePath("/search");
  revalidatePath(
    `/institutions/${institutionId}`
  );
  revalidatePath(
    `/my-institutions/${institutionId}`
  );
  revalidatePath(
    "/admin/institutions"
  );
  revalidatePath(
    `/admin/institutions/${institutionId}/edit`
  );

  redirect(
    `/admin/institutions/${institutionId}/edit?success=${encodeURIComponent(
      assignedTo
        ? "Institution assigned and updated successfully"
        : "Institution updated successfully"
    )}`
  );
}