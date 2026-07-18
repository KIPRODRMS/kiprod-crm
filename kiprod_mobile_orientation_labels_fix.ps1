$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
  throw "Run this file from the kiprod-crm project folder."
}

$targets = @(
  "app/manifest.ts",
  "app/components/PwaRegistration.tsx",
  "app/components/AppFrame.tsx",
  "app/components/GlobalSearch.tsx",
  "app/admin/institutions/page.tsx",
  "app/admin/institutions/BulkInstitutionAssignment.tsx",
  "app/admin/institutions/[id]/edit/page.tsx"
)

$stashCreated = $false
$stashName =
  "kiprod-before-mobile-ui-fix-" +
  (Get-Date -Format "yyyyMMdd-HHmmss")

$dirty = git status --porcelain

if ($dirty) {
  git stash push -u -m $stashName

  if ($LASTEXITCODE -ne 0) {
    throw "Could not create a safety backup."
  }

  $stashCreated = $true
}

git checkout main

if ($LASTEXITCODE -ne 0) {
  throw "Could not switch to main."
}

git pull --ff-only origin main

if ($LASTEXITCODE -ne 0) {
  if ($stashCreated) {
    git stash pop | Out-Null
  }

  throw "Could not update main from GitHub."
}

$startSha = (git rev-parse HEAD).Trim()

$backupBranch =
  "backup/kiprod-mobile-ui-" +
  (Get-Date -Format "yyyyMMdd-HHmmss")

git branch $backupBranch $startSha

$utf8NoBom =
  New-Object System.Text.UTF8Encoding($false)

function Replace-Once {
  param(
    [string]$RelativePath,
    [string]$OldText,
    [string]$NewText,
    [string]$Description
  )

  $fullPath =
    Join-Path (Get-Location) $RelativePath

  $content =
    [System.IO.File]::ReadAllText(
      $fullPath
    ).Replace("`r`n", "`n")

  $oldNormal =
    $OldText.Replace("`r`n", "`n")

  $newNormal =
    $NewText.Replace("`r`n", "`n")

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
      $firstIndex + $oldNormal.Length,
      [StringComparison]::Ordinal
    )

  if ($secondIndex -ge 0) {
    throw "Patch anchor was not unique: $Description"
  }

  $updated =
    $content.Substring(0, $firstIndex) +
    $newNormal +
    $content.Substring(
      $firstIndex + $oldNormal.Length
    )

  [System.IO.File]::WriteAllText(
    $fullPath,
    $updated,
    $utf8NoBom
  )
}

try {
  Replace-Once `
    "app/manifest.ts" `
    'name: "KIPROD CRM â€” Institutional Growth Hub",' `
    'name: "KIPROD CRM - Institutional Growth Hub",' `
    "Fix the corrupted app name"

  Replace-Once `
    "app/manifest.ts" `
    'orientation: "any",' `
    'orientation: "portrait-primary",' `
    "Lock the installed app to portrait"

  Replace-Once `
    "app/components/PwaRegistration.tsx" `
@'
const OFFICIAL_HOSTS = new Set([
  "kiprod-crm.vercel.app",
  "localhost",
  "127.0.0.1",
]);

export default function PwaRegistration() {
'@ `
@'
const OFFICIAL_HOSTS = new Set([
  "kiprod-crm.vercel.app",
  "localhost",
  "127.0.0.1",
]);

type LockableScreenOrientation =
  ScreenOrientation & {
    lock?: (
      orientation: "portrait-primary"
    ) => Promise<void>;
  };

function lockInstalledAppToPortrait() {
  const iosNavigator =
    navigator as Navigator & {
      standalone?: boolean;
    };

  const installed =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    iosNavigator.standalone === true;

  if (!installed) {
    return;
  }

  const orientation =
    screen.orientation as
      | LockableScreenOrientation
      | undefined;

  if (
    orientation &&
    typeof orientation.lock === "function"
  ) {
    void orientation
      .lock("portrait-primary")
      .catch(() => {
        // The manifest still provides the portrait preference.
      });
  }
}

export default function PwaRegistration() {
'@ `
    "Add installed-app portrait locking"

  Replace-Once `
    "app/components/PwaRegistration.tsx" `
@'
    if (
      !OFFICIAL_HOSTS.has(
        window.location.hostname
      )
    ) {
      return;
    }

    const installWindow =
'@ `
@'
    if (
      !OFFICIAL_HOSTS.has(
        window.location.hostname
      )
    ) {
      return;
    }

    lockInstalledAppToPortrait();

    const installWindow =
'@ `
    "Apply portrait locking when the app starts"

  Replace-Once `
    "app/components/AppFrame.tsx" `
    'className="flex items-center gap-2 sm:gap-4"' `
    'className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4"' `
    "Allow a separate mobile search row"

  Replace-Once `
    "app/components/AppFrame.tsx" `
    'className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"' `
    'className="order-1 flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:shrink-0 sm:gap-3"' `
    "Keep the page title visible on mobile"

  Replace-Once `
    "app/components/AppFrame.tsx" `
    'className="relative shrink-0"' `
    'className="relative order-2 shrink-0 sm:order-3"' `
    "Keep the profile button in the first mobile row"

  Replace-Once `
    "app/components/GlobalSearch.tsx" `
    'className="relative ml-auto min-w-0 flex-1 md:max-w-xl"' `
    'className="relative order-3 w-full min-w-0 sm:order-2 sm:ml-auto sm:flex-1 md:max-w-xl"' `
    "Give search a full-width mobile row"

  Replace-Once `
    "app/admin/institutions/page.tsx" `
@'
    ).filter(
      (profile) =>
        profile.is_active !== false
    );
'@ `
@'
    ).filter(
      (profile) =>
        profile.is_active !== false &&
        profile.role !== "super_admin"
    );
'@ `
    "Remove Super Admin accounts from bulk assignment"

  Replace-Once `
    "app/admin/institutions/BulkInstitutionAssignment.tsx" `
@'
function roleLabel(role: string | null) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "management") {
    return "Management";
  }

  return "Team Member";
}

