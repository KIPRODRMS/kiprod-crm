"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function recordInteraction(formData: FormData) {
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

  const interactionType = String(
    formData.get("interaction_type") || "phone_call"
  ).trim();

  const subject = String(formData.get("subject") || "").trim();

  const conversationSummary = String(
    formData.get("conversation_summary") || ""
  ).trim();

  const customerFeedback = String(
    formData.get("customer_feedback") || ""
  ).trim();

  const objections = String(
    formData.get("objections") || ""
  ).trim();

  const kiprodCommitments = String(
    formData.get("kiprod_commitments") || ""
  ).trim();

  const institutionCommitments = String(
    formData.get("institution_commitments") || ""
  ).trim();

  const outcome = String(formData.get("outcome") || "").trim();

  const sentiment = String(
    formData.get("sentiment") || "not_recorded"
  ).trim();

  const nextAction = String(
    formData.get("next_action") || ""
  ).trim();

  const followUpValue = String(
    formData.get("follow_up_at") || ""
  ).trim();

  if (!institutionId) {
    redirect("/institutions?error=Institution is required");
  }

  if (!conversationSummary) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Conversation summary is required"
      )}`
    );
  }

  const followUpAt = followUpValue
    ? new Date(followUpValue).toISOString()
    : null;

  const { error } = await supabase.from("interactions").insert({
    institution_id: institutionId,
    interaction_type: interactionType,
    subject: subject || null,
    conversation_summary: conversationSummary,
    customer_feedback: customerFeedback || null,
    objections: objections || null,
    kiprod_commitments: kiprodCommitments || null,
    institution_commitments: institutionCommitments || null,
    outcome: outcome || null,
    sentiment,
    next_action: nextAction || null,
    follow_up_at: followUpAt,
    recorded_by: user.id,
  });

  if (error) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  if (nextAction || followUpAt) {
    await supabase
      .from("institutions")
      .update({
        next_action: nextAction || null,
        next_follow_up_at: followUpAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", institutionId);
  }

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institutionId}`);

  redirect(
    `/institutions/${institutionId}?success=${encodeURIComponent(
      "Conversation recorded successfully"
    )}`
  );
}