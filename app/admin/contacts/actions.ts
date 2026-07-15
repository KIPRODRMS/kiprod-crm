"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function updateContactAdmin(formData: FormData) {
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

  const contactId = readField(formData, "contact_id");
  const institutionId = readField(formData, "institution_id");
  const fullName = readField(formData, "full_name");

  if (!contactId || !institutionId || !fullName) {
    redirect(
      `/admin/institutions?error=${encodeURIComponent(
        "Contact ID, institution and name are required"
      )}`
    );
  }

  const isPrimary = formData.get("is_primary") === "on";

  if (isPrimary) {
    await supabase
      .from("contacts")
      .update({
        is_primary: false,
        updated_at: new Date().toISOString(),
      })
      .eq("institution_id", institutionId)
      .neq("id", contactId);
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: fullName,
      job_title: readField(formData, "job_title") || null,
      department: readField(formData, "department") || null,
      email: readField(formData, "email") || null,
      phone: readField(formData, "phone") || null,
      whatsapp_number:
        readField(formData, "whatsapp_number") || null,
      is_primary: isPrimary,
      decision_maker:
        formData.get("decision_maker") === "on",
      updated_at: new Date().toISOString(),
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
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath(`/institutions/${institutionId}`);
  revalidatePath(
    `/admin/institutions/${institutionId}/edit`
  );
  revalidatePath(`/admin/contacts/${contactId}/edit`);

  redirect(
    `/admin/contacts/${contactId}/edit?success=${encodeURIComponent(
      "Contact updated successfully"
    )}`
  );
}