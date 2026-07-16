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

  const report = {
    employee_id: user.id,
    report_date: reportDate,

    institutions_contacted:
      readField(
        formData,
        "institutions_contacted"
      ) || null,

    activities_completed:
      readField(
        formData,
        "activities_completed"
      ) || null,

    new_leads_identified:
      readField(
        formData,
        "new_leads_identified"
      ) || null,

    meetings_held:
      readField(
        formData,
        "meetings_held"
      ) || null,

    opportunities_progressed:
      readField(
        formData,
        "opportunities_progressed"
      ) || null,

    challenges:
      readField(
        formData,
        "challenges"
      ) || null,

    support_required:
      readField(
        formData,
        "support_required"
      ) || null,

    tomorrow_priorities:
      readField(
        formData,
        "tomorrow_priorities"
      ) || null,

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

  redirect(
    `/my-reports?success=${encodeURIComponent(
      "Weekly report submitted successfully"
    )}`
  );
}