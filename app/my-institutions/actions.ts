"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth";
import {
  CONTROLLED_STAGE_ONE_DOCUMENTS,
  isEngagementStage,
  isStageTransitionAllowed,
  normaliseEngagementStage,
} from "@/lib/engagement";

function readField(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) || ""
  ).trim();
}

export async function recordMyInteraction(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await requireTeamMember();

  const institutionId = readField(
    formData,
    "institution_id"
  );

  const interactionType =
    readField(
      formData,
      "interaction_type"
    ) || "phone_call";

  const subject = readField(
    formData,
    "subject"
  );

  const conversationSummary = readField(
    formData,
    "conversation_summary"
  );

  const customerFeedback = readField(
    formData,
    "customer_feedback"
  );

  const objections = readField(
    formData,
    "objections"
  );

  const outcome = readField(
    formData,
    "outcome"
  );

  const sentiment =
    readField(
      formData,
      "sentiment"
    ) || "not_recorded";

  const nextAction = readField(
    formData,
    "next_action"
  );

  const followUpValue = readField(
    formData,
    "follow_up_at"
  );

  const engagementStage = readField(
    formData,
    "engagement_stage"
  );

  const stageOneDocuments = CONTROLLED_STAGE_ONE_DOCUMENTS.filter(
    (document) => formData.get(document.field) === "on"
  );
  const ilcaFormSent = formData.get("document_ilca_form") === "on";
  const trainingInformationSent =
    formData.get("document_training_information") === "on";
  const trainingRequested = formData.get("training_requested") === "on";

  if (!institutionId) {
    redirect(
      "/my-institutions?error=Institution is required"
    );
  }

  if (!conversationSummary) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Conversation summary is required"
      )}`
    );
  }

  if (!nextAction || !followUpValue) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Every interaction must have a next action and follow-up date."
      )}`
    );
  }

  if (!isEngagementStage(engagementStage)) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Select the institution’s current engagement stage."
      )}`
    );
  }

  const {
    data: institution,
    error: institutionError,
  } = await supabase
    .from("institutions")
    .select("id, assigned_to, outreach_status")
    .eq("id", institutionId)
    .maybeSingle();

  if (
    institutionError ||
    !institution ||
    institution.assigned_to !== user.id
  ) {
    redirect(
      "/my-institutions?error=You are not authorised to update that institution"
    );
  }

  if (
    !isStageTransitionAllowed(
      institution.outreach_status,
      engagementStage
    )
  ) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
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
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Stage 1 is a controlled pack. Select the Institutional Introduction, Ecosystem One-Pager and ILCA Invitation Note together."
      )}`
    );
  }

  if (
    stageOneDocuments.length > 0 &&
    engagementStage !== "stage_1_documents_sent"
  ) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "The controlled Stage 1 pack can only be recorded at the Stage 1 documents sent stage."
      )}`
    );
  }

  if (movingIntoStageOne && !completeStageOnePack) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "All three controlled Stage 1 documents are required before marking Stage 1 documents sent."
      )}`
    );
  }

  if (ilcaFormSent && engagementStage !== "ilca_sent") {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "The ILCA form can only be recorded as sent at the ILCA sent stage, after request/approval."
      )}`
    );
  }

  if (movingIntoIlcaSent && !ilcaFormSent) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Confirm that the ILCA form was sent before marking the ILCA sent stage."
      )}`
    );
  }

  if (trainingInformationSent && !trainingRequested) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        "Training or masterclass information may only be sent when the institution specifically requested training."
      )}`
    );
  }

  let followUpAt: string | null = null;

  if (followUpValue) {
    const followUpDate = new Date(followUpValue);

    if (
      Number.isNaN(
        followUpDate.getTime()
      )
    ) {
      redirect(
        `/my-institutions/${institutionId}?error=${encodeURIComponent(
          "Enter a valid follow-up date"
        )}`
      );
    }

    followUpAt =
      followUpDate.toISOString();
  }

  const documentsSent = [
    ...stageOneDocuments.map((document) => document.label),
    ...(ilcaFormSent ? ["ILCA form"] : []),
    ...(trainingInformationSent
      ? ["Training/masterclass information — specifically requested"]
      : []),
  ];

  const { error: interactionError } =
    await supabase
      .from("interactions")
      .insert({
        institution_id: institutionId,
        interaction_type:
          interactionType,
        subject: subject || null,
        conversation_summary:
          conversationSummary,
        customer_feedback:
          customerFeedback || null,
        objections:
          objections || null,
        kiprod_commitments:
          documentsSent.length > 0
            ? `Documents sent: ${documentsSent.join("; ")}`
            : null,
        outcome: outcome || null,
        sentiment,
        next_action:
          nextAction || null,
        follow_up_at: followUpAt,
        recorded_by: user.id,
      });

  if (interactionError) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        interactionError.message
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
    .eq("id", institutionId)
    .eq("assigned_to", user.id);

  if (institutionUpdateError) {
    redirect(
      `/my-institutions/${institutionId}?error=${encodeURIComponent(
        institutionUpdateError.message
      )}`
    );
  }

  revalidatePath("/my-workspace");
  revalidatePath("/my-institutions");
  revalidatePath(
    `/my-institutions/${institutionId}`
  );
  revalidatePath("/management");
  revalidatePath("/reports");

  redirect(
    `/my-institutions/${institutionId}?success=${encodeURIComponent(
      "Interaction recorded successfully"
    )}`
  );
}
