"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatRoleLabel,
  getAccessLevel,
  type AccessLevel,
} from "@/lib/roles";
import GlobalSearch from "./GlobalSearch";
import InstallAppButton from "./InstallAppButton";

type AppFrameProps = {
  children: ReactNode;
};

type Identity = {
  userId: string;
  name: string;
  email: string;
  role: string;
  rawRole: string;
  accessLevel: AccessLevel;
};

type NavigationItem = {
  label: string;
  href: string;
  short: string;
  exact?: boolean;
};

const teamMemberNavigation: NavigationItem[] =
  [
    {
      label: "My Workspace",
      href: "/my-workspace",
      short: "MW",
      exact: true,
    },
    {
      label: "My Institutions",
      href: "/my-institutions",
      short: "IN",
    },
    {
      label: "My Contacts",
      href: "/my-contacts",
      short: "CO",
    },
    {
      label: "My Opportunities",
      href: "/my-opportunities",
      short: "OP",
    },
    {
      label: "My Tasks",
      href: "/my-tasks",
      short: "TA",
    },
    {
      label: "My Reports",
      href: "/my-reports",
      short: "RE",
    },
    {
      label: "My Academy",
      href: "/my-academy",
      short: "AC",
    },
  ];

const managementNavigation: NavigationItem[] =
  [
    {
      label: "Management Dashboard",
      href: "/management",
      short: "MD",
      exact: true,
    },
    {
      label: "Management Centre",
      href: "/management/centre",
      short: "MC",
    },
    {
      label: "Institutions",
      href: "/institutions",
      short: "IN",
    },
    {
      label: "Contacts",
      href: "/contacts",
      short: "CO",
    },
    {
      label: "Opportunities",
      href: "/opportunities",
      short: "OP",
    },
    {
      label: "Tasks",
      href: "/tasks",
      short: "TA",
    },
    {
      label: "Team Reports",
      href: "/reports",
      short: "RE",
    },
    {
      label: "KIPROD Academy",
      href: "/academy",
      short: "AC",
    },
  ];

function getPageTitle(
  pathname: string
) {
  if (
    pathname.startsWith(
      "/my-institutions/"
    )
  ) {
    return "Assigned Institution";
  }

  if (
    pathname.startsWith(
      "/my-institutions"
    )
  ) {
    return "My Institutions";
  }

  if (
    pathname.startsWith("/my-contacts")
  ) {
    return "My Contacts";
  }

  if (
    pathname.startsWith(
      "/my-opportunities"
    )
  ) {
    return "My Opportunities";
  }

  if (
    pathname.startsWith("/my-tasks")
  ) {
    return "My Tasks";
  }

  if (
    pathname.startsWith("/my-reports")
  ) {
    return "My Reports";
  }

  if (
    pathname.startsWith("/my-academy")
  ) {
    return "My Academy";
  }

  if (
    pathname.startsWith(
      "/my-workspace"
    )
  ) {
    return "My Workspace";
  }

  if (
    pathname.startsWith(
      "/management/centre"
    )
  ) {
    return "Management Centre";
  }

  if (
    pathname.startsWith("/management")
  ) {
    return "Management Dashboard";
  }

  if (
    pathname.startsWith(
      "/institutions/import"
    )
  ) {
    return "Import Institutions";
  }

  if (
    pathname.startsWith("/institutions/")
  ) {
    return "Institution Profile";
  }

  if (
    pathname.startsWith("/institutions")
  ) {
    return "Institutions";
  }

  if (
    pathname.startsWith("/contacts")
  ) {
    return "Contacts";
  }

  if (
    pathname.startsWith("/opportunities")
  ) {
    return "Opportunities";
  }

  if (
    pathname.startsWith("/tasks")
  ) {
    return "Tasks";
  }

  if (
    pathname.startsWith("/reports")
  ) {
    return "Team Reports";
  }

  if (
    pathname.startsWith("/academy")
  ) {
    return "KIPROD Academy";
  }

  if (
    pathname.startsWith(
      "/change-password"
    )
  ) {
    return "Change Password";
  }

  if (
    pathname.startsWith("/profile")
  ) {
    return "My Profile";
  }

  if (
    pathname.startsWith(
      "/admin/sacco-import"
    )
  ) {
    return "SACCO Master Import";
  }

  if (
    pathname.startsWith(
      "/admin/institutions"
    )
  ) {
    return "Institution Administration";
  }

  if (
    pathname.startsWith(
      "/admin/contacts"
    )
  ) {
    return "Contact Administration";
  }

  if (
    pathname.startsWith("/admin")
  ) {
    return "Super Admin Centre";
  }

  return "KIPROD CRM";
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase()
    )
    .join("");

  return letters || "KR";
}

