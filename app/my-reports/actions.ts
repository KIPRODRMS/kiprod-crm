"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth";
import {
  buildDailyActivitySummary,
  type DailyActivityCounts,
} from "@/lib/engagement";

function readField(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) || ""
  ).trim();
}

function readCount(
  formData: FormData,
  fieldName: string
) {
  const value = readField(formData, fieldName);
  const count = Number(value);

  return Number.isInteger(count) && count >= 0 ? count : null;
}

export async function submitMyDailyReport(
  formData: FormData
) {
  const { supabase, user } =
    await requireTeamMember();

  const reportDate = readField(
    formData,
    "report_date"
  );

  if (!reportDate) {
    redirect(
      "/my-reports?error=Report date is required"
    );
  }

  const institutionsContacted = readField(
    formData,
    "institutions_contacted"
  );
  const dailySummary = readField(formData, "daily_summary");
  const newLeadsIdentified = readField(
    formData,
    "new_leads_identified"
  );
  const meetingsHeld = readField(formData, "meetings_held");
  const materialsSent = readField(formData, "materials_sent");
  const followUpSummary = readField(formData, "follow_up_summary");
  const pipelineProgress = readField(formData, "pipeline_progress");
  const challenges = readField(formData, "challenges");
  const supportRequired = readField(formData, "support_required");
  const tomorrowPriorities = readField(
    formData,
    "tomorrow_priorities"
  );

  if (
    !institutionsContacted ||
    !dailySummary ||
    !newLeadsIdentified ||
    !materialsSent ||
    !followUpSummary ||
    !pipelineProgress ||
    !challenges ||
    !tomorrowPriorities
  ) {
    redirect(
      `/my-reports?error=${encodeURIComponent(
        "Complete every daily accountability field. Enter ‘None’ where there was no activity."
      )}#daily-report`
    );
  }

  const counts: DailyActivityCounts = {
    newTargets: readCount(formData, "new_targets_count") ?? -1,
    contactsAttempted: readCount(formData, "contacts_attempted_count") ?? -1,
    calls: readCount(formData, "calls_count") ?? -1,
    whatsapp: readCount(formData, "whatsapp_count") ?? -1,
    emails: readCount(formData, "emails_count") ?? -1,
    meetings: readCount(formData, "meetings_count") ?? -1,
    followUps: readCount(formData, "follow_ups_count") ?? -1,
    stageOnePacks: readCount(formData, "stage_1_packs_count") ?? -1,
    ilcasSent: readCount(formData, "ilcas_sent_count") ?? -1,
  };

  if (Object.values(counts).some((count) => count < 0)) {
    redirect(
      `/my-reports?error=${encodeURIComponent(
        "Daily activity counts must be whole numbers of zero or more."
      )}#daily-report`
    );
  }

  const activitySummary = buildDailyActivitySummary(counts, dailySummary);
  const progressSummary = [
    "Materials sent:",
    materialsSent,
    "",
    "Follow-ups completed:",
    followUpSummary,
    "",
    "Pipeline movements:",
    pipelineProgress,
  ].join("\n");

  const report = {
    employee_id: user.id,
    report_date: reportDate,

    institutions_contacted:
      institutionsContacted,

    activities_completed:
      activitySummary,

    new_leads_identified:
      newLeadsIdentified,

    meetings_held:
      meetingsHeld || null,

    opportunities_progressed:
      progressSummary,

    challenges:
      challenges,

    support_required:
      supportRequired || null,

    tomorrow_priorities:
      tomorrowPriorities,

    status: "submitted",
    submitted_at:
      new Date().toISOString(),
    updated_at:
      new Date().toISOString(),
  };

  const { error } = await supabase
    .from("daily_reports")
    .upsert(report, {
      onConflict:
        "employee_id,report_date",
    });

  if (error) {
    redirect(
      `/my-reports?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/my-reports");
  revalidatePath("/my-workspace");
  revalidatePath("/reports");
  revalidatePath("/management");

  redirect(
    `/my-reports?success=${encodeURIComponent(
      "Daily report submitted successfully"
    )}`
  );
}

export async function submitMyWeeklyReport(
  formData: FormData
) {
  const { supabase, user } =
    await requireTeamMember();

  const weekStart = readField(
    formData,
    "week_start"
  );

  const weekEnd = readField(
    formData,
    "week_end"
  );

  if (!weekStart || !weekEnd) {
    redirect(
      "/my-reports?error=Week start and week end dates are required"
    );
  }

  if (
    new Date(weekEnd).getTime() <
    new Date(weekStart).getTime()
  ) {
    redirect(
      "/my-reports?error=Week end cannot be before week start"
    );
  }

  const report = {
    employee_id: user.id,
    week_start: weekStart,
    week_end: weekEnd,

    weekly_objectives:
      readField(
        formData,
        "weekly_objectives"
      ) || null,

    work_completed:
      readField(
        formData,
        "work_completed"
      ) || null,

    institutions_engaged:
      readField(
        formData,
        "institutions_engaged"
      ) || null,

    pipeline_progress:
      readField(
        formData,
        "pipeline_progress"
      ) || null,

    opportunities_created:
      readField(
        formData,
        "opportunities_created"
      ) || null,

    proposals_sent:
      readField(
        formData,
        "proposals_sent"
      ) || null,

    wins_and_achievements:
      readField(
        formData,
        "wins_and_achievements"
      ) || null,

    delays_and_challenges:
      readField(
        formData,
        "delays_and_challenges"
      ) || null,

    lessons_learned:
      readField(
        formData,
        "lessons_learned"
      ) || null,

    next_week_priorities:
      readField(
        formData,
        "next_week_priorities"
      ) || null,

    support_required:
      readField(
        formData,
        "support_required"
      ) || null,

    status: "submitted",
    submitted_at:
      new Date().toISOString(),
    updated_at:
      new Date().toISOString(),
  };

  const { error } = await supabase
    .from("weekly_reports")
    .upsert(report, {
      onConflict:
        "employee_id,week_start",
    });

  if (error) {
    redirect(
      `/my-reports?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/my-reports");
  revalidatePath("/my-workspace");
  revalidatePath("/reports");
  revalidatePath("/management");

  redirect(
    `/my-reports?success=${encodeURIComponent(
      "Weekly report submitted successfully"
    )}`
  );
}
