"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";

const allowedRoles = [
  "employee",
  "management",
  "super_admin",
];

function readField(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) || ""
  ).trim();
}

export async function updateUserAccess(
  formData: FormData
) {
  const {
    supabase,
    user,
  } = await requireSuperAdmin();

  const profileId = readField(
    formData,
    "profile_id"
  );

  const role = readField(
    formData,
    "role"
  );

  const activeValue = readField(
    formData,
    "is_active"
  );

  if (!profileId) {
    redirect(
      "/admin?error=User account is required"
    );
  }

  if (!allowedRoles.includes(role)) {
    redirect(
      "/admin?error=Invalid access level"
    );
  }

  if (
    activeValue !== "true" &&
    activeValue !== "false"
  ) {
    redirect(
      "/admin?error=Invalid account status"
    );
  }

  if (profileId === user.id) {
    redirect(
      "/admin?error=You cannot change your own access from this screen. Another Super Admin must make that change."
    );
  }

  const {
    data: targetProfile,
    error: targetError,
  } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, is_active"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (
    targetError ||
    !targetProfile
  ) {
    redirect(
      "/admin?error=The selected user account could not be found"
    );
  }

  const isBeingRemovedAsSuperAdmin =
    targetProfile.role ===
      "super_admin" &&
    (role !== "super_admin" ||
      activeValue === "false");

  if (isBeingRemovedAsSuperAdmin) {
    const {
      count,
      error: countError,
    } = await supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("role", "super_admin")
      .eq("is_active", true);

    if (countError) {
      redirect(
        `/admin?error=${encodeURIComponent(
          countError.message
        )}`
      );
    }

    if ((count || 0) <= 1) {
      redirect(
        "/admin?error=The final active Super Admin cannot be removed or deactivated"
      );
    }
  }

  const { error: updateError } =
    await supabase
      .from("profiles")
      .update({
        role,
        is_active:
          activeValue === "true",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", profileId);

  if (updateError) {
    redirect(
      `/admin?error=${encodeURIComponent(
        updateError.message
      )}`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/management");
  revalidatePath("/profile");

  const displayName =
    targetProfile.full_name ||
    targetProfile.email ||
    "User account";

  redirect(
    `/admin?success=${encodeURIComponent(
      `${displayName}'s access was updated successfully`
    )}`
  );
}