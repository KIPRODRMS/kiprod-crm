import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { importInstitutionsCsv } from "../actions";

type ImportPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ImportInstitutionsPage({
  searchParams,
}: ImportPageProps) {
  const messages = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/institutions"
          className="text-sm font-bold text-amber-700"
        >
          ← Back to Institutions
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-slate-950 px-7 py-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Bulk Upload
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Import Institutions from CSV
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Upload up to 1,000 institutional records at once.
            </p>
          </div>

          <div className="p-7">
            {messages.error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {messages.error}
              </div>
            )}

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-black text-blue-950">
                Required CSV column
              </p>

              <p className="mt-2 text-sm text-blue-900">
                The CSV must contain a column named:
              </p>

              <code className="mt-3 block rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-900">
                name
              </code>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black">Supported columns</p>

              <p className="mt-3 break-words text-sm leading-7 text-slate-600">
                name, institution_type, sector, location, website,
                email, phone, source, status, next_action,
                next_follow_up_at
              </p>
            </div>

            <form
              action={importInstitutionsCsv}
              encType="multipart/form-data"
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="csv_file"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
                >
                  Select CSV File
                </label>

                <input
                  id="csv_file"
                  name="csv_file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-amber-400"
              >
                Import Institutions
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}