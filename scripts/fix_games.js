const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const GAMES_DIR = path.join(ROOT, "games");

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getManifestFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const results = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...getManifestFiles(fullPath));
    } else if (
      item.name === "config.json" ||
      item.name === "game.json"
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function safeEntry(folder, manifest) {
  const candidates = [
    manifest.entry,
    manifest.html,
    "index.html",
    "game.js",
    "index.js",
    "main.js",
  ].filter(Boolean);

  for (const entry of candidates) {
    if (
      path.isAbsolute(entry) ||
      entry.split(/[\\/]/).includes("..")
    ) {
      continue;
    }

    if (fs.existsSync(path.join(folder, entry))) {
      return entry.replace(/\\/g, "/");
    }
  }

  return manifest.entry || "game.js";
}

function findThumbnail(folder, current) {
  if (
    current &&
    !path.isAbsolute(current) &&
    !current.split(/[\\/]/).includes("..") &&
    fs.existsSync(path.join(folder, current))
  ) {
    return current;
  }

  for (const name of [
    "thumbnail.webp",
    "thumbnail.png",
    "thumbnail.jpg",
    "thumbnail.jpeg",
    "thumbnail.svg",
  ]) {
    if (fs.existsSync(path.join(folder, name))) {
      return `./${name}`;
    }
  }

  return current || "./thumbnail.svg";
}

if (!fs.existsSync(GAMES_DIR)) {
  console.error("❌ games/ folder nahi mila.");
  console.error("Project ke root folder se command run karo.");
  process.exit(1);
}

const files = getManifestFiles(GAMES_DIR);
const seenIds = new Map();

let changed = 0;
let errors = 0;

console.log(`🎮 Found ${files.length} game manifests.`);

for (const file of files) {
  const folder = path.dirname(file);
  const slug = path.basename(folder);
  const relativeFolder = path
    .relative(ROOT, folder)
    .split(path.sep)
    .join("/");

  let manifest;

  try {
    const original = fs.readFileSync(file, "utf8");

    if (!original.trim()) {
      throw new Error("JSON file is empty");
    }

    manifest = JSON.parse(original);

    if (
      !manifest ||
      typeof manifest !== "object" ||
      Array.isArray(manifest)
    ) {
      throw new Error("Manifest must be a JSON object");
    }
  } catch (error) {
    console.error(
      `❌ Invalid JSON: ${path.relative(ROOT, file)}`
    );
    console.error(`   ${error.message}`);
    console.error(
      "   Is file ko manually repair karo; original content preserve kiya gaya hai."
    );
    errors++;
    continue;
  }

  const originalText = fs.readFileSync(file, "utf8");

  if (
    typeof manifest.title !== "string" ||
    !manifest.title.trim()
  ) {
    manifest.title = titleFromSlug(slug);
  }

  if (
    typeof manifest.id !== "string" ||
    !manifest.id.trim()
  ) {
    manifest.id = slug;
  }

  if (
    typeof manifest.category !== "string" ||
    !manifest.category.trim()
  ) {
    const parent = path.basename(path.dirname(folder));
    manifest.category =
      parent === "games" ? "Arcade" : titleFromSlug(parent);
  }

  if (
    relativeFolder === "games/racing/endless-runner" &&
    manifest.id === "endless-runner"
  ) {
    manifest.id = "racing-endless-runner";
  }

  const previousFolder = seenIds.get(manifest.id);

  if (previousFolder) {
    console.error(
      `❌ Duplicate ID "${manifest.id}": ${previousFolder} and ${relativeFolder}`
    );
    errors++;
  } else {
    seenIds.set(manifest.id, relativeFolder);
  }

  manifest.entry = safeEntry(folder, manifest);
  manifest.thumbnail = findThumbnail(
    folder,
    manifest.thumbnail
  );

  const updatedText = JSON.stringify(manifest, null, 2) + "\n";

  if (updatedText !== originalText) {
    fs.writeFileSync(file, updatedText, "utf8");
    changed++;
  }
}

console.log("\n📊 Repair summary");
console.log(`Manifests scanned: ${files.length}`);
console.log(`Manifest files updated: ${changed}`);
console.log(`Issues still requiring attention: ${errors}`);

console.log("\nNext command:");
console.log("npm run validate");

console.log(
  "\nNote: Entry paths are checked, but game runtime compatibility is not guaranteed."
);
