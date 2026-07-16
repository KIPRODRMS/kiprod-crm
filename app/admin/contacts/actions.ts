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

export async function updateContactAdmin(
  formData: FormData
) {
  const { supabase } =
    await requireSuperAdmin();

  const contactId = readField(
    formData,
    "contact_id"
  );

  const institutionId = readField(
    formData,
    "institution_id"
  );

  const fullName = readField(
    formData,
    "full_name"
  );

  if (
    !contactId ||
    !institutionId ||
    !fullName
  ) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Contact ID, institution and name are required"
      )}`
    );
  }

  const {
    data: contact,
    error: contactLookupError,
  } = await supabase
    .from("contacts")
    .select("id, institution_id")
    .eq("id", contactId)
    .maybeSingle();

  if (
    contactLookupError ||
    !contact ||
    contact.institution_id !==
      institutionId
  ) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "The selected contact could not be found"
      )}`
    );
  }

  const isPrimary =
    formData.get("is_primary") ===
    "on";

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
      )
      .neq("id", contactId);

    if (primaryUpdateError) {
      redirect(
        `/admin/contacts/${contactId}/edit?error=${encodeURIComponent(
          primaryUpdateError.message
        )}`
      );
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: fullName,

      job_title:
        readField(
          formData,
          "job_title"
        ) || null,

      department:
        readField(
          formData,
          "department"
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

      whatsapp_number:
        readField(
          formData,
          "whatsapp_number"
        ) || null,

      is_primary: isPrimary,

      decision_maker:
        formData.get(
          "decision_maker"
        ) === "on",

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) {
    redirect(
      `/admin/contacts/${contactId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/contacts");
  revalidatePath(
    `/contacts/${contactId}`
  );
  revalidatePath("/my-contacts");
  revalidatePath(
    `/institutions/${institutionId}`
  );
  revalidatePath(
    `/my-institutions/${institutionId}`
  );
  revalidatePath(
    `/admin/institutions/${institutionId}/edit`
  );
  revalidatePath(
    `/admin/contacts/${contactId}/edit`
  );

  redirect(
    `/admin/contacts/${contactId}/edit?success=${encodeURIComponent(
      "Contact updated successfully"
    )}`
  );
}