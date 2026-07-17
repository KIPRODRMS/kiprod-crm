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

function withMessage(
  returnUrl: string,
  key: "success" | "error",
  message: string
) {
  const separator =
    returnUrl.includes("?")
      ? "&"
      : "?";

  return `${returnUrl}${separator}${key}=${encodeURIComponent(
    message
  )}`;
}

export async function bulkAssignInstitutions(
  formData: FormData
) {
  const { supabase } =
    await requireSuperAdmin();

  const institutionIds =
    Array.from(
      new Set(
        formData
          .getAll("institution_ids")
          .map((value) =>
            String(value).trim()
          )
          .filter(Boolean)
      )
    );

  const assignmentMode = readField(
    formData,
    "assignment_mode"
  );

  const selectedAssignee = readField(
    formData,
    "assigned_to"
  );

  const requestedReturnUrl = readField(
    formData,
    "return_url"
  );

  const returnUrl =
    requestedReturnUrl.startsWith(
      "/admin/institutions"
    )
      ? requestedReturnUrl
      : "/admin/institutions";

  if (institutionIds.length === 0) {
    redirect(
      withMessage(
        returnUrl,
        "error",
        "Select at least one institution"
      )
    );
  }

  if (institutionIds.length > 500) {
    redirect(
      withMessage(
        returnUrl,
        "error",
        "Assign a maximum of 500 institutions at once"
      )
    );
  }

  if (
    assignmentMode !== "assign" &&
    assignmentMode !== "unassign"
  ) {
    redirect(
      withMessage(
        returnUrl,
        "error",
        "Choose whether to assign or unassign the selected institutions"
      )
    );
  }

  if (
    assignmentMode === "assign" &&
    !selectedAssignee
  ) {
    redirect(
      withMessage(
        returnUrl,
        "error",
        "Choose a Team Member in the Assign To field"
      )
    );
  }

  const assignedTo =
    assignmentMode === "unassign"
      ? ""
      : selectedAssignee;

  if (assignedTo) {
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", assignedTo)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.is_active === false
    ) {
      redirect(
        withMessage(
          returnUrl,
          "error",
          "The selected Team Member is unavailable"
        )
      );
    }
  }

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
    redirect(
      withMessage(
        returnUrl,
        "error",
        error.message
      )
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

  redirect(
    withMessage(
      returnUrl,
      "success",
      assignedTo
        ? `${institutionIds.length} institutions assigned successfully`
        : `${institutionIds.length} institutions unassigned successfully`
    )
  );
}