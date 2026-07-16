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

async function validateAssignee({
  supabase,
  assignedTo,
  errorPath,
}: {
  supabase: Awaited<
    ReturnType<
      typeof requireSuperAdmin
    >
  >["supabase"];
  assignedTo: string;
  errorPath: string;
}) {
  if (!assignedTo) {
    return;
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", assignedTo)
    .maybeSingle();

  if (
    error ||
    !profile ||
    profile.is_active === false
  ) {
    redirect(
      `${errorPath}?error=${encodeURIComponent(
        "The selected Team Member is unavailable"
      )}`
    );
  }
}

export async function bulkAssignInstitutions(
  formData: FormData
) {
  const { supabase } =
    await requireSuperAdmin();

  const institutionIds =
    formData
      .getAll("institution_ids")
      .map((value) =>
        String(value).trim()
      )
      .filter(Boolean);

  const assignedTo = readField(
    formData,
    "assigned_to"
  );

  const requestedReturnUrl =
    readField(
      formData,
      "return_url"
    );

  const returnUrl =
    requestedReturnUrl.startsWith(
      "/admin/institutions"
    )
      ? requestedReturnUrl
      : "/admin/institutions";

  if (
    institutionIds.length === 0
  ) {
    const separator =
      returnUrl.includes("?")
        ? "&"
        : "?";

    redirect(
      `${returnUrl}${separator}error=${encodeURIComponent(
        "Select at least one institution"
      )}`
    );
  }

  if (
    institutionIds.length > 500
  ) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Assign a maximum of 500 institutions at once"
      )}`
    );
  }

  await validateAssignee({
    supabase,
    assignedTo,
    errorPath:
      "/admin/institutions",
  });

  const { error } = await supabase
    .from("institutions")
    .update({
      assigned_to:
        assignedTo || null,
      updated_at:
        new Date().toISOString(),
    })
    .in("id", institutionIds);

  if (error) {
    const separator =
      returnUrl.includes("?")
        ? "&"
        : "?";

    redirect(
      `${returnUrl}${separator}error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/management");
  revalidatePath("/institutions");
  revalidatePath(
    "/admin/institutions"
  );
  revalidatePath(
    "/my-institutions"
  );
  revalidatePath("/my-contacts");
  revalidatePath("/my-workspace");
  revalidatePath("/search");

  const separator =
    returnUrl.includes("?")
      ? "&"
      : "?";

  redirect(
    `${returnUrl}${separator}success=${encodeURIComponent(
      assignedTo
        ? `${institutionIds.length} institutions assigned successfully`
        : `${institutionIds.length} institutions unassigned successfully`
    )}`
  );
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

  await validateAssignee({
    supabase,
    assignedTo,
    errorPath:
      `/admin/institutions/${institutionId}/edit`,
  });

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
  revalidatePath(
    "/admin/institutions"
  );
  revalidatePath(
    "/my-institutions"
  );
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