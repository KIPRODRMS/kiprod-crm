import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "./actions";

type ContactsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function cleanPhoneNumber(value: string | null) {
  if (!value) return "";

  return value.replace(/[^\d]/g, "");
}

export default async function ContactsPage({
  searchParams,
}: ContactsPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, status")
    .order("name", { ascending: true });

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select(`
      id,
      institution_id,
      full_name,
      job_title,
      department,
      email,
      phone,
      whatsapp_number,
      is_primary,
      decision_maker,
      created_at
    `)
    .order("created_at", { ascending: false });

  const institutionMap = new Map(
    (institutions || []).map((institution) => [
      institution.id,
      institution.name,
    ])
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95 px-6 py-5 shadow-sm backdrop-blur lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-amber-700 hover:text-amber-600"
            >
              ← CRM Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Institutional Contacts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage decision-makers and relationship contacts across the
              KIPROD pipeline.
            </p>
          </div>

          <div className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">
            {contacts?.length || 0} Contacts
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:px-10">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-800 bg-slate-950 px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              New Contact
            </p>

            <h2 className="mt-2 text-xl font-black">
              Add Institutional Contact
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Record the people involved in each institutional relationship.
            </p>
          </div>

          <div className="p-6">
            {messages.success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {messages.success}
              </div>
            )}

            {messages.error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {messages.error}
              </div>
            )}

            {(!institutions || institutions.length === 0) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">
                  Add an institution first
                </p>

                <p className="mt-2 text-sm text-amber-800">
                  Every contact must belong to an institution.
                </p>

                <Link
                  href="/institutions"
                  className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-slate-950"
                >
                  Go to Institutions
                </Link>
              </div>
            )}

            {institutions && institutions.length > 0 && (
              <form action={createContact} className="space-y-5">
                <div>
                  <label
                    htmlFor="institution_id"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Institution *
                  </label>

                  <select
                    id="institution_id"
                    name="institution_id"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  >
                    <option value="" disabled>
                      Select institution
                    </option>

                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="full_name"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Full Name *
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    required
                    placeholder="Example: Jane Wanjiku"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="job_title"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Job Title
                  </label>

                  <input
                    id="job_title"
                    name="job_title"
                    placeholder="Credit Manager"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Department
                  </label>

                  <select
                    id="department"
                    name="department"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  >
                    <option value="">Select department</option>
                    <option value="Executive Management">
                      Executive Management
                    </option>
                    <option value="Board">Board</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Credit">Credit</option>
                    <option value="Learning and Development">
                      Learning and Development
                    </option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@institution.co.ke"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      placeholder="+254..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="whatsapp_number"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                    >
                      WhatsApp
                    </label>

                    <input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      placeholder="+254..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="is_primary"
                      className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                    />

                    <span>
                      <span className="block text-sm font-bold text-slate-800">
                        Primary contact
                      </span>

                      <span className="text-xs text-slate-500">
                        Main relationship contact for this institution.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="decision_maker"
                      className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                    />

                    <span>
                      <span className="block text-sm font-bold text-slate-800">
                        Decision-maker
                      </span>

                      <span className="text-xs text-slate-500">
                        Can approve, recommend or influence an engagement.
                      </span>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400"
                >
                  Save Contact
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Relationship Network
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Contact Directory
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              CEOs, managers, board members, procurement officers and other
              institutional stakeholders.
            </p>
          </div>

          {contactsError && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Failed to load contacts: {contactsError.message}
            </div>
          )}

          {!contactsError && (!contacts || contacts.length === 0) && (
            <div className="px-8 py-24 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black">
                C
              </div>

              <p className="mt-5 text-lg font-black text-slate-800">
                No contacts recorded
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add the first person connected to a KIPROD institution.
              </p>
            </div>
          )}

          {contacts && contacts.length > 0 && (
            <div className="grid gap-5 bg-slate-50/70 p-6 md:grid-cols-2">
              {contacts.map((contact) => {
                const institutionName =
                  institutionMap.get(contact.institution_id) ||
                  "Unknown institution";

                const whatsappNumber = cleanPhoneNumber(
                  contact.whatsapp_number
                );

                return (
                  <article
                    key={contact.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          {contact.full_name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {contact.job_title || "Role not recorded"}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {contact.is_primary && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                            Primary
                          </span>
                        )}

                        {contact.decision_maker && (
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                            Decision-maker
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/institutions/${contact.institution_id}`}
                      className="mt-4 block rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      {institutionName} →
                    </Link>

                    {contact.department && (
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        {contact.department}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 text-sm">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="block break-all font-semibold text-amber-700 hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}

                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="block font-semibold text-slate-700 hover:text-slate-950"
                        >
                          {contact.phone}
                        </a>
                      )}
                    </div>

                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Open WhatsApp
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}