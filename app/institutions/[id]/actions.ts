"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagement } from "@/lib/auth";
import {
  CONTROLLED_STAGE_ONE_DOCUMENTS,
  isEngagementStage,
  isStageTransitionAllowed,
  normaliseEngagementStage,
} from "@/lib/engagement";

export async function recordInteraction(formData: FormData) {
  const { supabase, user } = await requireManagement();

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

  const engagementStage = String(
    formData.get("engagement_stage") || ""
  ).trim();
  const stageOneDocuments = CONTROLLED_STAGE_ONE_DOCUMENTS.filter(
    (document) => formData.get(document.field) === "on"
  );
  const ilcaFormSent = formData.get("document_ilca_form") === "on";
  const trainingInformationSent =
    formData.get("document_training_information") === "on";
  const trainingRequested = formData.get("training_requested") === "on";

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

  if (!nextAction || !followUpValue) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Every interaction must have a next action and follow-up date."
      )}`
    );
  }

  if (!isEngagementStage(engagementStage)) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Select the institution’s current engagement stage."
      )}`
    );
  }

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select("id, outreach_status")
    .eq("id", institutionId)
    .maybeSingle();

  if (institutionError || !institution) {
    redirect(
      `/institutions?error=${encodeURIComponent(
        institutionError?.message || "Institution not found."
      )}`
    );
  }

  if (!isStageTransitionAllowed(institution.outreach_status, engagementStage)) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "The engagement stage cannot skip steps or move backwards. Follow: Target identified → Contact verified → Intro contact made → Stage 1 documents sent → Interest expressed → ILCA requested/approved → ILCA sent."
      )}`
    );
  }

  const currentStage = normaliseEngagementStage(
    institution.outreach_status
  );
  const movingIntoStageOne =
    engagementStage === "stage_1_documents_sent" &&
    currentStage !== "stage_1_documents_sent";
  const movingIntoIlcaSent =
    engagementStage === "ilca_sent" && currentStage !== "ilca_sent";

  const completeStageOnePack =
    stageOneDocuments.length === CONTROLLED_STAGE_ONE_DOCUMENTS.length;

  if (stageOneDocuments.length > 0 && !completeStageOnePack) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Stage 1 is a controlled pack. Select the Institutional Introduction, Ecosystem One-Pager and ILCA Invitation Note together."
      )}`
    );
  }

  if (
    stageOneDocuments.length > 0 &&
    engagementStage !== "stage_1_documents_sent"
  ) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "The controlled Stage 1 pack can only be recorded at the Stage 1 documents sent stage."
      )}`
    );
  }

  if (movingIntoStageOne && !completeStageOnePack) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "All three controlled Stage 1 documents are required before marking Stage 1 documents sent."
      )}`
    );
  }

  if (ilcaFormSent && engagementStage !== "ilca_sent") {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "The ILCA form can only be recorded as sent at the ILCA sent stage, after request/approval."
      )}`
    );
  }

  if (movingIntoIlcaSent && !ilcaFormSent) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Confirm that the ILCA form was sent before marking the ILCA sent stage."
      )}`
    );
  }

  if (trainingInformationSent && !trainingRequested) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Training or masterclass information may only be sent when the institution specifically requested training."
      )}`
    );
  }

  const followUpDate = new Date(followUpValue);

  if (Number.isNaN(followUpDate.getTime())) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        "Enter a valid follow-up date."
      )}`
    );
  }

  const followUpAt = followUpDate.toISOString();
  const documentsSent = [
    ...stageOneDocuments.map((document) => document.label),
    ...(ilcaFormSent ? ["ILCA form"] : []),
    ...(trainingInformationSent
      ? ["Training/masterclass information — specifically requested"]
      : []),
  ];
  const controlledDocumentLog =
    documentsSent.length > 0
      ? `Documents sent: ${documentsSent.join("; ")}`
      : "";
  const combinedKiprodCommitments = [
    controlledDocumentLog,
    kiprodCommitments,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { error } = await supabase.from("interactions").insert({
    institution_id: institutionId,
    interaction_type: interactionType,
    subject: subject || null,
    conversation_summary: conversationSummary,
    customer_feedback: customerFeedback || null,
    objections: objections || null,
    kiprod_commitments: combinedKiprodCommitments || null,
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

  const { error: institutionUpdateError } = await supabase
    .from("institutions")
    .update({
      outreach_status: engagementStage,
      next_action: nextAction,
      next_follow_up_at: followUpAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", institutionId);

  if (institutionUpdateError) {
    redirect(
      `/institutions/${institutionId}?error=${encodeURIComponent(
        institutionUpdateError.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${institutionId}`);
  revalidatePath("/management");
  revalidatePath("/reports");
  revalidatePath("/my-institutions");
  revalidatePath("/my-workspace");

  redirect(
    `/institutions/${institutionId}?success=${encodeURIComponent(
      "Conversation recorded successfully"
    )}`
  );
}
