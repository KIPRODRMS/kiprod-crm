import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAccessLevel,
  getDashboardPath,
  type AccessLevel,
} from "@/lib/roles";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  role: string | null;
  is_active: boolean | null;
};

export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "id, full_name, email, job_title, department, role, is_active"
      )
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to load the signed-in profile: ${profileError.message}`
    );
  }

  const profile: ProfileRecord = {
    id: user.id,
    full_name: data?.full_name || null,
    email: data?.email || user.email || null,
    job_title: data?.job_title || null,
    department: data?.department || null,
    role: data?.role || null,
    is_active: data?.is_active ?? true,
  };

  if (profile.is_active === false) {
    redirect(
      "/login?error=Your KIPROD CRM account is inactive. Contact a Super Admin."
    );
  }

  const accessLevel = getAccessLevel(
    profile.role
  );

  return {
    supabase,
    user,
    profile,
    accessLevel,
  };
}

export async function requireTeamMember() {
  const context = await requireUser();

  if (context.accessLevel !== "team_member") {
    redirect("/management");
  }

  return context;
}

export async function requireManagement() {
  const context = await requireUser();

  if (context.accessLevel === "team_member") {
    redirect("/my-workspace");
  }

  return context;
}

export async function requireSuperAdmin() {
  const context = await requireUser();

  if (
    context.accessLevel !== "super_admin"
  ) {
    redirect(
      getDashboardPath(context.profile.role)
    );
  }

  return context;
}

export function canAccessAssignedRecord({
  accessLevel,
  userId,
  assignedTo,
}: {
  accessLevel: AccessLevel;
  userId: string;
  assignedTo: string | null | undefined;
}) {
  return (
    accessLevel !== "team_member" ||
    assignedTo === userId
  );
}