"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagement } from "@/lib/auth";

const reportTables = {
  daily: "daily_reports",
  weekly: "weekly_reports",
} as const;

const allowedStatuses = new Set([
  "submitted",
  "reviewed",
  "returned",
]);

function readField(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function reportsRedirect(
  returnTo: string,
  key: "success" | "error",
  message: string
) {
  const url = new URL(
    returnTo.startsWith("/reports") ? returnTo : "/reports",
    "https://kiprod.local"
  );

  if (url.pathname !== "/reports") {
    url.pathname = "/reports";
    url.search = "";
    url.hash = "";
  }

  url.searchParams.delete("success");
  url.searchParams.delete("error");
  url.searchParams.set(key, message);

  redirect(`${url.pathname}${url.search}${url.hash}`);
}

export async function reviewTeamReport(formData: FormData) {
  const { supabase } = await requireManagement();

  const reportType = readField(formData, "report_type");
  const reportId = readField(formData, "report_id");
  const status = readField(formData, "status");
  const managerFeedback = readField(
    formData,
    "manager_feedback"
  );
  const returnTo = readField(formData, "return_to") || "/reports";

  if (!(reportType in reportTables) || !reportId) {
    reportsRedirect(returnTo, "error", "The selected report is invalid.");
  }

  if (!allowedStatuses.has(status)) {
    reportsRedirect(returnTo, "error", "Select a valid review status.");
  }

  if (status === "returned" && !managerFeedback) {
    reportsRedirect(
      returnTo,
      "error",
      "Add feedback before returning a report to the team member."
    );
  }

  const table = reportTables[reportType as keyof typeof reportTables];

  const { data: existingReport, error: lookupError } = await supabase
    .from(table)
    .select("id")
    .eq("id", reportId)
    .maybeSingle();

  if (lookupError || !existingReport) {
    reportsRedirect(
      returnTo,
      "error",
      lookupError?.message || "The report could not be found."
    );
  }

  const { error } = await supabase
    .from(table)
    .update({
      status,
      manager_feedback: managerFeedback || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    reportsRedirect(returnTo, "error", error.message);
  }

  revalidatePath("/reports");
  revalidatePath("/management");
  revalidatePath("/my-reports");
  revalidatePath("/my-workspace");

  reportsRedirect(
    returnTo,
    "success",
    status === "reviewed"
      ? "Report reviewed successfully."
      : status === "returned"
        ? "Report returned with management feedback."
        : "Report moved back to awaiting review."
  );
}
