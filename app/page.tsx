import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardPath } from "@/lib/roles";

export default async function HomePage() {
  const { profile } = await requireUser();

  redirect(getDashboardPath(profile.role));
}