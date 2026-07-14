"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOpportunity(formData: FormData) {
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

  const contactId = String(formData.get("contact_id") || "").trim();

  const stageId = String(formData.get("stage_id") || "").trim();

  const title = String(formData.get("title") || "").trim();

  const serviceCategory = String(
    formData.get("service_category") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const estimatedValueRaw = String(
    formData.get("estimated_value") || "0"
  ).trim();

  const expectedCloseDate = String(
    formData.get("expected_close_date") || ""
  ).trim();

  const nextAction = String(
    formData.get("next_action") || ""
  ).trim();

  const followUpValue = String(
    formData.get("next_follow_up_at") || ""
  ).trim();

  const notes = String(formData.get("notes") || "").trim();

  if (!institutionId) {
    redirect("/opportunities?error=Please select an institution");
  }

  if (!stageId) {
    redirect("/opportunities?error=Please select a pipeline stage");
  }

  if (!title) {
    redirect("/opportunities?error=Opportunity title is required");
  }

  const estimatedValue = Number(estimatedValueRaw);

  if (Number.isNaN(estimatedValue) || estimatedValue < 0) {
    redirect("/opportunities?error=Enter a valid opportunity value");
  }

  const { data: stage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("probability")
    .eq("id", stageId)
    .single();

  if (stageError || !stage) {
    redirect("/opportunities?error=Invalid pipeline stage");
  }

  const followUpAt = followUpValue
    ? new Date(followUpValue).toISOString()
    : null;

  const { error } = await supabase.from("opportunities").insert({
    institution_id: institutionId,
    contact_id: contactId || null,
    stage_id: stageId,
    title,
    service_category: serviceCategory || null,
    description: description || null,
    estimated_value: estimatedValue,
    probability: stage.probability,
    status: "open",
    expected_close_date: expectedCloseDate || null,
    next_action: nextAction || null,
    next_follow_up_at: followUpAt,
    notes: notes || null,
    assigned_to: user.id,
    created_by: user.id,
  });

  if (error) {
    redirect(
      `/opportunities?error=${encodeURIComponent(error.message)}`
    );
  }

  await supabase
    .from("institutions")
    .update({
      status: "active_opportunity",
      next_action: nextAction || null,
      next_follow_up_at: followUpAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", institutionId);

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institutionId}`);
  revalidatePath("/opportunities");

  redirect(
    `/opportunities?success=${encodeURIComponent(
      "Opportunity created successfully"
    )}`
  );
}