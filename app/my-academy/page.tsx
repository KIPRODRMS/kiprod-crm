import Link from "next/link";
import { requireTeamMember } from "@/lib/auth";

function formatLabel(
  value: string | null
) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeZone: "Africa/Nairobi",
    }
  ).format(new Date(value));
}

function safePercentage(
  value: number | null
) {
  return Math.min(
    100,
    Math.max(0, Number(value || 0))
  );
}

export default async function MyAcademyPage() {
  const { supabase, user } =
    await requireTeamMember();

  const {
    data: enrolmentData,
    error: enrolmentsError,
  } = await supabase
    .from("academy_enrollments")
    .select(
      `
        id,
        course_id,
        progress_percentage,
        final_score,
        started_at,
        completed_at,
        created_at
      `
    )
    .eq("employee_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const enrolments =
    enrolmentData || [];

  const courseIds = [
    ...new Set(
      enrolments.map(
        (enrolment) =>
          enrolment.course_id
      )
    ),
  ];

  let courses: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string | null;
    passing_score: number | null;
    estimated_minutes: number | null;
    is_mandatory: boolean | null;
    created_at: string | null;
  }[] = [];

  let modules: {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    module_order: number | null;
  }[] = [];

  let lessons: {
    id: string;
    module_id: string;
    title: string;
    lesson_order: number | null;
    content: string | null;
    video_url: string | null;
    document_url: string | null;
    estimated_minutes: number | null;
  }[] = [];

  let learningError: string | null =
    null;

  if (courseIds.length > 0) {
    const coursesResult =
      await supabase
        .from("academy_courses")
        .select(
          `
            id,
            title,
            description,
            category,
            status,
            passing_score,
            estimated_minutes,
            is_mandatory,
            created_at
          `
        )
        .in("id", courseIds)
        .eq("status", "published")
        .order("is_mandatory", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

    courses =
      coursesResult.data || [];

    learningError =
      coursesResult.error?.message ||
      null;

    const visibleCourseIds =
      courses.map(
        (course) => course.id
      );

    if (
      visibleCourseIds.length > 0
    ) {
      const modulesResult =
        await supabase
          .from("academy_modules")
          .select(
            `
              id,
              course_id,
              title,
              description,
              module_order
            `
          )
          .in(
            "course_id",
            visibleCourseIds
          )
          .order("module_order", {
            ascending: true,
          });

      modules =
        modulesResult.data || [];

      learningError =
        learningError ||
        modulesResult.error?.message ||
        null;

      const moduleIds = modules.map(
        (module) => module.id
      );

      if (moduleIds.length > 0) {
        const lessonsResult =
          await supabase
            .from("academy_lessons")
            .select(
              `
                id,
                module_id,
                title,
                lesson_order,
                content,
                video_url,
                document_url,
                estimated_minutes
              `
            )
            .in(
              "module_id",
              moduleIds
            )
            .order("lesson_order", {
              ascending: true,
            });

        lessons =
          lessonsResult.data || [];

        learningError =
          learningError ||
          lessonsResult.error
            ?.message ||
          null;
      }
    }
  }

  const enrolmentMap = new Map(
    enrolments.map((enrolment) => [
      enrolment.course_id,
      enrolment,
    ])
  );

  const visibleEnrolments =
    courses
      .map((course) =>
        enrolmentMap.get(course.id)
      )
      .filter(Boolean);

  const completedCourses =
    visibleEnrolments.filter(
      (enrolment) =>
        Boolean(
          enrolment?.completed_at
        ) ||
        Number(
          enrolment?.progress_percentage ||
            0
        ) >= 100
    ).length;

  const inProgressCourses =
    visibleEnrolments.filter(
      (enrolment) => {
        const progress = Number(
          enrolment?.progress_percentage ||
            0
        );

        return (
          progress > 0 &&
          progress < 100 &&
          !enrolment?.completed_at
        );
      }
    ).length;

  const mandatoryOutstanding =
    courses.filter((course) => {
      const enrolment =
        enrolmentMap.get(course.id);

      return (
        course.is_mandatory &&
        !enrolment?.completed_at &&
        Number(
          enrolment?.progress_percentage ||
            0
        ) < 100
      );
    }).length;

  const averageProgress =
    visibleEnrolments.length > 0
      ? Math.round(
          visibleEnrolments.reduce(
            (total, enrolment) =>
              total +
              Number(
                enrolment
                  ?.progress_percentage ||
                  0
              ),
            0
          ) /
            visibleEnrolments.length
        )
      : 0;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
          My Workspace
        </p>

        <h1 className="mt-2 text-3xl font-black">
          My Academy
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Access your assigned KIPROD
          learning programmes, lessons,
          reference material and learning
          progress.
        </p>
      </div>

      {(enrolmentsError ||
        learningError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          Unable to load all Academy
          information:{" "}
          {enrolmentsError?.message ||
            learningError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Assigned Courses
          </p>

          <p className="mt-2 text-2xl font-black">
            {courses.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Published programmes
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
            In Progress
          </p>

          <p className="mt-2 text-2xl font-black text-blue-900">
            {inProgressCourses}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently underway
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Completed
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-900">
            {completedCourses}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Finished programmes
          </p>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm ${
            mandatoryOutstanding > 0
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              mandatoryOutstanding > 0
                ? "text-amber-700"
                : "text-slate-400"
            }`}
          >
            Mandatory Outstanding
          </p>

          <p
            className={`mt-2 text-2xl font-black ${
              mandatoryOutstanding > 0
                ? "text-amber-900"
                : "text-slate-950"
            }`}
          >
            {mandatoryOutstanding}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Requiring completion
          </p>
        </article>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Overall Learning Progress
            </p>

            <p className="mt-2 text-2xl font-black">
              {averageProgress}%
            </p>
          </div>

          <Link
            href="/my-workspace"
            className="text-sm font-black text-amber-700 hover:text-amber-600"
          >
            Back to My Workspace
          </Link>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{
              width: `${safePercentage(
                averageProgress
              )}%`,
            }}
          />
        </div>
      </article>

      {!enrolmentsError &&
      courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-black text-slate-800">
            No Academy courses are
            assigned to you yet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Your learning programmes will
            appear here after management
            enrols you.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => {
            const enrolment =
              enrolmentMap.get(
                course.id
              );

            const progress =
              safePercentage(
                enrolment
                  ?.progress_percentage ||
                  0
              );

            const courseModules =
              modules.filter(
                (module) =>
                  module.course_id ===
                  course.id
              );

            const totalLessons =
              courseModules.reduce(
                (total, module) =>
                  total +
                  lessons.filter(
                    (lesson) =>
                      lesson.module_id ===
                      module.id
                  ).length,
                0
              );

            const isCompleted =
              Boolean(
                enrolment?.completed_at
              ) || progress >= 100;

            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
              >
                <div className="border-b border-slate-200 p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {course.category && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-700">
                            {course.category}
                          </span>
                        )}

                        {course.is_mandatory && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-800">
                            Mandatory
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : progress > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isCompleted
                            ? "Completed"
                            : progress > 0
                              ? "In Progress"
                              : "Not Started"}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-slate-950">
                        {course.title}
                      </h2>

                      {course.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                          {
                            course.description
                          }
                        </p>
                      )}
                    </div>

                    <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="font-black">
                          {
                            courseModules.length
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          Modules
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="font-black">
                          {totalLessons}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          Lessons
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="font-black">
                          {course.estimated_minutes ||
                            0}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          Minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-black">
                      <span>
                        Course Progress
                      </span>

                      <span>
                        {progress}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <p>
                      <span className="font-black text-slate-700">
                        Pass mark:
                      </span>{" "}
                      {course.passing_score ||
                        0}
                      %
                    </p>

                    <p>
                      <span className="font-black text-slate-700">
                        Final score:
                      </span>{" "}
                      {enrolment?.final_score !==
                      null &&
                      enrolment?.final_score !==
                        undefined
                        ? `${enrolment.final_score}%`
                        : "Not completed"}
                    </p>

                    <p>
                      <span className="font-black text-slate-700">
                        Enrolled:
                      </span>{" "}
                      {formatDate(
                        enrolment?.created_at ||
                          null
                      )}
                    </p>

                    {enrolment?.completed_at && (
                      <p>
                        <span className="font-black text-slate-700">
                          Completed:
                        </span>{" "}
                        {formatDate(
                          enrolment.completed_at
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50/70 p-6">
                  {courseModules.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
                      Course content has
                      not been added yet.
                    </div>
                  )}

                  {courseModules.map(
                    (module) => {
                      const moduleLessons =
                        lessons.filter(
                          (lesson) =>
                            lesson.module_id ===
                            module.id
                        );

                      return (
                        <details
                          key={module.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <summary className="cursor-pointer list-none px-5 py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                                  Module{" "}
                                  {module.module_order ||
                                    1}
                                </p>

                                <p className="mt-1 font-black text-slate-950">
                                  {
                                    module.title
                                  }
                                </p>
                              </div>

                              <span className="shrink-0 text-xs font-black text-slate-500">
                                {
                                  moduleLessons.length
                                }{" "}
                                lesson
                                {moduleLessons.length ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            </div>

                            {module.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {
                                  module.description
                                }
                              </p>
                            )}
                          </summary>

                          <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                            {moduleLessons.length ===
                              0 && (
                              <p className="rounded-xl bg-white px-4 py-5 text-sm text-slate-500">
                                No lessons have
                                been added to
                                this module.
                              </p>
                            )}

                            {moduleLessons.map(
                              (lesson) => (
                                <details
                                  key={
                                    lesson.id
                                  }
                                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                >
                                  <summary className="cursor-pointer list-none px-4 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                          Lesson{" "}
                                          {lesson.lesson_order ||
                                            1}
                                        </p>

                                        <p className="mt-1 font-bold text-slate-900">
                                          {
                                            lesson.title
                                          }
                                        </p>
                                      </div>

                                      <span className="shrink-0 text-xs font-bold text-slate-500">
                                        {lesson.estimated_minutes ||
                                          0}{" "}
                                        min
                                      </span>
                                    </div>
                                  </summary>

                                  <div className="border-t border-slate-200 px-4 py-5">
                                    {lesson.content ? (
                                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                        {
                                          lesson.content
                                        }
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500">
                                        No written
                                        lesson content
                                        has been added.
                                      </p>
                                    )}

                                    {(lesson.video_url ||
                                      lesson.document_url) && (
                                      <div className="mt-5 flex flex-wrap gap-3">
                                        {lesson.video_url && (
                                          <a
                                            href={
                                              lesson.video_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
                                          >
                                            Open Video
                                          </a>
                                        )}

                                        {lesson.document_url && (
                                          <a
                                            href={
                                              lesson.document_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-black text-amber-900 transition hover:bg-amber-100"
                                          >
                                            Open Document
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </details>
                              )
                            )}
                          </div>
                        </details>
                      );
                    }
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}