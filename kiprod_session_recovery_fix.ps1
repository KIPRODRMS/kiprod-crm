$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
  throw "Run this file from the kiprod-crm project folder."
}

$target =
  "app\components\AppFrame.tsx"

if (-not (Test-Path $target)) {
  throw "AppFrame.tsx was not found."
}

$timestamp =
  Get-Date -Format "yyyyMMdd-HHmmss"

$tempBackup =
  Join-Path `
    $env:TEMP `
    "KIPROD-AppFrame-$timestamp.tsx"

$targetWasDirty = $false

git diff --quiet -- $target

if ($LASTEXITCODE -ne 0) {
  $targetWasDirty = $true
  Copy-Item $target $tempBackup -Force
  git restore --staged --worktree -- $target
}

git checkout main

if ($LASTEXITCODE -ne 0) {
  throw "Could not switch to main."
}

git pull --ff-only origin main

if ($LASTEXITCODE -ne 0) {
  if ($targetWasDirty) {
    Copy-Item $tempBackup $target -Force
  }

  throw "Could not update main from GitHub."
}

$startSha =
  (git rev-parse HEAD).Trim()

$utf8NoBom =
  New-Object System.Text.UTF8Encoding(
    $false
  )

function Replace-Once {
  param(
    [string]$RelativePath,
    [string]$OldText,
    [string]$NewText,
    [string]$Description
  )

  $fullPath =
    Join-Path `
      (Get-Location) `
      $RelativePath

  $content =
    [System.IO.File]::ReadAllText(
      $fullPath
    ).Replace(
      "`r`n",
      "`n"
    )

  $oldNormal =
    $OldText.Replace(
      "`r`n",
      "`n"
    )

  $newNormal =
    $NewText.Replace(
      "`r`n",
      "`n"
    )

  $firstIndex =
    $content.IndexOf(
      $oldNormal,
      [StringComparison]::Ordinal
    )

  if ($firstIndex -lt 0) {
    throw "Could not apply: $Description"
  }

  $secondIndex =
    $content.IndexOf(
      $oldNormal,
      $firstIndex +
        $oldNormal.Length,
      [StringComparison]::Ordinal
    )

  if ($secondIndex -ge 0) {
    throw "Patch anchor was not unique: $Description"
  }

  $updated =
    $content.Substring(
      0,
      $firstIndex
    ) +
    $newNormal +
    $content.Substring(
      $firstIndex +
        $oldNormal.Length
    )

  [System.IO.File]::WriteAllText(
    $fullPath,
    $updated,
    $utf8NoBom
  )
}

