import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createCourse,
  createLesson,
  createModule,
  enrollEmployee,
} from "./actions";

type AcademyPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatLabel(value: string | null) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-amber-500";

const labelClass =
  "mb-2 block text-xs font-black uppercase tracking-wide text-slate-600";

export default async function AcademyPage({
  searchParams,
}: AcademyPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [
    profileResult,
    profilesResult,
    coursesResult,
    modulesResult,
    lessonsResult,
    enrollmentsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, full_name, email, job_title")
      .eq("is_active", true)
      .order("full_name"),

    supabase
      .from("academy_courses")
      .select(`
        id,
        title,
        description,
        category,
        status,
        passing_score,
        estimated_minutes,
        is_mandatory,
        created_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("academy_modules")
      .select(`
        id,
        course_id,
        title,
        description,
        module_order
      `)
      .order("module_order"),

    supabase
      .from("academy_lessons")
      .select(`
        id,
        module_id,
        title,
        lesson_order,
        content,
        video_url,
        document_url,
        estimated_minutes
      `)
      .order("lesson_order"),

    supabase
      .from("academy_enrollments")
      .select(`
        id,
        course_id,
        employee_id,
        progress_percentage,
        final_score,
        started_at,
        completed_at,
        created_at
      `)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileResult.data;
  const profiles = profilesResult.data || [];
  const courses = coursesResult.data || [];
  const modules = modulesResult.data || [];
  const lessons = lessonsResult.data || [];
  const enrollments = enrollmentsResult.data || [];

  const isManager = ["super_admin", "management"].includes(
    profile?.role || ""
  );

  const employeeMap = new Map(
    profiles.map((employee) => [
      employee.id,
      employee.full_name ||
        employee.email ||
        "KIPROD Employee",
    ])
  );

  const courseMap = new Map(
    courses.map((course) => [course.id, course.title])
  );

  const myEnrollments = enrollments.filter(
    (enrollment) => enrollment.employee_id === user.id
  );

  const mandatoryCourses = courses.filter(
    (course) => course.is_mandatory
  );

  const publishedCourses = courses.filter(
    (course) => course.status === "published"
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-amber-700 hover:text-amber-600"
            >
              ← CRM Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              KIPROD Academy
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Internal knowledge, lessons, assessments and staff capability
              development.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              My Enrolments
            </p>

            <p className="mt-1 text-xl font-black">
              {myEnrollments.length}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {messages.success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
            {messages.success}
          </div>
        )}

        {messages.error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
            {messages.error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Total Courses
            </p>

            <p className="mt-3 text-3xl font-black">
              {courses.length}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Published
            </p>

            <p className="mt-3 text-3xl font-black text-blue-900">
              {publishedCourses.length}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Mandatory
            </p>

            <p className="mt-3 text-3xl font-black text-amber-900">
              {mandatoryCourses.length}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Enrolments
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-900">
              {enrollments.length}
            </p>
          </article>
        </section>

        {isManager && (
          <section className="mb-8 grid items-start gap-6 xl:grid-cols-2">
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="bg-slate-950 px-6 py-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                  Academy Administration
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Create Course
                </h2>
              </div>

              <form action={createCourse} className="space-y-5 p-6">
                <div>
                  <label className={labelClass}>Course Title *</label>

                  <input
                    name="title"
                    required
                    placeholder="Example: Understanding the KIPROD Ecosystem"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Category</label>

                  <select
                    name="category"
                    defaultValue=""
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    <option value="KIPROD Orientation">
                      KIPROD Orientation
                    </option>
                    <option value="Institutional Engagement">
                      Institutional Engagement
                    </option>
                    <option value="Credit Risk">Credit Risk</option>
                    <option value="Governance">Governance</option>
                    <option value="Sales and Partnerships">
                      Sales and Partnerships
                    </option>
                    <option value="Compliance">Compliance</option>
                    <option value="Internal Operations">
                      Internal Operations
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Description</label>

                  <textarea
                    name="description"
                    rows={4}
                    placeholder="What will employees learn?"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Passing Score
                    </label>

                    <input
                      name="passing_score"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="70"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Estimated Minutes
                    </label>

                    <input
                      name="estimated_minutes"
                      type="number"
                      min="0"
                      defaultValue="30"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Status</label>

                  <select
                    name="status"
                    defaultValue="draft"
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    name="is_mandatory"
                    className="h-4 w-4 accent-amber-500"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Mandatory course
                    </span>

                    <span className="text-xs text-slate-500">
                      Employees are expected to complete this programme.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-amber-400"
                >
                  Create Course
                </button>
              </form>
            </article>

            <div className="space-y-6">
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-xl font-black">
                    Add Module
                  </h2>
                </div>

                <form action={createModule} className="space-y-5 p-6">
                  <div>
                    <label className={labelClass}>Course *</label>

                    <select
                      name="course_id"
                      required
                      defaultValue=""
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select course
                      </option>

                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Module Title *</label>

                    <input
                      name="title"
                      required
                      placeholder="Example: Introduction to ILCA"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Module Order</label>

                    <input
                      name="module_order"
                      type="number"
                      min="1"
                      defaultValue="1"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>

                    <textarea
                      name="description"
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                  >
                    Add Module
                  </button>
                </form>
              </article>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-xl font-black">
                    Add Lesson
                  </h2>
                </div>

                <form action={createLesson} className="space-y-5 p-6">
                  <div>
                    <label className={labelClass}>Module *</label>

                    <select
                      name="module_id"
                      required
                      defaultValue=""
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select module
                      </option>

                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {courseMap.get(module.course_id)} —{" "}
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Lesson Title *</label>

                    <input
                      name="title"
                      required
                      placeholder="Example: Why ILCA Is the Entry Point"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Lesson Content</label>

                    <textarea
                      name="content"
                      rows={6}
                      placeholder="Write the lesson content..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Video URL</label>

                    <input
                      name="video_url"
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Document URL</label>

                    <input
                      name="document_url"
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Lesson Order</label>

                      <input
                        name="lesson_order"
                        type="number"
                        min="1"
                        defaultValue="1"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Estimated Minutes
                      </label>

                      <input
                        name="estimated_minutes"
                        type="number"
                        min="0"
                        defaultValue="10"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                  >
                    Add Lesson
                  </button>
                </form>
              </article>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-xl font-black">
                    Enrol Employee
                  </h2>
                </div>

                <form action={enrollEmployee} className="space-y-5 p-6">
                  <div>
                    <label className={labelClass}>Course *</label>

                    <select
                      name="course_id"
                      required
                      defaultValue=""
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select course
                      </option>

                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Employee *</label>

                    <select
                      name="employee_id"
                      required
                      defaultValue=""
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select employee
                      </option>

                      {profiles.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name ||
                            employee.email ||
                            "KIPROD Employee"}
                          {employee.job_title
                            ? ` — ${employee.job_title}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950"
                  >
                    Enrol Employee
                  </button>
                </form>
              </article>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Learning Library
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Academy Courses
            </h2>
          </div>

          {coursesResult.error && (
            <div className="m-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              {coursesResult.error.message}
            </div>
          )}

          {!coursesResult.error && courses.length === 0 && (
            <div className="px-8 py-24 text-center">
              <p className="text-lg font-black">
                No Academy courses created
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Create the first KIPROD learning course.
              </p>
            </div>
          )}

          {courses.length > 0 && (
            <div className="grid gap-6 bg-slate-50/70 p-6 lg:grid-cols-2">
              {courses.map((course) => {
                const courseModules = modules.filter(
                  (module) => module.course_id === course.id
                );

                const courseEnrollments = enrollments.filter(
                  (enrollment) =>
                    enrollment.course_id === course.id
                );

                return (
                  <article
                    key={course.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-slate-200 p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                          {formatLabel(course.status)}
                        </span>

                        {course.is_mandatory && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            Mandatory
                          </span>
                        )}

                        {course.category && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {course.category}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {course.description}
                        </p>
                      )}

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-lg font-black">
                            {courseModules.length}
                          </p>
                          <p className="text-xs text-slate-500">
                            Modules
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-lg font-black">
                            {courseEnrollments.length}
                          </p>
                          <p className="text-xs text-slate-500">
                            Enrolled
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-lg font-black">
                            {course.passing_score}%
                          </p>
                          <p className="text-xs text-slate-500">
                            Pass Mark
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-6">
                      {courseModules.length === 0 && (
                        <p className="text-sm text-slate-500">
                          No modules added.
                        </p>
                      )}

                      {courseModules.map((module) => {
                        const moduleLessons = lessons.filter(
                          (lesson) =>
                            lesson.module_id === module.id
                        );

                        return (
                          <details
                            key={module.id}
                            className="rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <summary className="cursor-pointer px-4 py-4 text-sm font-black">
                              Module {module.module_order}:{" "}
                              {module.title}
                            </summary>

                            <div className="border-t border-slate-200 p-4">
                              {moduleLessons.length === 0 && (
                                <p className="text-sm text-slate-500">
                                  No lessons added.
                                </p>
                              )}

                              <div className="space-y-3">
                                {moduleLessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="rounded-xl bg-white p-4"
                                  >
                                    <p className="font-bold">
                                      Lesson {lesson.lesson_order}:{" "}
                                      {lesson.title}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {lesson.estimated_minutes} minutes
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isManager && enrollments.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-black">
                Employee Learning Progress
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="grid gap-4 px-6 py-5 md:grid-cols-3 md:items-center"
                >
                  <div>
                    <p className="font-black">
                      {employeeMap.get(enrollment.employee_id) ||
                        "KIPROD Employee"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {courseMap.get(enrollment.course_id) ||
                        "Unknown Course"}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span>Progress</span>
                      <span>
                        {enrollment.progress_percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${enrollment.progress_percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Final Score
                    </p>

                    <p className="mt-1 font-black">
                      {enrollment.final_score !== null
                        ? `${enrollment.final_score}%`
                        : "Not completed"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}