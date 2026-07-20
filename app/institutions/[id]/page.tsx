import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CONTROLLED_STAGE_ONE_DOCUMENTS,
  ENGAGEMENT_STAGES,
  normaliseEngagementStage,
} from "@/lib/engagement";
import { recordInteraction } from "./actions";

type InstitutionPageProps = {
  params: Promise<{
    id: string;
  }>;

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

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Institutions", href: "/institutions" },
  { label: "Contacts", href: "/contacts" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Activities", href: "/activities" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "KIPROD Academy", href: "/academy" },
];

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10";

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600";

export default async function InstitutionPage({
  params,
  searchParams,
}: InstitutionPageProps) {
  const { id } = await params;
  const messages = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select(`
      id,
      name,
      institution_type,
      sector,
      location,
      website,
      email,
      phone,
      source,
      status,
      outreach_status,
      next_action,
      next_follow_up_at,
      created_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (institutionError || !institution) {
    notFound();
  }

  const { data: interactions, error: interactionsError } = await supabase
    .from("interactions")
    .select(`
      id,
      interaction_type,
      subject,
      conversation_summary,
      customer_feedback,
      objections,
      kiprod_commitments,
      institution_commitments,
      outcome,
      sentiment,
      next_action,
      follow_up_at,
      occurred_at,
      created_at
    `)
    .eq("institution_id", id)
    .order("occurred_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col bg-slate-950 text-white lg:flex">
          <div className="border-b border-slate-800 px-7 py-7">
            <p className="text-sm font-black tracking-[0.3em] text-amber-500">
              KIPROD
            </p>

            <h1 className="mt-3 text-xl font-bold">
              Institutional Growth Hub
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Partnerships and Acquisition CRM
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const active = item.label === "Institutions";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 px-6 py-5">
            <p className="text-sm font-semibold">KIPROD CRM</p>
            <p className="mt-1 text-xs text-slate-500">
              Internal access only
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-6 py-5 shadow-sm backdrop-blur lg:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <Link
                    href="/institutions"
                    className="text-sm font-bold text-amber-700 transition hover:text-amber-600"
                  >
                    ← Institutional Database
                  </Link>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      {institution.name}
                    </h2>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                      {formatLabel(institution.status)}
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">
                      {formatLabel(
                        normaliseEngagementStage(
                          institution.outreach_status
                        ) || institution.outreach_status
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Institutional relationship, conversations and follow-up
                    history.
                  </p>
                </div>

                <Link
                  href="/"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  CRM Dashboard
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
            {messages.success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-sm">
                {messages.success}
              </div>
            )}

            {messages.error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 shadow-sm">
                {messages.error}
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Institution Type
                </p>
                <p className="mt-3 font-bold text-slate-900">
                  {institution.institution_type || "Not recorded"}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Location
                </p>
                <p className="mt-3 font-bold text-slate-900">
                  {institution.location || "Not recorded"}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Next Action
                </p>
                <p className="mt-3 font-bold text-slate-900">
                  {institution.next_action || "No action recorded"}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Follow-up Date
                </p>
                <p className="mt-3 font-bold text-slate-900">
                  {formatDate(institution.next_follow_up_at)}
                </p>
              </article>
            </section>

            <section className="mt-6 grid items-start gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
              <div className="space-y-6">
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                  <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                      Institution Profile
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Contact Information
                    </h3>
                  </div>

                  <div className="space-y-5 p-6 text-sm">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Email
                      </p>
                      <p className="mt-2 break-all font-semibold text-slate-900">
                        {institution.email || "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Phone
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {institution.phone || "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Website
                      </p>

                      {institution.website ? (
                        <a
                          href={institution.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all font-bold text-amber-700 hover:underline"
                        >
                          {institution.website}
                        </a>
                      ) : (
                        <p className="mt-2 font-semibold text-slate-900">
                          Not recorded
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Lead Source
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {institution.source || "Not recorded"}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                      New Activity
                    </p>

                    <h3 className="mt-2 text-xl font-black text-slate-950">
                      Record Conversation
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Record calls, WhatsApp discussions, meetings, feedback,
                      commitments and follow-ups.
                    </p>
                  </div>

                  <form action={recordInteraction} className="space-y-5 p-6">
                    <input
                      type="hidden"
                      name="institution_id"
                      value={institution.id}
                    />

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-900">
                        Required engagement pathway
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                        Target identified → Contact verified → Intro contact
                        made → Stage 1 documents sent → Interest expressed →
                        ILCA requested/approved → ILCA sent
                      </p>
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        Stages cannot be skipped or moved backwards.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="engagement_stage" className={labelClass}>
                        Current Engagement Stage *
                      </label>

                      <select
                        id="engagement_stage"
                        name="engagement_stage"
                        required
                        defaultValue={
                          normaliseEngagementStage(
                            institution.outreach_status
                          ) || ""
                        }
                        className={fieldClass}
                      >
                        <option value="" disabled>
                          Select current stage
                        </option>
                        {ENGAGEMENT_STAGES.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="interaction_type"
                        className={labelClass}
                      >
                        Engagement Type
                      </label>

                      <select
                        id="interaction_type"
                        name="interaction_type"
                        required
                        defaultValue="phone_call"
                        className={fieldClass}
                      >
                        <option value="phone_call">Phone Call</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="physical_meeting">
                          Physical Meeting
                        </option>
                        <option value="online_meeting">Online Meeting</option>
                        <option value="site_visit">Site Visit</option>
                        <option value="presentation">Presentation</option>
                        <option value="proposal">Proposal</option>
                        <option value="feedback">Feedback</option>
                        <option value="complaint">Complaint</option>
                        <option value="internal_note">Internal Note</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className={labelClass}>
                        Subject
                      </label>

                      <input
                        id="subject"
                        name="subject"
                        placeholder="Example: ILCA introduction discussion"
                        className={fieldClass}
                      />
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <legend className="px-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                        Materials sent in this engagement
                      </legend>

                      <p className="mb-4 text-xs leading-5 text-slate-500">
                        Stage 1 is controlled: all three documents below must
                        be sent and recorded together.
                      </p>

                      <div className="space-y-3">
                        {CONTROLLED_STAGE_ONE_DOCUMENTS.map((document) => (
                          <label
                            key={document.field}
                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                          >
                            <input
                              type="checkbox"
                              name={document.field}
                              className="mt-0.5 h-4 w-4 accent-amber-500"
                            />
                            <span>{document.label}</span>
                          </label>
                        ))}

                        <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-950">
                          <input
                            type="checkbox"
                            name="document_ilca_form"
                            className="mt-0.5 h-4 w-4 accent-blue-600"
                          />
                          <span>
                            ILCA form — only after ILCA request/approval
                          </span>
                        </label>

                        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            name="document_training_information"
                            className="mt-0.5 h-4 w-4 accent-amber-500"
                          />
                          <span>Training/masterclass information</span>
                        </label>

                        <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
                          <input
                            type="checkbox"
                            name="training_requested"
                            className="mt-0.5 h-4 w-4 accent-red-600"
                          />
                          <span>
                            Confirm the institution specifically requested
                            training
                          </span>
                        </label>
                      </div>
                    </fieldset>

                    <div>
                      <label
                        htmlFor="conversation_summary"
                        className={labelClass}
                      >
                        Conversation Summary
                      </label>

                      <textarea
                        id="conversation_summary"
                        name="conversation_summary"
                        required
                        rows={5}
                        placeholder="What was discussed during the engagement?"
                        className={`${fieldClass} resize-none`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="customer_feedback"
                        className={labelClass}
                      >
                        Customer Feedback
                      </label>

                      <textarea
                        id="customer_feedback"
                        name="customer_feedback"
                        rows={4}
                        placeholder="What did the institution say?"
                        className={`${fieldClass} resize-none`}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="sentiment" className={labelClass}>
                          Sentiment
                        </label>

                        <select
                          id="sentiment"
                          name="sentiment"
                          defaultValue="not_recorded"
                          className={fieldClass}
                        >
                          <option value="not_recorded">Not Recorded</option>
                          <option value="positive">Positive</option>
                          <option value="neutral">Neutral</option>
                          <option value="negative">Negative</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="follow_up_at" className={labelClass}>
                          Follow-up Date *
                        </label>

                        <input
                          id="follow_up_at"
                          name="follow_up_at"
                          type="datetime-local"
                          required
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="next_action" className={labelClass}>
                        Next Action *
                      </label>

                      <textarea
                        id="next_action"
                        name="next_action"
                        rows={3}
                        required
                        placeholder="Example: Verify the procurement contact by phone"
                        className={`${fieldClass} resize-none`}
                      />
                    </div>

                    <details className="rounded-2xl border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-700">
                        Add objections, commitments and outcome
                      </summary>

                      <div className="space-y-5 border-t border-slate-200 p-5">
                        <div>
                          <label htmlFor="objections" className={labelClass}>
                            Objections or Concerns
                          </label>

                          <textarea
                            id="objections"
                            name="objections"
                            rows={3}
                            placeholder="Budget, procurement, timing or approval concerns..."
                            className={`${fieldClass} resize-none`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="kiprod_commitments"
                            className={labelClass}
                          >
                            KIPROD Commitments
                          </label>

                          <textarea
                            id="kiprod_commitments"
                            name="kiprod_commitments"
                            rows={3}
                            placeholder="What did KIPROD agree to do?"
                            className={`${fieldClass} resize-none`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="institution_commitments"
                            className={labelClass}
                          >
                            Institution Commitments
                          </label>

                          <textarea
                            id="institution_commitments"
                            name="institution_commitments"
                            rows={3}
                            placeholder="What did the institution agree to do?"
                            className={`${fieldClass} resize-none`}
                          />
                        </div>

                        <div>
                          <label htmlFor="outcome" className={labelClass}>
                            Engagement Outcome
                          </label>

                          <textarea
                            id="outcome"
                            name="outcome"
                            rows={3}
                            placeholder="What was achieved?"
                            className={`${fieldClass} resize-none`}
                          />
                        </div>
                      </div>
                    </details>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400"
                    >
                      Save Conversation
                    </button>
                  </form>
                </article>
              </div>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                      Relationship History
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Engagement Timeline
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Calls, meetings, feedback, commitments and follow-ups.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                    {interactions?.length || 0} Records
                  </span>
                </div>

                {interactionsError && (
                  <div className="m-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                    Failed to load conversations: {interactionsError.message}
                  </div>
                )}

                {!interactionsError &&
                  (!interactions || interactions.length === 0) && (
                    <div className="px-8 py-24 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        ↗
                      </div>

                      <p className="mt-5 text-lg font-black text-slate-800">
                        No conversations recorded
                      </p>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Record the first call, meeting, WhatsApp conversation
                        or feedback session.
                      </p>
                    </div>
                  )}

                {interactions && interactions.length > 0 && (
                  <div className="space-y-5 bg-slate-50/70 p-6">
                    {interactions.map((interaction) => (
                      <section
                        key={interaction.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                                {formatLabel(interaction.interaction_type)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  interaction.sentiment === "positive"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : interaction.sentiment === "negative"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {formatLabel(interaction.sentiment)}
                              </span>
                            </div>

                            <h4 className="mt-4 text-xl font-black text-slate-950">
                              {interaction.subject ||
                                "Institution engagement"}
                            </h4>
                          </div>

                          <p className="text-xs font-bold text-slate-400">
                            {formatDate(interaction.occurred_at)}
                          </p>
                        </div>

                        <div className="mt-6 space-y-5 text-sm">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Conversation Summary
                            </p>

                            <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-800">
                              {interaction.conversation_summary}
                            </p>
                          </div>

                          {interaction.customer_feedback && (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                                Customer Feedback
                              </p>

                              <p className="mt-2 whitespace-pre-wrap leading-6 text-blue-950">
                                {interaction.customer_feedback}
                              </p>
                            </div>
                          )}

                          {interaction.objections &&
                            interaction.objections.toLowerCase() !== "none" && (
                              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-red-700">
                                  Objections or Concerns
                                </p>

                                <p className="mt-2 whitespace-pre-wrap leading-6 text-red-950">
                                  {interaction.objections}
                                </p>
                              </div>
                            )}

                          <div className="grid gap-4 md:grid-cols-2">
                            {interaction.kiprod_commitments && (
                              <div className="rounded-2xl bg-slate-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                  KIPROD Commitment
                                </p>

                                <p className="mt-2 leading-6 text-slate-800">
                                  {interaction.kiprod_commitments}
                                </p>
                              </div>
                            )}

                            {interaction.institution_commitments && (
                              <div className="rounded-2xl bg-slate-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                  Institution Commitment
                                </p>

                                <p className="mt-2 leading-6 text-slate-800">
                                  {interaction.institution_commitments}
                                </p>
                              </div>
                            )}
                          </div>

                          {interaction.outcome && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Outcome
                              </p>

                              <p className="mt-2 leading-6 text-slate-800">
                                {interaction.outcome}
                              </p>
                            </div>
                          )}

                          {(interaction.next_action ||
                            interaction.follow_up_at) && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                              <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                                Follow-up Required
                              </p>

                              {interaction.next_action && (
                                <p className="mt-2 font-semibold leading-6 text-amber-950">
                                  {interaction.next_action}
                                </p>
                              )}

                              {interaction.follow_up_at && (
                                <p className="mt-3 text-xs font-black text-amber-800">
                                  Due: {formatDate(interaction.follow_up_at)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
