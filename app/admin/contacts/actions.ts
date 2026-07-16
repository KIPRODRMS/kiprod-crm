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

async function validateContact({
  supabase,
  contactId,
  institutionId,
}: {
  supabase: Awaited<
    ReturnType<
      typeof requireSuperAdmin
    >
  >["supabase"];
  contactId: string;
  institutionId: string;
}) {
  const {
    data: contact,
    error,
  } = await supabase
    .from("contacts")
    .select("id, institution_id")
    .eq("id", contactId)
    .maybeSingle();

  if (
    error ||
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
}

async function validateAssignee({
  supabase,
  assignedTo,
}: {
  supabase: Awaited<
    ReturnType<
      typeof requireSuperAdmin
    >
  >["supabase"];
  assignedTo: string;
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
      `/admin/institutions?error=${encodeURIComponent(
        "The selected Team Member is unavailable"
      )}`
    );
  }
}

export async function assignContactOwner(
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

  const assignedTo = readField(
    formData,
    "assigned_to"
  );

  if (!contactId || !institutionId) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Contact and institution are required"
      )}`
    );
  }

  await validateContact({
    supabase,
    contactId,
    institutionId,
  });

  await validateAssignee({
    supabase,
    assignedTo,
  });

  const { error } = await supabase
    .from("contacts")
    .update({
      assigned_to:
        assignedTo || null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", contactId);

  if (error) {
    redirect(
      `/admin/institutions/${institutionId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/contacts");
  revalidatePath("/my-contacts");
  revalidatePath("/my-workspace");
  revalidatePath("/search");
  revalidatePath(
    `/admin/institutions/${institutionId}/edit`
  );
  revalidatePath(
    `/admin/contacts/${contactId}/edit`
  );

  redirect(
    `/admin/institutions/${institutionId}/edit?success=${encodeURIComponent(
      assignedTo
        ? "Contact assigned successfully"
        : "Direct contact assignment removed"
    )}`
  );
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

  await validateContact({
    supabase,
    contactId,
    institutionId,
  });

  const isPrimary =
    formData.get("is_primary") ===
    "on";

  if (isPrimary) {
    const {
      error: primaryError,
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

    if (primaryError) {
      redirect(
        `/admin/contacts/${contactId}/edit?error=${encodeURIComponent(
          primaryError.message
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
  revalidatePath("/my-contacts");
  revalidatePath("/search");
  revalidatePath(
    `/contacts/${contactId}`
  );
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