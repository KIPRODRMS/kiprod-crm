import type { ReactNode } from "react";
import { requireManagement } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InstitutionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireManagement();

  return children;
}