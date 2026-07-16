"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagement } from "@/lib/auth";

export async function createContact(
  formData: FormData
) {
  const { supabase, user } =
    await requireManagement();

  const institutionId = String(
    formData.get("institution_id") || ""
  ).trim();

  const fullName = String(
    formData.get("full_name") || ""
  ).trim();

  const jobTitle = String(
    formData.get("job_title") || ""
  ).trim();

  const department = String(
    formData.get("department") || ""
  ).trim();

  const email = String(
    formData.get("email") || ""
  ).trim();

  const phone = String(
    formData.get("phone") || ""
  ).trim();

  const whatsappNumber = String(
    formData.get("whatsapp_number") || ""
  ).trim();

  const isPrimary =
    formData.get("is_primary") === "on";

  const decisionMaker =
    formData.get("decision_maker") ===
    "on";

  if (!institutionId) {
    redirect(
      "/contacts?error=Please select an institution"
    );
  }

  if (!fullName) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Contact name is required"
      )}`
    );
  }

  const {
    data: institution,
    error: institutionError,
  } = await supabase
    .from("institutions")
    .select("id")
    .eq("id", institutionId)
    .maybeSingle();

  if (
    institutionError ||
    !institution
  ) {
    redirect(
      "/contacts?error=The selected institution could not be found"
    );
  }

  if (isPrimary) {
    const {
      error: primaryUpdateError,
    } = await supabase
      .from("contacts")
      .update({
        is_primary: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "institution_id",
        institutionId
      );

    if (primaryUpdateError) {
      redirect(
        `/institutions/${institutionId}?error=${encodeURIComponent(
          primaryUpdateError.message
        )}`
      );
    }
  }

  const { error } = await supabase
    .from("contacts")
    .insert({
      institution_id: institutionId,
      full_name: fullName,
      job_title: jobTitle || null,
      department: department || null,
      email: email || null,
      phone: phone || null,
      whatsapp_number:
        whatsappNumber || null,
      is_primary: isPrimary,
      decision_maker: decisionMaker,
      created_by: user.id,
    });

  if (error) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/contacts");
  revalidatePath("/my-contacts");
  revalidatePath("/institutions");
  revalidatePath(
    `/institutions/${institutionId}`
  );
  revalidatePath(
    `/my-institutions/${institutionId}`
  );

  redirect(
    `/institutions/${institutionId}?success=${encodeURIComponent(
      "Contact added successfully"
    )}`
  );
}