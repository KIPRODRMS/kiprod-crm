"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const taskType = String(formData.get("task_type") || "other");
  const priority = String(formData.get("priority") || "medium");

  const institutionId = String(
    formData.get("institution_id") || ""
  ).trim();

  const contactId = String(formData.get("contact_id") || "").trim();

  const opportunityId = String(
    formData.get("opportunity_id") || ""
  ).trim();

  const assignedTo = String(formData.get("assigned_to") || "").trim();
  const dueAtValue = String(formData.get("due_at") || "").trim();

  if (!title) {
    redirect("/tasks?error=Task title is required");
  }

  if (!assignedTo) {
    redirect("/tasks?error=Please select the responsible employee");
  }

  let dueAt: string | null = null;

  if (dueAtValue) {
    const dueDate = new Date(dueAtValue);

    if (Number.isNaN(dueDate.getTime())) {
      redirect("/tasks?error=Enter a valid task deadline");
    }

    dueAt = dueDate.toISOString();
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    description: description || null,
    task_type: taskType,
    priority,
    status: "not_started",
    institution_id: institutionId || null,
    contact_id: contactId || null,
    opportunity_id: opportunityId || null,
    assigned_to: assignedTo,
    assigned_by: user.id,
    due_at: dueAt,
    created_by: user.id,
  });

  if (error) {
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/tasks");

  if (institutionId) {
    revalidatePath(`/institutions/${institutionId}`);
  }

  redirect(
    `/tasks?success=${encodeURIComponent(
      "Task assigned successfully"
    )}`
  );
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const taskId = String(formData.get("task_id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  const completionNotes = String(
    formData.get("completion_notes") || ""
  ).trim();

  const blockerReason = String(
    formData.get("blocker_reason") || ""
  ).trim();

  const validStatuses = [
    "not_started",
    "in_progress",
    "completed",
    "blocked",
    "cancelled",
  ];

  if (!taskId || !validStatuses.includes(status)) {
    redirect("/tasks?error=Invalid task update");
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completion_notes:
        status === "completed" ? completionNotes || null : null,
      blocker_reason:
        status === "blocked" ? blockerReason || null : null,
      completed_at:
        status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/tasks");

  redirect(
    `/tasks?success=${encodeURIComponent(
      "Task updated successfully"
    )}`
  );
}