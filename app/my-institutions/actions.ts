"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth";

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

  const {
    data: institution,
    error: institutionError,
  } = await supabase
    .from("institutions")
    .select("id, assigned_to")
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

  let followUpAt: string | null = null;

  if (followUpValue) {
    const followUpDate = new Date(
      followUpValue
    );

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

  if (nextAction || followUpAt) {
    const {
      error: institutionUpdateError,
    } = await supabase
      .from("institutions")
      .update({
        next_action:
          nextAction || null,
        next_follow_up_at:
          followUpAt,
        updated_at:
          new Date().toISOString(),
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
  }

  revalidatePath("/my-workspace");
  revalidatePath("/my-institutions");
  revalidatePath(
    `/my-institutions/${institutionId}`
  );

  redirect(
    `/my-institutions/${institutionId}?success=${encodeURIComponent(
      "Interaction recorded successfully"
    )}`
  );
}