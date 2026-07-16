import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InstitutionImportLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSuperAdmin();

  return children;
}