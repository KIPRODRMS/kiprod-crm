"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createContact(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const institutionId = String(
    formData.get("institution_id") || ""
  ).trim();

  const fullName = String(formData.get("full_name") || "").trim();
  const jobTitle = String(formData.get("job_title") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsappNumber = String(
    formData.get("whatsapp_number") || ""
  ).trim();

  const isPrimary = formData.get("is_primary") === "on";
  const decisionMaker = formData.get("decision_maker") === "on";

  if (!institutionId) {
    redirect("/contacts?error=Please select an institution");
  }

  if (!fullName) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Contact name is required"
      )}`
    );
  }

  if (isPrimary) {
    await supabase
      .from("contacts")
      .update({
        is_primary: false,
        updated_at: new Date().toISOString(),
      })
      .eq("institution_id", institutionId);
  }

  const { error } = await supabase.from("contacts").insert({
    institution_id: institutionId,
    full_name: fullName,
    job_title: jobTitle || null,
    department: department || null,
    email: email || null,
    phone: phone || null,
    whatsapp_number: whatsappNumber || null,
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
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institutionId}`);

  redirect(
    `/institutions/${institutionId}?success=${encodeURIComponent(
      "Contact added successfully"
    )}`
  );
}