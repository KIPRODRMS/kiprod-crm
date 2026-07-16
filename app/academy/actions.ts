"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagement } from "@/lib/auth";

function readField(
  formData: FormData,
  name: string
) {
  return String(
    formData.get(name) || ""
  ).trim();
}

export async function createCourse(
  formData: FormData
) {
  const { supabase, user } =
    await requireManagement();

  const title = readField(
    formData,
    "title"
  );

  const description = readField(
    formData,
    "description"
  );

  const category = readField(
    formData,
    "category"
  );

  const status =
    readField(formData, "status") ||
    "draft";

  const passingScore = Number(
    readField(
      formData,
      "passing_score"
    ) || "70"
  );

  const estimatedMinutes = Number(
    readField(
      formData,
      "estimated_minutes"
    ) || "0"
  );

  const isMandatory =
    formData.get("is_mandatory") ===
    "on";

  if (!title) {
    redirect(
      "/academy?error=Course title is required"
    );
  }

  if (
    Number.isNaN(passingScore) ||
    passingScore < 0 ||
    passingScore > 100
  ) {
    redirect(
      "/academy?error=Passing score must be between 0 and 100"
    );
  }

  if (
    Number.isNaN(estimatedMinutes) ||
    estimatedMinutes < 0
  ) {
    redirect(
      "/academy?error=Estimated minutes must be zero or more"
    );
  }

  if (
    ![
      "draft",
      "published",
      "archived",
    ].includes(status)
  ) {
    redirect(
      "/academy?error=Invalid course status"
    );
  }

  const { error } = await supabase
    .from("academy_courses")
    .insert({
      title,
      description:
        description || null,
      category: category || null,
      status,
      passing_score: passingScore,
      estimated_minutes:
        estimatedMinutes,
      is_mandatory: isMandatory,
      created_by: user.id,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/management");
  revalidatePath("/academy");
  revalidatePath("/my-academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Course created successfully"
    )}`
  );
}

export async function createModule(
  formData: FormData
) {
  const { supabase } =
    await requireManagement();

  const courseId = readField(
    formData,
    "course_id"
  );

  const title = readField(
    formData,
    "title"
  );

  const description = readField(
    formData,
    "description"
  );

  const moduleOrder = Number(
    readField(
      formData,
      "module_order"
    ) || "1"
  );

  if (!courseId || !title) {
    redirect(
      "/academy?error=Course and module title are required"
    );
  }

  if (
    !Number.isInteger(moduleOrder) ||
    moduleOrder < 1
  ) {
    redirect(
      "/academy?error=Module order must be a positive whole number"
    );
  }

  const {
    data: course,
    error: courseError,
  } = await supabase
    .from("academy_courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    redirect(
      "/academy?error=The selected course could not be found"
    );
  }

  const { error } = await supabase
    .from("academy_modules")
    .insert({
      course_id: courseId,
      title,
      description:
        description || null,
      module_order: moduleOrder,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/academy");
  revalidatePath("/my-academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Module added successfully"
    )}`
  );
}

export async function createLesson(
  formData: FormData
) {
  const { supabase } =
    await requireManagement();

  const moduleId = readField(
    formData,
    "module_id"
  );

  const title = readField(
    formData,
    "title"
  );

  const content = readField(
    formData,
    "content"
  );

  const videoUrl = readField(
    formData,
    "video_url"
  );

  const documentUrl = readField(
    formData,
    "document_url"
  );

  const lessonOrder = Number(
    readField(
      formData,
      "lesson_order"
    ) || "1"
  );

  const estimatedMinutes = Number(
    readField(
      formData,
      "estimated_minutes"
    ) || "0"
  );

  if (!moduleId || !title) {
    redirect(
      "/academy?error=Module and lesson title are required"
    );
  }

  if (
    !Number.isInteger(lessonOrder) ||
    lessonOrder < 1
  ) {
    redirect(
      "/academy?error=Lesson order must be a positive whole number"
    );
  }

  if (
    Number.isNaN(estimatedMinutes) ||
    estimatedMinutes < 0
  ) {
    redirect(
      "/academy?error=Estimated minutes must be zero or more"
    );
  }

  const {
    data: module,
    error: moduleError,
  } = await supabase
    .from("academy_modules")
    .select("id")
    .eq("id", moduleId)
    .maybeSingle();

  if (moduleError || !module) {
    redirect(
      "/academy?error=The selected module could not be found"
    );
  }

  const { error } = await supabase
    .from("academy_lessons")
    .insert({
      module_id: moduleId,
      title,
      lesson_order: lessonOrder,
      content: content || null,
      video_url: videoUrl || null,
      document_url:
        documentUrl || null,
      estimated_minutes:
        estimatedMinutes,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/academy");
  revalidatePath("/my-academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Lesson added successfully"
    )}`
  );
}

export async function enrollEmployee(
  formData: FormData
) {
  const { supabase, user } =
    await requireManagement();

  const courseId = readField(
    formData,
    "course_id"
  );

  const employeeId = readField(
    formData,
    "employee_id"
  );

  if (!courseId || !employeeId) {
    redirect(
      "/academy?error=Select a course and team member"
    );
  }

  const [
    courseResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("academy_courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", employeeId)
      .maybeSingle(),
  ]);

  if (
    courseResult.error ||
    !courseResult.data
  ) {
    redirect(
      "/academy?error=The selected course could not be found"
    );
  }

  if (
    profileResult.error ||
    !profileResult.data ||
    profileResult.data.is_active ===
      false
  ) {
    redirect(
      "/academy?error=The selected team member is unavailable"
    );
  }

  const { error } = await supabase
    .from("academy_enrollments")
    .upsert(
      {
        course_id: courseId,
        employee_id: employeeId,
        assigned_by: user.id,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "course_id,employee_id",
      }
    );

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/management");
  revalidatePath("/academy");
  revalidatePath("/my-academy");
  revalidatePath("/my-workspace");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Team member enrolled successfully"
    )}`
  );
}