"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type AppFrameProps = {
  children: ReactNode;
};

type Identity = {
  name: string;
  email: string;
  role: string;
  rawRole: string;
};

const navigation = [
  { label: "Dashboard", href: "/", short: "DB" },
  { label: "Institutions", href: "/institutions", short: "IN" },
  { label: "Contacts", href: "/contacts", short: "CO" },
  { label: "Opportunities", href: "/opportunities", short: "OP" },
  { label: "Tasks", href: "/tasks", short: "TA" },
  { label: "Daily & Weekly Reports", href: "/reports", short: "RE" },
  { label: "KIPROD Academy", href: "/academy", short: "AC" },
];

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/institutions/import")) return "Import Institutions";
  if (pathname.startsWith("/institutions/")) return "Institution Profile";
  if (pathname.startsWith("/institutions")) return "Institutions";
  if (pathname.startsWith("/contacts")) return "Contacts";
  if (pathname.startsWith("/opportunities")) return "Opportunities";
  if (pathname.startsWith("/tasks")) return "Tasks";
  if (pathname.startsWith("/reports")) return "Daily & Weekly Reports";
  if (pathname.startsWith("/academy")) return "KIPROD Academy";
  if (pathname.startsWith("/change-password")) return "Change Password";
  if (pathname.startsWith("/profile")) return "My Profile";
  if (pathname.startsWith("/admin")) return "Super Admin Centre";
  return "Dashboard";
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return letters || "KR";
}

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1.5 px-4 py-5">
      {navigation.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
              active
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/15"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tracking-wider ${
                active
                  ? "bg-slate-950 text-amber-400"
                  : "bg-slate-900 text-slate-400"
              }`}
            >
              {item.short}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [identity, setIdentity] = useState<Identity>({
    name: "KIPROD Team",
    email: "",
    role: "Internal User",
    rawRole: "",
  });

  const isPublicRoute =
    pathname === "/login" || pathname.startsWith("/auth/");

  const isAdmin = ["super_admin", "management"].includes(
    identity.rawRole
  );

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeProfileMenu(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfileMenu);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
    };
  }, []);

  useEffect(() => {
    if (isPublicRoute) return;

    let active = true;

    async function loadIdentity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      const rawRole = profile?.role || "";

      setIdentity({
        name:
          profile?.full_name?.trim() ||
          user.email?.split("@")[0] ||
          "KIPROD User",
        email: user.email || "",
        role: rawRole ? formatLabel(rawRole) : "Internal User",
        rawRole,
      });
    }

    void loadIdentity();

    return () => {
      active = false;
    };
  }, [isPublicRoute, supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPublicRoute) {
    return children;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 text-white lg:flex">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-xs font-black tracking-[0.32em] text-amber-500">
            KIPROD
          </p>

          <h1 className="mt-3 text-xl font-black">
            Institutional Growth Hub
          </h1>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Partnerships and Acquisition CRM
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavigationLinks pathname={pathname} />
        </div>


      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[86%] max-w-sm flex-col bg-slate-950 text-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 px-5 py-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-amber-500">
                  KIPROD
                </p>
                <p className="mt-2 font-black">
                  Institutional Growth Hub
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-black text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NavigationLinks
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white lg:hidden"
              >
                Menu
              </button>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                  KIPROD CRM
                </p>

                <h2 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {pageTitle}
                </h2>
              </div>
            </div>

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                aria-expanded={profileOpen}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-amber-400 hover:bg-amber-50 sm:px-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-amber-400">
                  {initials(identity.name)}
                </span>

                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-52 truncate text-sm font-black text-slate-950">
                    {identity.name}
                  </span>
                  <span className="mt-0.5 block max-w-52 truncate text-xs text-slate-500">
                    {identity.role}
                  </span>
                </span>

                <span className="hidden text-xs font-black text-slate-400 sm:block">
                  {profileOpen ? "▲" : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="truncate text-sm font-black text-slate-950">
                      {identity.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {identity.email}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800">
                      {identity.role}
                    </span>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/profile"
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/change-password"
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      Change Password
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800"
                      >
                        Super Admin Centre
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-200 p-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-81px)] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.08),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#eef2f7)] p-4 sm:p-6 lg:p-8">
          <div className="crm-page-content mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


