"use client";

import { useState } from "react";

type CopyContactButtonProps = {
  name: string;
  institution: string;
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
};

export default function CopyContactButton({
  name,
  institution,
  jobTitle,
  phone,
  email,
}: CopyContactButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyContact() {
    const contactDetails = [
      name,
      jobTitle || null,
      institution,
      phone ? `Phone: ${phone}` : null,
      email ? `Email: ${email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(
        contactDetails
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      window.prompt(
        "Copy contact details:",
        contactDetails
      );
    }
  }

  return (
    <button
      type="button"
      onClick={copyContact}
      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-amber-500 hover:bg-amber-50"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}