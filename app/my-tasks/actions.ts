"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth";

const allowedStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

function readField(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) || ""
  ).trim();
}

export async function updateMyTaskStatus(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await requireTeamMember();

  const taskId = readField(
    formData,
    "task_id"
  );

  const status = readField(
    formData,
    "status"
  );

  if (!taskId) {
    redirect(
      "/my-tasks?error=Task is required"
    );
  }

  if (
    !allowedStatuses.includes(status)
  ) {
    redirect(
      "/my-tasks?error=Invalid task status"
    );
  }

  const {
    data: task,
    error: taskError,
  } = await supabase
    .from("tasks")
    .select("id, assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (
    taskError ||
    !task ||
    task.assigned_to !== user.id
  ) {
    redirect(
      "/my-tasks?error=You are not authorised to update that task"
    );
  }

  const updateData: {
    status: string;
    completed_at?: string | null;
    updated_at: string;
  } = {
    status,
    updated_at:
      new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at =
      new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  const { error: updateError } =
    await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("assigned_to", user.id);

  if (updateError) {
    redirect(
      `/my-tasks?error=${encodeURIComponent(
        updateError.message
      )}`
    );
  }

  revalidatePath("/my-tasks");
  revalidatePath("/my-workspace");

  redirect(
    `/my-tasks?success=${encodeURIComponent(
      "Task updated successfully"
    )}`
  );
}