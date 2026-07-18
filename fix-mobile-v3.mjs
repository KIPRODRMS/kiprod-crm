import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const targets = [
  "app/manifest.ts",
  "app/components/PwaRegistration.tsx",
  "app/components/AppFrame.tsx",
  "app/components/GlobalSearch.tsx",
  "app/admin/institutions/BulkInstitutionAssignment.tsx",
  "app/admin/institutions/[id]/edit/page.tsx",
];

function run(command, capture = false) {
  return execSync(command, {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
}

function read(file) {
  return fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");
}

function write(file, content) {
  fs.writeFileSync(
    path.join(root, file),
    content.replace(/\r\n/g, "\n"),
    "utf8"
  );
}

function replaceOnce(content, oldText, newText, description) {
  const first = content.indexOf(oldText);

  if (first === -1) {
    if (content.includes(newText)) {
      return content;
    }

    throw new Error(`Could not apply: ${description}`);
  }

  const second = content.indexOf(
    oldText,
    first + oldText.length
  );

  if (second !== -1) {
    throw new Error(
      `Patch matched twice: ${description}`
    );
  }

  return (
    content.slice(0, first) +
    newText +
    content.slice(first + oldText.length)
  );
}

if (!fs.existsSync(path.join(root, "package.json"))) {
  throw new Error(
    "Run this inside the kiprod-crm project folder."
  );
}

let startSha = "";

try {
  run("git checkout main");
  run("git pull --ff-only origin main");

  startSha = run(
    "git rev-parse HEAD",
    true
  ).trim();

  // Manifest name and portrait orientation.
  {
    const file = "app/manifest.ts";
    let content = read(file);

    content = content.replace(
      /name:\s*"KIPROD CRM[^"]*Institutional Growth Hub",/,
      'name: "KIPROD CRM - Institutional Growth Hub",'
    );

    content = content.replace(
      'orientation: "any",',
      'orientation: "portrait-primary",'
    );

    write(file, content);
  }

  // Best-effort portrait lock for installed Android app.
  {
    const file =
      "app/components/PwaRegistration.tsx";

    let content = read(file);

    if (
      !content.includes(
        "function lockInstalledAppToPortrait()"
      )
    ) {
      content = replaceOnce(
        content,
`const OFFICIAL_HOSTS = new Set([
  "kiprod-crm.vercel.app",
  "localhost",
  "127.0.0.1",
]);

export default function PwaRegistration() {`,
`const OFFICIAL_HOSTS = new Set([
  "kiprod-crm.vercel.app",
  "localhost",
  "127.0.0.1",
]);

function lockInstalledAppToPortrait() {
  const iosNavigator =
    navigator;

  const installed =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    iosNavigator.standalone === true;

  if (!installed) {
    return;
  }

  const orientation =
    screen.orientation;

  if (
    orientation &&
    typeof orientation.lock === "function"
  ) {
    orientation
      .lock("portrait-primary")
      .catch(() => {});
  }
}

export default function PwaRegistration() {`,
        "portrait lock function"
      );
    }

    if (
      !content.includes(
        "    lockInstalledAppToPortrait();"
      )
    ) {
      content = replaceOnce(
        content,
`    if (
      !OFFICIAL_HOSTS.has(
        window.location.hostname
      )
    ) {
      return;
    }

    const installWindow =`,
`    if (
      !OFFICIAL_HOSTS.has(
        window.location.hostname
      )
    ) {
      return;
    }

    lockInstalledAppToPortrait();

    const installWindow =`,
        "portrait lock activation"
      );
    }

    write(file, content);
  }

  // Mobile header layout.
  {
    const file =
      "app/components/AppFrame.tsx";

    let content = read(file);

    content = replaceOnce(
      content,
      '          <div className="flex items-center gap-2 sm:gap-4">',
      '          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">',
      "mobile header wrapping"
    );

    content = replaceOnce(
      content,
      '            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">',
      '            <div className="order-1 flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:shrink-0 sm:gap-3">',
      "mobile title row"
    );

    content = replaceOnce(
      content,
`            <div
              ref={profileMenuRef}
              className="relative shrink-0"`,
`            <div
              ref={profileMenuRef}
              className="relative order-2 shrink-0 sm:order-3"`,
      "mobile profile position"
    );

    write(file, content);
  }

  // Search gets its own full-width row on phones.
  {
    const file =
      "app/components/GlobalSearch.tsx";

    let content = read(file);

    content = replaceOnce(
      content,
      '      className="relative ml-auto min-w-0 flex-1 md:max-w-xl"',
      '      className="relative order-3 w-full min-w-0 sm:order-2 sm:ml-auto sm:flex-1 md:max-w-xl"',
      "mobile search width"
    );

    content = replaceOnce(
      content,
      '        className="flex min-w-0 items-center gap-2"',
      '        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"',
      "mobile search columns"
    );

    write(file, content);
  }

  // Bulk assignment: names only and no Super Admin.
  {
    const file =
      "app/admin/institutions/BulkInstitutionAssignment.tsx";

    let content = read(file);

    content = content.replace(
      /function roleLabel\(role: string \| null\) \{[\s\S]*?\n\}\n\nfunction formatLabel/,
      "function formatLabel"
    );

    content = content.replace(
      /\{profiles\.map\(\s*\(profile\) => \(/,
`{profiles
                .filter(
                  (profile) =>
                    profile.role !==
                    "super_admin"
                )
                .map((profile) => (`
    );

    content = content.replace(
      /\{profileLabel\(profile\)\}[\s\S]{0,100}\{roleLabel\(profile\.role\)\}/,
      "{profileLabel(profile)}"
    );

    content = content.replace(
      "{profiles.length === 0 && (",
`{profiles.filter(
              (profile) =>
                profile.role !==
                "super_admin"
            ).length === 0 && (`
    );

    write(file, content);
  }

  // Individual institution/contact assignment.
  {
    const file =
      "app/admin/institutions/[id]/edit/page.tsx";

    let content = read(file);

    content = content.replace(
      /function roleLabel\(\s*role: string \| null\s*\) \{[\s\S]*?\n\}\n\nfunction InputField/,
      "function InputField"
    );

    content = content.replace(
      "...profiles.map((profile) => ({",
`...profiles
        .filter(
          (profile) =>
            profile.role !==
            "super_admin"
        )
        .map((profile) => ({`
    );

    content = content.replace(
      /label:\s*`\$\{\s*profile\.full_name\s*\|\|\s*profile\.email\s*\|\|\s*"Unnamed Team Member"\s*\}[\s\S]{0,100}roleLabel\([\s\S]{0,50}\)\}`,/,
`label:
            profile.full_name ||
            profile.email ||
            "Unnamed Team Member",`
    );

    write(file, content);
  }

  console.log("\nRunning production build...\n");
  run("npm run build");

  run(
    `git add -- ${targets
      .map((file) => `"${file}"`)
      .join(" ")}`
  );

  let changed = false;

  try {
    run("git diff --cached --quiet", true);
  } catch {
    changed = true;
  }

  if (changed) {
    run(
      'git commit -m "Fix mobile search and assignment display"'
    );

    run("git push origin main");
  }

  console.log("\nSUCCESS.");
  console.log("- Search is full-width in portrait.");
  console.log("- Strange assignment characters are removed.");
  console.log("- Assignment dropdowns show names only.");
  console.log("- Super Admin is excluded.");
  console.log("- Installed app prefers portrait.");
} catch (error) {
  console.error(`\nFAILED: ${error.message}`);

  if (startSha) {
    try {
      run(
        `git restore --source "${startSha}" --staged --worktree -- ${targets
          .map((file) => `"${file}"`)
          .join(" ")}`
      );
    } catch {}
  }

  console.error(
    "Nothing from this fix was committed or pushed."
  );

  process.exit(1);
}