'@ `
    '' `
    "Remove assignment role labels"

  Replace-Once `
    "app/admin/institutions/BulkInstitutionAssignment.tsx" `
@'
                    {profileLabel(profile)} â€”{" "}
                    {roleLabel(profile.role)}
'@ `
@'
                    {profileLabel(profile)}
'@ `
    "Show names only in the bulk assignment dropdown"

  Replace-Once `
    "app/admin/institutions/[id]/edit/page.tsx" `
@'
function roleLabel(
  role: string | null
) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "management") {
    return "Management";
  }

  return "Team Member";
}

'@ `
    '' `
    "Remove individual assignment role labels"

  Replace-Once `
    "app/admin/institutions/[id]/edit/page.tsx" `
@'
  ).filter(
    (profile) =>
      profile.is_active !== false
  );
'@ `
@'
  ).filter(
    (profile) =>
      profile.is_active !== false &&
      profile.role !== "super_admin"
  );
'@ `
    "Remove Super Admin accounts from individual assignment"

  Replace-Once `
    "app/admin/institutions/[id]/edit/page.tsx" `
@'
        label: `${
          profile.full_name ||
          profile.email ||
          "Unnamed Team Member"
        } — ${roleLabel(
          profile.role
        )}`,
'@ `
@'
        label:
          profile.full_name ||
          profile.email ||
          "Unnamed Team Member",
'@ `
    "Show names only in individual assignment dropdowns"
}
catch {
  git restore `
    --source $startSha `
    --staged `
    --worktree `
    -- $targets

  if ($stashCreated) {
    git stash pop | Out-Null
  }

  throw
}

$badEncoding =
  Select-String `
    -Path `
      "app/manifest.ts", `
      "app/admin/institutions/BulkInstitutionAssignment.tsx", `
      "app/admin/institutions/[id]/edit/page.tsx" `
    -Pattern "â€|Ã|Â" `
    -SimpleMatch `
    -ErrorAction SilentlyContinue

if ($badEncoding) {
  git restore `
    --source $startSha `
    --staged `
    --worktree `
    -- $targets

  if ($stashCreated) {
    git stash pop | Out-Null
  }

  throw "Corrupted text is still present. Nothing was committed or pushed."
}

Write-Host ""
Write-Host "Running production build..." -ForegroundColor Cyan

& npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "BUILD FAILED. Restoring the starting state..." -ForegroundColor Red

  git restore `
    --source $startSha `
    --staged `
    --worktree `
    -- $targets

  if ($stashCreated) {
    git stash pop | Out-Null
  }

  throw "Nothing was committed or pushed."
}

git add -- $targets

git diff --cached --quiet

if ($LASTEXITCODE -ne 0) {
  git commit -m `
    "Fix mobile header orientation and assignment labels"

  if ($LASTEXITCODE -ne 0) {
    git restore `
      --source $startSha `
      --staged `
      --worktree `
      -- $targets

    if ($stashCreated) {
      git stash pop | Out-Null
    }

    throw "Commit failed. Nothing was pushed."
  }

  git push origin main

  if ($LASTEXITCODE -ne 0) {
    throw "Build and commit passed, but push failed."
  }
}

if ($stashCreated) {
  git stash pop | Out-Null
}

Write-Host ""
Write-Host "SUCCESS." -ForegroundColor Green
Write-Host ""
Write-Host "Fixed:"
Write-Host "- Installed app locked to portrait"
Write-Host "- Search gets its own full-width row on phones"
Write-Host "- Corrupted assignment letters removed"
Write-Host "- Super Admin accounts removed from assignment lists"
Write-Host "- Assignment dropdowns now show names only"