function isNavigationActive({
  pathname,
  item,
}: {
  pathname: string;
  item: NavigationItem;
}) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname.startsWith(
    item.href
  );
}

function NavigationLinks({
  pathname,
  accessLevel,
  onNavigate,
}: {
  pathname: string;
  accessLevel: AccessLevel;
  onNavigate?: () => void;
}) {
  const navigation =
    accessLevel === "team_member"
      ? teamMemberNavigation
      : managementNavigation;

  return (
    <nav
      className="space-y-1.5 px-4 py-5"
      aria-label="Primary navigation"
    >
      {navigation.map((item) => {
        const active =
          isNavigationActive({
            pathname,
            item,
          });

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={
              active
                ? "page"
                : undefined
            }
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold leading-5 transition ${
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

            <span className="min-w-0 whitespace-normal break-words">
              {item.label}
            </span>
          </Link>
        );
      })}

      {accessLevel ===
        "super_admin" && (
        <Link
          href="/admin"
          onClick={onNavigate}
          aria-current={
            pathname.startsWith(
              "/admin"
            )
              ? "page"
              : undefined
          }
          className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold leading-5 transition ${
            pathname.startsWith(
              "/admin"
            )
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/15"
              : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tracking-wider ${
              pathname.startsWith(
                "/admin"
              )
                ? "bg-slate-950 text-amber-400"
                : "bg-slate-900 text-slate-400"
            }`}
          >
            SA
          </span>

          <span className="min-w-0 whitespace-normal break-words">
            Super Admin Centre
          </span>
        </Link>
      )}
    </nav>
  );
}

export default function AppFrame({
  children,
}: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const profileMenuRef =
    useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [identity, setIdentity] =
    useState<Identity>({
      userId: "",
      name: "KIPROD Team",
      email: "",
      role: "Team Member",
      rawRole: "",
      accessLevel: "team_member",
    });

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/install" ||
    pathname.startsWith("/auth/");

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeProfileMenu(
      event: MouseEvent
    ) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeProfileMenu
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeProfileMenu
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    function closeOnEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.body.style.overflow =
      "hidden";

    document.addEventListener(
      "keydown",
      closeOnEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (isPublicRoute) {
      setCheckingSession(false);
      return;
    }

    let active = true;

    async function loadIdentity() {
      setCheckingSession(true);

      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (authError || !user) {
        router.replace("/login");
        router.refresh();
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, role, is_active"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (
        profileError ||
        !profile ||
        profile.is_active === false
      ) {
        await supabase.auth.signOut();

        router.replace(
          "/login?error=Your CRM account is inactive or unavailable"
        );

        router.refresh();
        return;
      }

      const rawRole =
        profile.role || "";

      setIdentity({
        userId: user.id,

        name:
          profile.full_name?.trim() ||
          user.email?.split("@")[0] ||
          "KIPROD User",

        email: user.email || "",

        role:
          formatRoleLabel(rawRole),

        rawRole,

        accessLevel:
          getAccessLevel(rawRole),
      });

      setCheckingSession(false);
    }

    void loadIdentity();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session && active) {
            router.replace("/login");
            router.refresh();
          }
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [
    isPublicRoute,
    router,
    supabase,
  ]);

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    async function verifySession() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        router.refresh();
      }
    }

    function handlePageShow() {
      void verifySession();
    }

    window.addEventListener(
      "pageshow",
      handlePageShow
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        handlePageShow
      );
    };
  }, [
    isPublicRoute,
    router,
    supabase,
  ]);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setProfileOpen(false);
    setMobileOpen(false);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "KIPROD CRM sign-out failed:",
        error.message
      );

      setSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (isPublicRoute) {
    return children;
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">
            KIPROD CRM
          </p>

          <p className="mt-3 text-sm font-bold text-slate-300">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  const pageTitle =
    getPageTitle(pathname);

  const workspaceLabel =
    identity.accessLevel ===
    "team_member"
      ? "Team Workspace"
      : identity.accessLevel ===
          "super_admin"
        ? "Management & Administration"
        : "Management Workspace";

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
            {workspaceLabel}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavigationLinks
            pathname={pathname}
            accessLevel={
              identity.accessLevel
            }
          />
        </div>

        <div className="border-t border-slate-800 px-4 py-4">
          <div className="rounded-xl bg-slate-900 px-4 py-3">
            <p className="truncate text-sm font-black text-white">
              {identity.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {identity.role}
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="relative flex h-full w-[88vw] max-w-sm flex-col overflow-hidden bg-slate-950 text-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-5 py-5">
              <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.3em] text-amber-500">
                  KIPROD CRM
                </p>

                <p className="mt-2 break-words font-black leading-5">
                  Institutional Growth Hub
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {workspaceLabel}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() =>
                  setMobileOpen(false)
                }
                className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-amber-500 hover:text-amber-400"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <NavigationLinks
                pathname={pathname}
                accessLevel={
                  identity.accessLevel
                }
                onNavigate={() =>
                  setMobileOpen(false)
                }
              />
            </div>

            <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="mb-3 rounded-xl bg-slate-900 px-4 py-3">
                <p className="truncate text-sm font-black text-white">
                  {identity.name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {identity.role}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-left text-sm font-black text-red-300 transition hover:border-red-700 hover:bg-red-950/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                onClick={() =>
                  setMobileOpen(true)
                }
                className="shrink-0 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 lg:hidden"
              >
                Menu
              </button>

              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 sm:text-xs sm:tracking-[0.18em]">
                  KIPROD CRM
                </p>

                <h2 className="max-w-32 truncate text-base font-black tracking-tight text-slate-950 sm:max-w-52 sm:text-2xl xl:max-w-64">
                  {pageTitle}
                </h2>
              </div>
            </div>

            <GlobalSearch
              accessLevel={
                identity.accessLevel
              }
              userId={identity.userId}
            />

            <div
              ref={profileMenuRef}
              className="relative shrink-0"
            >
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (current) =>
                      !current
                  )
                }
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-left transition hover:border-amber-400 hover:bg-amber-50 sm:px-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-amber-400">
                  {initials(identity.name)}
                </span>

                <span className="hidden min-w-0 xl:block">
                  <span className="block max-w-52 truncate text-sm font-black text-slate-950">
                    {identity.name}
                  </span>

                  <span className="mt-0.5 block max-w-52 truncate text-xs text-slate-500">
                    {identity.role}
                  </span>
                </span>

                <span className="hidden text-xs font-black text-slate-400 xl:block">
                  {profileOpen
                    ? "▲"
                    : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
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
                      onClick={() =>
                        setProfileOpen(
                          false
                        )
                      }
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/change-password"
                      onClick={() =>
                        setProfileOpen(
                          false
                        )
                      }
                      className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      Change Password
                    </Link>

                    <InstallAppButton variant="menu" />

                    {identity.accessLevel !==
                      "team_member" && (
                      <Link
                        href="/management"
                        onClick={() =>
                          setProfileOpen(
                            false
                          )
                        }
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                      >
                        Management Workspace
                      </Link>
                    )}

                    {identity.accessLevel ===
                      "super_admin" && (
                      <Link
                        href="/admin"
                        onClick={() =>
                          setProfileOpen(
                            false
                          )
                        }
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
                      >
                        Super Admin Centre
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-200 p-2">
                    <button
                      type="button"
                      onClick={
                        handleSignOut
                      }
                      disabled={signingOut}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {signingOut
                        ? "Signing out..."
                        : "Sign out"}
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