import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const SCRIPT_NAME = path.basename(process.argv[1] || "kiprod_mobile_cleanup_fix.mjs");

function run(command, options = {}) {
  return execSync(command, {
    cwd: ROOT,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
    ...options,
  });
}

function fail(message) {
  throw new Error(message);
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function read(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing file: ${relativePath}`);
  }
  return normalize(fs.readFileSync(fullPath, "utf8"));
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), normalize(content), "utf8");
}

function replaceOnce(content, oldText, newText, description) {
  const oldValue = normalize(oldText);
  const newValue = normalize(newText);
  const first = content.indexOf(oldValue);

  if (first === -1) {
    if (content.includes(newValue)) {
      return content;
    }
    fail(`Could not apply: ${description}`);
  }

  const second = content.indexOf(oldValue, first + oldValue.length);
  if (second !== -1) {
    fail(`Patch anchor was not unique: ${description}`);
  }

  return content.slice(0, first) + newValue + content.slice(first + oldValue.length);
}

function replaceRegexOnce(content, regex, replacement, description) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matches = [...content.matchAll(new RegExp(regex.source, flags))];

  if (matches.length === 0) {
    if (typeof replacement === "string" && content.includes(replacement)) {
      return content;
    }
    fail(`Could not apply: ${description}`);
  }

  if (matches.length > 1) {
    fail(`Patch regex matched more than once: ${description}`);
  }

  return content.replace(regex, replacement);
}

function cleanMojibake(content) {
  const replacements = [
    [/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d/g, "-"],
    [/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153/g, "-"],
    [/\u00e2\u20ac\u201d/g, "-"],
    [/\u00e2\u20ac\u201c/g, "-"],
    [/\u00e2\u20ac\u0153/g, '"'],
    [/\u00e2\u20ac\u009d/g, '"'],
    [/\u00e2\u20ac\u02dc/g, "'"],
    [/\u00e2\u20ac\u2122/g, "'"],
    [/\u00e2\u2020\u2019/g, "->"],
    [/\u00e2\u2020\u0090/g, "<-"],
    [/\u00c2\u00a0/g, " "],
    [/\u00c2/g, ""],
  ];

  let updated = content;
  for (const [pattern, value] of replacements) {
    updated = updated.replace(pattern, value);
  }
  return updated;
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Run this file from the kiprod-crm project folder.");
}

const targetFiles = [
  "app/manifest.ts",
  "app/components/PwaRegistration.tsx",
  "app/components/AppFrame.tsx",
  "app/components/GlobalSearch.tsx",
  "app/admin/institutions/BulkInstitutionAssignment.tsx",
  "app/admin/institutions/[id]/edit/page.tsx",
];

let stashCreated = false;
let stashName = "";
let startSha = "";

try {
  const status = run("git status --porcelain", { capture: true })
    .split(/\r?\n/)
    .filter(Boolean);

  const meaningfulDirty = status.filter((line) => {
    const file = line.slice(3).trim().replaceAll("\\", "/");
    return !(file === SCRIPT_NAME || /^kiprod_.*\.(ps1|mjs)$/i.test(file));
  });

  if (meaningfulDirty.length > 0) {
    stashName = `kiprod-before-mobile-cleanup-${Date.now()}`;
    run(`git stash push -u -m "${stashName}"`);
    stashCreated = true;
  }

  run("git checkout main");
  run("git pull --ff-only origin main");
  startSha = run("git rev-parse HEAD", { capture: true }).trim();

  const backupBranch = `backup/kiprod-mobile-cleanup-${Date.now()}`;
  run(`git branch "${backupBranch}" "${startSha}"`);

  {
    const file = "app/manifest.ts";
    let content = read(file);

    content = content.replace(
      /name:\s*"KIPROD CRM[^"]*Institutional Growth Hub",/,
      'name: "KIPROD CRM - Institutional Growth Hub",'
    );

    if (content.includes('orientation: "any",')) {
      content = content.replace(
        'orientation: "any",',
        'orientation: "portrait-primary",'
      );
    } else if (!content.includes('orientation: "portrait-primary",')) {
      fail("Could not set portrait orientation in app/manifest.ts");
    }

    write(file, cleanMojibake(content));
  }

  {
    const file = "app/components/PwaRegistration.tsx";
    let content = read(file);

    if (!content.includes("function lockInstalledAppToPortrait()")) {
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
        // Manifest portrait preference remains active.
      });
  }
}

export default function PwaRegistration() {`,
        "add installed-app portrait locking"
      );
    }

    if (!content.includes("    lockInstalledAppToPortrait();")) {
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
        "run portrait locking at startup"
      );
    }

    write(file, cleanMojibake(content));
  }

  {
    const file = "app/components/AppFrame.tsx";
    let content = read(file);

    content = replaceOnce(
      content,
      '          <div className="flex items-center gap-2 sm:gap-4">',
      '          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">',
      "allow the mobile header to wrap"
    );

    content = replaceOnce(
      content,
      '            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">',
      '            <div className="order-1 flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:shrink-0 sm:gap-3">',
      "keep the title visible on mobile"
    );

    content = replaceOnce(
      content,
      `            <div
              ref={profileMenuRef}
              className="relative shrink-0"`,
      `            <div
              ref={profileMenuRef}
              className="relative order-2 shrink-0 sm:order-3"`,
      "keep the profile button in the first mobile row"
    );

    write(file, cleanMojibake(content));
  }

  {
    const file = "app/components/GlobalSearch.tsx";
    let content = read(file);

    content = replaceOnce(
      content,
      '      className="relative ml-auto min-w-0 flex-1 md:max-w-xl"',
      '      className="relative order-3 w-full min-w-0 sm:order-2 sm:ml-auto sm:flex-1 md:max-w-xl"',
      "make search full-width on phones"
    );

    content = replaceOnce(
      content,
      '        className="flex min-w-0 items-center gap-2"',
      '        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"',
      "prevent the mobile search input from collapsing"
    );

    write(file, cleanMojibake(content));
  }

  {
    const file = "app/admin/institutions/BulkInstitutionAssignment.tsx";
    let content = read(file);

    content = content.replace(
      /function roleLabel\(role: string \| null\) \{[\s\S]*?\n\}\n\nfunction formatLabel/,
      "function formatLabel"
    );

    if (!content.includes("const assignableProfiles = useMemo(")) {
      content = replaceOnce(
        content,
        `  const [assignee, setAssignee] =
    useState("");

  const profileMap = useMemo(`,
        `  const [assignee, setAssignee] =
    useState("");

  const assignableProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.role !== "super_admin"
      ),
    [profiles]
  );

  const profileMap = useMemo(`,
        "create a non-super-admin assignment list"
      );
    }

    content = replaceRegexOnce(
      content,
      /\{profileLabel\(profile\)\}[\s\S]{0,120}\{roleLabel\(profile\.role\)\}/,
      "{profileLabel(profile)}",
      "remove role text and corrupted separator from bulk assignment"
    );

    content = content.replace(
      /\{profiles\.map\(\s*\(profile\) => \(/,
      "{assignableProfiles.map(\n                (profile) => ("
    );

    content = content.replace(
      "{profiles.length === 0 && (",
      "{assignableProfiles.length === 0 && ("
    );

    write(file, cleanMojibake(content));
  }

  {
    const file = "app/admin/institutions/[id]/edit/page.tsx";
    let content = read(file);

    content = content.replace(
      /function roleLabel\(\s*role: string \| null\s*\) \{[\s\S]*?\n\}\n\nfunction InputField/,
      "function InputField"
    );

    if (!content.includes("const assignableProfiles = profiles.filter(")) {
      content = replaceOnce(
        content,
        `  const profileMap = new Map(
    profiles.map((profile) => [`,
        `  const assignableProfiles =
    profiles.filter(
      (profile) =>
        profile.role !== "super_admin"
    );

  const profileMap = new Map(
    profiles.map((profile) => [`,
        "create a non-super-admin individual assignment list"
      );
    }

    content = content.replace(
      "...profiles.map((profile) => ({",
      "...assignableProfiles.map((profile) => ({"
    );

    content = replaceRegexOnce(
      content,
      /label:\s*`\$\{\s*profile\.full_name\s*\|\|\s*profile\.email\s*\|\|\s*"Unnamed Team Member"\s*\}\s*[\s\S]{0,80}\$\{roleLabel\(\s*profile\.role\s*\)\}`,/,
      `label:
          profile.full_name ||
          profile.email ||
          "Unnamed Team Member",`,
      "show names only in individual assignment dropdowns"
    );

    write(file, cleanMojibake(content));
  }

  const textExtensions = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md", ".html", ".webmanifest"
  ]);

  const sourceFiles = [
    ...walk(path.join(ROOT, "app")),
    ...walk(path.join(ROOT, "public")),
  ].filter((filePath) => textExtensions.has(path.extname(filePath).toLowerCase()));

  for (const filePath of sourceFiles) {
    const original = normalize(fs.readFileSync(filePath, "utf8"));
    const cleaned = cleanMojibake(original);
    if (cleaned !== original) {
      fs.writeFileSync(filePath, cleaned, "utf8");
    }
  }

  const suspicious = [];
  for (const filePath of sourceFiles) {
    const text = fs.readFileSync(filePath, "utf8");
    if (/[\u00c3\u00c2]|\u00e2\u20ac|\u00e2\u2020/.test(text)) {
      suspicious.push(relative(filePath));
    }
  }

  if (suspicious.length > 0) {
    fail(`Corrupted text still exists in: ${suspicious.join(", ")}`);
  }

  console.log("\nRunning production build...\n");
  run("npm run build");

  run(`git add -- ${targetFiles.map((file) => `"${file}"`).join(" ")}`);

  let hasChanges = false;
  try {
    run("git diff --cached --quiet", { capture: true });
  } catch {
    hasChanges = true;
  }

  if (hasChanges) {
    run('git commit -m "Fix mobile search orientation and assignment labels"');
    run("git push origin main");
  }

  if (stashCreated) {
    console.log(`\nYour earlier uncommitted work is safe in Git stash: ${stashName}`);
  }

  console.log("\nSUCCESS.");
  console.log("- Search now gets a full-width portrait row.");
  console.log("- Corrupted character sequences were removed.");
  console.log("- Super Admin is not an assignment option.");
  console.log("- Assignment dropdowns show names only.");
  console.log("- Installed app now prefers portrait orientation.");
} catch (error) {
  console.error(`\nFAILED: ${error.message}`);

  if (startSha) {
    try {
      run(`git reset --hard "${startSha}"`);
    } catch {}
  }

  if (stashCreated) {
    console.error(`Your earlier work remains safe in Git stash: ${stashName}`);
  }

  process.exit(1);
}
