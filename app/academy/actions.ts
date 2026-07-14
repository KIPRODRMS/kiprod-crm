"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createCourse(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const category = readField(formData, "category");
  const status = readField(formData, "status") || "draft";

  const passingScore = Number(
    readField(formData, "passing_score") || "70"
  );

  const estimatedMinutes = Number(
    readField(formData, "estimated_minutes") || "0"
  );

  const isMandatory =
    formData.get("is_mandatory") === "on";

  if (!title) {
    redirect("/academy?error=Course title is required");
  }

  if (
    Number.isNaN(passingScore) ||
    passingScore < 0 ||
    passingScore > 100
  ) {
    redirect("/academy?error=Passing score must be between 0 and 100");
  }

  const { error } = await supabase
    .from("academy_courses")
    .insert({
      title,
      description: description || null,
      category: category || null,
      status,
      passing_score: passingScore,
      estimated_minutes: estimatedMinutes,
      is_mandatory: isMandatory,
      created_by: user.id,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Course created successfully"
    )}`
  );
}

export async function createModule(formData: FormData) {
  const { supabase } = await requireUser();

  const courseId = readField(formData, "course_id");
  const title = readField(formData, "title");
  const description = readField(formData, "description");

  const moduleOrder = Number(
    readField(formData, "module_order") || "1"
  );

  if (!courseId || !title) {
    redirect(
      "/academy?error=Course and module title are required"
    );
  }

  const { error } = await supabase
    .from("academy_modules")
    .insert({
      course_id: courseId,
      title,
      description: description || null,
      module_order: moduleOrder,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Module added successfully"
    )}`
  );
}

export async function createLesson(formData: FormData) {
  const { supabase } = await requireUser();

  const moduleId = readField(formData, "module_id");
  const title = readField(formData, "title");
  const content = readField(formData, "content");
  const videoUrl = readField(formData, "video_url");
  const documentUrl = readField(formData, "document_url");

  const lessonOrder = Number(
    readField(formData, "lesson_order") || "1"
  );

  const estimatedMinutes = Number(
    readField(formData, "estimated_minutes") || "0"
  );

  if (!moduleId || !title) {
    redirect(
      "/academy?error=Module and lesson title are required"
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
      document_url: documentUrl || null,
      estimated_minutes: estimatedMinutes,
    });

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Lesson added successfully"
    )}`
  );
}

export async function enrollEmployee(formData: FormData) {
  const { supabase, user } = await requireUser();

  const courseId = readField(formData, "course_id");
  const employeeId = readField(formData, "employee_id");

  if (!courseId || !employeeId) {
    redirect(
      "/academy?error=Select a course and employee"
    );
  }

  const { error } = await supabase
    .from("academy_enrollments")
    .upsert(
      {
        course_id: courseId,
        employee_id: employeeId,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "course_id,employee_id",
      }
    );

  if (error) {
    redirect(
      `/academy?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/academy");

  redirect(
    `/academy?success=${encodeURIComponent(
      "Employee enrolled successfully"
    )}`
  );
}