try {
  Replace-Once `
    $target `
@'
type Identity = {
  userId: string;
  name: string;
  email: string;
  role: string;
  rawRole: string;
  accessLevel: AccessLevel;
};

type NavigationItem = {
'@ `
@'
type Identity = {
  userId: string;
  name: string;
  email: string;
  role: string;
  rawRole: string;
  accessLevel: AccessLevel;
};

type SessionProblem =
  | "offline"
  | "timeout"
  | "connection"
  | null;

type NavigationItem = {
'@ `
    "Add session problem type"

  Replace-Once `
    $target `
@'
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [identity, setIdentity] =
'@ `
@'
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    sessionProblem,
    setSessionProblem,
  ] = useState<SessionProblem>(null);

  const [
    sessionAttempt,
    setSessionAttempt,
  ] = useState(0);

  const [isOnline, setIsOnline] =
    useState(true);

  const [identity, setIdentity] =
'@ `
    "Add session recovery state"

  Replace-Once `
    $target `
@'
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
'@ `
@'
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setSessionProblem(null);
      setSessionAttempt(
        (current) => current + 1
      );
    }

    function handleOffline() {
      setIsOnline(false);
      setCheckingSession(false);
      setSessionProblem("offline");
    }

    setIsOnline(navigator.onLine);

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  useEffect(() => {
    if (isPublicRoute) {
      setCheckingSession(false);
      setSessionProblem(null);
      return;
    }

    let active = true;
    let timedOut = false;

    setCheckingSession(true);
    setSessionProblem(null);

    const timeoutId =
      window.setTimeout(() => {
        if (!active) {
          return;
        }

        timedOut = true;
        setCheckingSession(false);
        setSessionProblem(
          navigator.onLine
            ? "timeout"
            : "offline"
        );
      }, 12000);

    async function loadIdentity() {
      try {
        if (!navigator.onLine) {
          window.clearTimeout(
            timeoutId
          );

          if (!active || timedOut) {
            return;
          }

          setIsOnline(false);
          setCheckingSession(false);
          setSessionProblem("offline");
          return;
        }

        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (!active || timedOut) {
          return;
        }

        if (authError) {
          throw authError;
        }

        if (!user) {
          window.clearTimeout(
            timeoutId
          );

          setCheckingSession(false);
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

        if (!active || timedOut) {
          return;
        }

        if (profileError) {
          throw profileError;
        }

        if (
          !profile ||
          profile.is_active === false
        ) {
          window.clearTimeout(
            timeoutId
          );

          await supabase.auth.signOut();

          if (!active) {
            return;
          }

          setCheckingSession(false);

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

        window.clearTimeout(
          timeoutId
        );

        setIsOnline(true);
        setSessionProblem(null);
        setCheckingSession(false);
      } catch (error) {
        window.clearTimeout(
          timeoutId
        );

        if (!active || timedOut) {
          return;
        }

        console.error(
          "KIPROD CRM session check failed:",
          error
        );

        setCheckingSession(false);
        setSessionProblem(
          navigator.onLine
            ? "connection"
            : "offline"
        );
      }
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

      window.clearTimeout(
        timeoutId
      );

      subscription.unsubscribe();
    };
  }, [
    isPublicRoute,
    router,
    sessionAttempt,
    supabase,
  ]);
'@ `
    "Add network and timeout handling"

  Replace-Once `
    $target `
@'
  async function handleSignOut() {
'@ `
@'
  function handleSessionRetry() {
    setSessionProblem(null);
    setCheckingSession(true);
    setSessionAttempt(
      (current) => current + 1
    );
  }

  async function handleSignOut() {
'@ `
    "Add session retry action"

  Replace-Once `
    $target `
@'
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
'@ `
@'
  if (isPublicRoute) {
    return children;
  }

  if (sessionProblem) {
    const offline =
      sessionProblem === "offline" ||
      !isOnline;

    const title = offline
      ? "You are offline"
      : "Connection problem";

    const message = offline
      ? "Reconnect to Wi-Fi or mobile data, then retry."
      : sessionProblem === "timeout"
        ? "The CRM took too long to confirm your session. Your account has not been changed."
        : "The CRM could not confirm your session. Check your connection and try again.";

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 px-6 py-6">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">
              KIPROD CRM
            </p>

            <h1 className="mt-3 text-2xl font-black">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {message}
            </p>
          </div>

          <div className="grid gap-3 p-6">
            <button
              type="button"
              onClick={handleSessionRetry}
              className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Retry Connection
            </button>

            <a
              href="/login"
              className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-black text-white transition hover:border-amber-500 hover:bg-slate-800"
            >
              Open Login
            </a>

            <a
              href="https://kiprod-crm.vercel.app/login"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-black text-slate-300 transition hover:border-amber-500 hover:bg-slate-800 hover:text-white"
            >
              Open in Browser
            </a>

            <p className="mt-2 break-all text-center text-[11px] leading-5 text-slate-500">
              Official CRM: https://kiprod-crm.vercel.app
            </p>
          </div>
        </div>
      </div>
    );
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

          <p className="mt-2 text-xs text-slate-500">
            Checking your secure CRM session
          </p>
        </div>
      </div>
    );
  }
'@ `
    "Replace endless loading screen"
}
catch {
  git restore `
    --source $startSha `
    --staged `
    --worktree `
    -- $target

  if ($targetWasDirty) {
    Copy-Item `
      $tempBackup `
      $target `
      -Force
  }

  throw
}

Write-Host ""
Write-Host `
  "Running production build..." `
  -ForegroundColor Cyan

& npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host `
    "BUILD FAILED. Restoring the starting file..." `
    -ForegroundColor Red

  git restore `
    --source $startSha `
    --staged `
    --worktree `
    -- $target

  if ($targetWasDirty) {
    Copy-Item `
      $tempBackup `
      $target `
      -Force
  }

  throw "Nothing was committed or pushed."
}

git add -- $target

git diff --cached --quiet

if ($LASTEXITCODE -ne 0) {
  git commit -m `
    "Prevent endless CRM session loading"

  if ($LASTEXITCODE -ne 0) {
    git restore `
      --source $startSha `
      --staged `
      --worktree `
      -- $target

    if ($targetWasDirty) {
      Copy-Item `
        $tempBackup `
        $target `
        -Force
    }

    throw "Commit failed. Nothing was pushed."
  }

  git push origin main

  if ($LASTEXITCODE -ne 0) {
    throw "Build and commit passed, but push failed."
  }
}

Write-Host ""
Write-Host "SUCCESS." -ForegroundColor Green
Write-Host ""
Write-Host "The app now stops waiting after 12 seconds."
Write-Host "It shows Retry Connection, Open Login and Open in Browser."
Write-Host "It also retries automatically when the phone comes back online."

if ($targetWasDirty) {
  Write-Host ""
  Write-Host `
    "Your earlier AppFrame changes were backed up here:" `
    -ForegroundColor Yellow

  Write-Host $tempBackup
}
