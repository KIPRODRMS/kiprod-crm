"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (password.length < 8) {
      setIsError(true);
      setMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setIsError(true);
      setMessage("The two passwords do not match.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setPassword("");
    setConfirmation("");
    setMessage("Password updated successfully.");
    setIsSaving(false);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-950 px-6 py-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
            Account Security
          </p>
          <h1 className="mt-2 text-3xl font-black">Change Password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Create a new password for your KIPROD CRM account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat the new password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-amber-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Updating password..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

