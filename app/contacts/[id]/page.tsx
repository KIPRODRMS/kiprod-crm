import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ContactDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "C"
  );
}

function normaliseWhatsApp(value: string | null) {
  if (!value) return "";

  const digits = value.replace(/[^\d]/g, "");

  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: contact, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error || !contact) {
    notFound();
  }

  const { data: institution } = await supabase
    .from("institutions")
    .select("id, name, institution_type, sector, location, status")
    .eq("id", contact.institution_id)
    .maybeSingle();

  const whatsappNumber = normaliseWhatsApp(
    contact.whatsapp_number || contact.phone
  );

  const details = [
    ["Full name", contact.full_name],
    ["Job title", contact.job_title || "Not recorded"],
    ["Department", contact.department || "Not recorded"],
    ["Institution", institution?.name || "Unknown institution"],
    ["Email", contact.email || "Not recorded"],
    ["Phone", contact.phone || "Not recorded"],
    ["WhatsApp", contact.whatsapp_number || contact.phone || "Not recorded"],
    ["Added", formatDate(contact.created_at)],
  ];

  return (
    <section className="space-y-6">
      <Link
        href="/contacts"
        className="inline-block text-sm font-black text-amber-700 hover:text-amber-600"
      >
        ← Back to Contacts
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-950 px-6 py-7 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-500 text-2xl font-black text-slate-950">
              {initials(contact.full_name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black">
                  {contact.full_name}
                </h1>

                {contact.is_primary && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                    Primary contact
                  </span>
                )}

                {contact.decision_maker && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                    Decision-maker
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm font-bold text-slate-300">
                {contact.job_title || "Role not recorded"}
                {contact.department ? ` · ${contact.department}` : ""}
              </p>

              {institution && (
                <Link
                  href={`/institutions/${institution.id}`}
                  className="mt-2 inline-block text-sm font-black text-amber-400 hover:text-amber-300"
                >
                  {institution.name} →
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white"
            >
              Call
            </a>
          )}

          {contact.phone && (
            <a
              href={`sms:${contact.phone}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-800"
            >
              Send SMS
            </a>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white"
            >
              WhatsApp
            </a>
          )}

          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white"
            >
              Send Email
            </a>
          )}
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div>
            <h2 className="text-xl font-black">Contact Information</h2>

            <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_1fr]"
                >
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="break-words text-sm font-bold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <h2 className="text-xl font-black">Institution</h2>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-lg font-black text-slate-950">
                {institution?.name || "Unknown institution"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {institution?.institution_type || "Type not recorded"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {institution?.sector || "Sector not recorded"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {institution?.location || "Location not recorded"}
              </p>

              {institution && (
                <Link
                  href={`/institutions/${institution.id}`}
                  className="mt-5 block rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-slate-950"
                >
                  Open Institution
                </Link>
              )}
            </div>
          </aside>
        </div>
      </article>
    </section>
  );
}

