import type { ReactNode } from "react";
import { requireTeamMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyOpportunitiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireTeamMember();

  return children;
}