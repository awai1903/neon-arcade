import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const gamesDir = path.join(rootDir, 'games');

console.log('🎮 [AwaisGames] Validating games...');

if (!fs.existsSync(gamesDir)) {
  console.error('❌ Error: games/ directory not found.');
  process.exit(1);
}

// Normalize IDs for duplicate checking
function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'game';
}

// Recursively discover config.json and game.json files
function findManifests(directory) {
  const manifests = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;

    const folderPath = path.join(directory, entry.name);
    const configPath = path.join(folderPath, 'config.json');
    const gamePath = path.join(folderPath, 'game.json');

    // Prefer config.json over legacy game.json
    if (fs.existsSync(configPath)) {
      manifests.push({
        folderPath,
        manifestPath: configPath,
      });
    } else if (fs.existsSync(gamePath)) {
      manifests.push({
        folderPath,
        manifestPath: gamePath,
      });
    }

    // Scan nested folders, including category folders
    manifests.push(...findManifests(folderPath));
  }

  return manifests;
}

const manifestFiles = findManifests(gamesDir);

console.log(
  `🔍 Found ${manifestFiles.length} game manifest(s).`
);

const seenIds = new Map();
const validGames = [];
let hasErrors = false;

for (const { folderPath, manifestPath } of manifestFiles) {
  const folder = path
    .relative(rootDir, folderPath)
    .split(path.sep)
    .join('/');

  let manifest;

  // Read and parse JSON safely
  try {
    manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8')
    );
  } catch (error) {
    console.error(
      `❌ [Invalid JSON] ${manifestPath}: ${error.message}`
    );
    hasErrors = true;
    continue;
  }

  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest)
  ) {
    console.error(
      `❌ [Invalid Manifest] ${manifestPath}`
    );
    hasErrors = true;
    continue;
  }

  const fallbackFolderName = path.basename(folderPath);

  const gameId = slugify(
    manifest.id ||
    manifest.slug ||
    fallbackFolderName
  );

  const title = String(
    manifest.title || manifest.name || ''
  ).trim();

  // Check duplicate IDs
  if (seenIds.has(gameId)) {
    console.error(
      `❌ [Duplicate ID] "${gameId}" found in ` +
      `"${seenIds.get(gameId)}" and "${folder}".`
    );

    hasErrors = true;
  } else {
    seenIds.set(gameId, folder);
  }

  // Check required title
  if (!title) {
    console.error(
      `❌ [Missing Title] ${manifestPath} needs a title.`
    );

    hasErrors = true;
    continue;
  }

  // Determine game entry file
  const entryFile = String(
    manifest.entry ||
    manifest.html ||
    (
      fs.existsSync(
        path.join(folderPath, 'index.html')
      )
        ? 'index.html'
        : 'game.js'
    )
  ).trim();

  // Ensure entry stays inside its own game folder
  const resolvedFolder = path.resolve(folderPath);
  const resolvedEntry = path.resolve(
    folderPath,
    entryFile
  );

  const relativeEntry = path.relative(
    resolvedFolder,
    resolvedEntry
  );

  const entryIsInsideGameFolder =
    relativeEntry !== '..' &&
    !relativeEntry.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativeEntry);

  if (!entryIsInsideGameFolder) {
    console.error(
      `❌ [Unsafe Entry] ${folder}: "${entryFile}"`
    );

    hasErrors = true;
    continue;
  }

  // Check entry file exists
  if (
    !fs.existsSync(resolvedEntry) ||
    !fs.statSync(resolvedEntry).isFile()
  ) {
    console.error(
      `❌ [Missing Entry] ${folder}: ` +
      `"${entryFile}" was not found.`
    );

    hasErrors = true;
    continue;
  }

  // Check optional thumbnail
  const thumbnail = String(
    manifest.thumbnail ||
    manifest.icon ||
    'thumbnail.webp'
  ).trim();

  const resolvedThumbnail = path.resolve(
    folderPath,
    thumbnail
  );

  const thumbnailRelative = path.relative(
    resolvedFolder,
    resolvedThumbnail
  );

  const thumbnailInsideGameFolder =
    thumbnailRelative !== '..' &&
    !thumbnailRelative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(thumbnailRelative);

  const hasThumbnail =
    thumbnailInsideGameFolder &&
    fs.existsSync(resolvedThumbnail) &&
    fs.statSync(resolvedThumbnail).isFile();

  if (!hasThumbnail) {
    console.warn(
      `⚠️ [No Thumbnail] ${folder}: ` +
      `fallback artwork may be used.`
    );
  }

  validGames.push({
    id: gameId,
    title,
    category:
      manifest.category ||
      manifest.genre ||
      'Arcade',
    folder,
    manifest: path
      .relative(rootDir, manifestPath)
      .split(path.sep)
      .join('/'),
    entry: entryFile,
    type: entryFile.toLowerCase().endsWith('.html')
      ? 'Standalone HTML'
      : 'JavaScript module',
    thumbnail: hasThumbnail
      ? thumbnail
      : 'Fallback artwork',
  });
}

// Print validation results
console.log('\n📊 === Game Validation Summary ===');

console.table(validGames);

if (manifestFiles.length === 0) {
  console.error(
    '❌ No game manifests found. Add config.json or ' +
    'game.json inside a game folder.'
  );

  process.exit(1);
}

if (hasErrors) {
  console.error(
    '\n❌ Validation failed. Fix the errors above.'
  );

  process.exit(1);
}

console.log(
  `\n✅ Successfully validated ${validGames.length} game(s).\n`
);