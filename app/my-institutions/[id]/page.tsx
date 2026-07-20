import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth";
import { recordMyInteraction } from "../actions";
import {
  CONTROLLED_STAGE_ONE_DOCUMENTS,
  ENGAGEMENT_STAGES,
  normaliseEngagementStage,
} from "@/lib/engagement";

type MyInstitutionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

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

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }
  ).format(new Date(value));
}

function normaliseWhatsApp(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const digits = value.replace(
    /[^\d]/g,
    ""
  );

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  if (
    (digits.startsWith("7") ||
      digits.startsWith("1")) &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return digits;
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-amber-500";

const labelClass =
  "mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-600";

export default async function MyInstitutionDetailPage({
  params,
  searchParams,
}: MyInstitutionDetailPageProps) {
  const { id } = await params;
  const messages = await searchParams;

  const {
    supabase,
    user,
  } = await requireTeamMember();

  const {
    data: institution,
    error: institutionError,
  } = await supabase
    .from("institutions")
    .select(
      `
        id,
        name,
        institution_type,
        sector,
        segment,
        tier,
        location,
        website,
        email,
        phone,
        status,
        outreach_status,
        next_action,
        next_follow_up_at,
        assigned_to,
        historical_notes,
        created_at
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (
    institutionError ||
    !institution ||
    institution.assigned_to !== user.id
  ) {
    redirect(
      "/my-institutions?error=That institution is not assigned to you"
    );
  }

  const [
    contactsResult,
    interactionsResult,
    opportunitiesResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        `
          id,
          full_name,
          job_title,
          department,
          email,
          phone,
          whatsapp_number,
          is_primary,
          decision_maker
        `
      )
      .eq(
        "institution_id",
        institution.id
      )
      .order("is_primary", {
        ascending: false,
      })
      .order("full_name"),

    supabase
      .from("interactions")
      .select(
        `
          id,
          interaction_type,
          subject,
          conversation_summary,
          customer_feedback,
          objections,
          kiprod_commitments,
          outcome,
          sentiment,
          next_action,
          follow_up_at,
          occurred_at,
          created_at
        `
      )
      .eq(
        "institution_id",
        institution.id
      )
      .order("occurred_at", {
        ascending: false,
      })
      .limit(20),

    supabase
      .from("opportunities")
      .select(
        `
          id,
          title,
          estimated_value,
          status,
          next_action,
          next_follow_up_at
        `
      )
      .eq(
        "institution_id",
        institution.id
      )
      .eq("assigned_to", user.id)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          status,
          priority,
          due_at
        `
      )
      .eq(
        "institution_id",
        institution.id
      )
      .eq("assigned_to", user.id)
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
      }),
  ]);

  const contacts =
    contactsResult.data || [];

  const interactions =
    interactionsResult.data || [];

  const opportunities =
    opportunitiesResult.data || [];

  const tasks =
    tasksResult.data || [];

  return (
    <section className="space-y-6">
      <Link
        href="/my-institutions"
        className="inline-flex text-sm font-black text-amber-700 hover:text-amber-600"
      >
        ← My Assigned Institutions
      </Link>

      <div className="rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
              Assigned Account
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {institution.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {[
                institution.institution_type,
                institution.segment,
                institution.location,
              ]
                .filter(Boolean)
                .join(" · ") ||
                "Institution details not recorded"}
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-slate-950">
            {formatLabel(
              institution.status
            )}
          </span>
        </div>
      </div>

      {messages.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {messages.success}
        </div>
      )}

      {messages.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {messages.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Contacts
          </p>

          <p className="mt-2 text-2xl font-black">
            {contacts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Opportunities
          </p>

          <p className="mt-2 text-2xl font-black">
            {opportunities.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            My Tasks
          </p>

          <p className="mt-2 text-2xl font-black">
            {
              tasks.filter(
                (task) =>
                  task.status !==
                    "completed" &&
                  task.status !==
                    "cancelled"
              ).length
            }
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            Next Follow-up
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {formatDateTime(
              institution.next_follow_up_at
            )}
          </p>
        </article>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-black">
                Institutional Contacts
              </h2>
            </div>

            {contacts.length === 0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">
                No contacts have been
                recorded for this institution.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {contacts.map((contact) => {
                  const whatsappNumber =
                    normaliseWhatsApp(
                      contact.whatsapp_number ||
                        contact.phone
                    );

                  return (
                    <div
                      key={contact.id}
                      className="px-5 py-4"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-950">
                              {contact.full_name}
                            </p>

                            {contact.is_primary && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                                Primary
                              </span>
                            )}

                            {contact.decision_maker && (
                              <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                                Decision-maker
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {[
                              contact.job_title,
                              contact.department,
                            ]
                              .filter(Boolean)
                              .join(" · ") ||
                              "Role not recorded"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"
                            >
                              Call
                            </a>
                          )}

                          {contact.phone && (
                            <a
                              href={`sms:${contact.phone}`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700"
                            >
                              SMS
                            </a>
                          )}

                          {whatsappNumber && (
                            <a
                              href={`https://wa.me/${whatsappNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                            >
                              WhatsApp
                            </a>
                          )}

                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white"
                            >
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-black">
                Recent Institutional Activity
              </h2>
            </div>

            {interactions.length === 0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">
                No interactions have been
                recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {interactions.map(
                  (interaction) => (
                    <div
                      key={interaction.id}
                      className="px-5 py-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                            {formatLabel(
                              interaction.interaction_type
                            )}
                          </p>

                          <p className="mt-1 font-black text-slate-950">
                            {interaction.subject ||
                              "Institutional interaction"}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-slate-400">
                          {formatDateTime(
                            interaction.occurred_at ||
                              interaction.created_at
                          )}
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {
                          interaction.conversation_summary
                        }
                      </p>

                      {interaction.kiprod_commitments && (
                        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
                            KIPROD Materials / Commitments
                          </p>
                          <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
                            {interaction.kiprod_commitments}
                          </p>
                        </div>
                      )}

                      {interaction.next_action && (
                        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                            Next action
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {
                              interaction.next_action
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="bg-slate-950 px-5 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                Record Activity
              </p>

              <h2 className="mt-2 text-xl font-black">
                Add Interaction
              </h2>
            </div>

            <form
              action={
                recordMyInteraction
              }
              className="space-y-5 p-5"
            >
              <input
                type="hidden"
                name="institution_id"
                value={institution.id}
              />

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">
                  Required Engagement Sequence
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-amber-950">
                  Target identified → Contact verified → Intro contact made → Stage 1
                  documents sent → Interest expressed → ILCA requested/approved → ILCA sent
                </p>
              </div>

              <div>
                <label className={labelClass}>Engagement Stage *</label>
                <select
                  name="engagement_stage"
                  required
                  defaultValue={normaliseEngagementStage(institution.outreach_status) || ""}
                  className={fieldClass}
                >
                  <option value="">Select current stage</option>
                  {ENGAGEMENT_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Interaction Type
                </label>

                <select
                  name="interaction_type"
                  defaultValue="phone_call"
                  className={fieldClass}
                >
                  <option value="phone_call">
                    Phone Call
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="whatsapp">
                    WhatsApp
                  </option>

                  <option value="meeting">
                    Meeting
                  </option>

                  <option value="proposal">
                    Proposal
                  </option>

                  <option value="follow_up">
                    Follow-up
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Subject
                </label>

                <input
                  name="subject"
                  placeholder="Purpose of the interaction"
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Conversation Summary *
                </label>

                <textarea
                  name="conversation_summary"
                  required
                  rows={5}
                  placeholder="What was discussed?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Customer Feedback
                </label>

                <textarea
                  name="customer_feedback"
                  rows={3}
                  placeholder="What did the institution say?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                  Documents Sent During This Interaction
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Stage 1 is a controlled three-document pack. Training or masterclass
                  information is only allowed when the institution requested training.
                </p>
                <div className="mt-3 space-y-2">
                  {CONTROLLED_STAGE_ONE_DOCUMENTS.map((document) => (
                    <label
                      key={document.field}
                      className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name={document.field}
                        className="mt-0.5 h-4 w-4 accent-amber-500"
                      />
                      <span>{document.label}</span>
                    </label>
                  ))}
                  <label className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      name="document_ilca_form"
                      className="mt-0.5 h-4 w-4 accent-amber-500"
                    />
                    <span>ILCA form — only after ILCA request/approval</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      name="document_training_information"
                      className="mt-0.5 h-4 w-4 accent-amber-500"
                    />
                    <span>Training/masterclass information</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-black text-red-800">
                    <input
                      type="checkbox"
                      name="training_requested"
                      className="mt-0.5 h-4 w-4 accent-red-600"
                    />
                    <span>The institution specifically requested training information</span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Objections or Concerns
                </label>

                <textarea
                  name="objections"
                  rows={3}
                  placeholder="Any concern, hesitation or objection?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Outcome
                </label>

                <input
                  name="outcome"
                  placeholder="Example: ILCA invitation accepted"
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Sentiment
                </label>

                <select
                  name="sentiment"
                  defaultValue="not_recorded"
                  className={fieldClass}
                >
                  <option value="positive">
                    Positive
                  </option>

                  <option value="neutral">
                    Neutral
                  </option>

                  <option value="negative">
                    Negative
                  </option>

                  <option value="not_recorded">
                    Not Recorded
                  </option>
                </select>
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Next Action *
                </label>

                <textarea
                  name="next_action"
                  required
                  rows={3}
                  placeholder="What exactly must happen next?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <div>
                <label
                  className={
                    labelClass
                  }
                >
                  Follow-up Date *
                </label>

                <input
                  name="follow_up_at"
                  type="datetime-local"
                  required
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
              >
                Save Interaction
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Current Next Action
            </p>

            <p className="mt-3 text-sm font-bold leading-6 text-slate-800">
              {institution.next_action ||
                "No next action recorded"}
            </p>

            <p className="mt-3 text-xs font-black text-amber-700">
              {formatDateTime(
                institution.next_follow_up_at
              )}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}
