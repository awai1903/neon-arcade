import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const gamesDir = path.join(rootDir, 'games');

console.log('🎮 [AwaisGames] Validating game catalogue directory: games/');

if (!fs.existsSync(gamesDir)) {
  console.error('❌ Error: games/ directory not found at', gamesDir);
  process.exit(1);
}

const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
const gameFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

console.log(`🔍 Found ${gameFolders.length} game folders to validate.`);

const seenIds = new Set();
let hasErrors = false;
const validGames = [];

for (const folder of gameFolders) {
  const folderPath = path.join(gamesDir, folder);
  const manifestPath = path.join(folderPath, 'game.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️  [Skip] "games/${folder}": Missing game.json manifest.`);
    continue;
  }

  let manifest;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ [Error] "games/${folder}/game.json" contains invalid JSON:`, err.message);
    hasErrors = true;
    continue;
  }

  // 1. Validate ID
  const gameId = manifest.id || folder;
  if (seenIds.has(gameId)) {
    console.error(`❌ [Duplicate] Game ID "${gameId}" in "games/${folder}" is already used.`);
    hasErrors = true;
    continue;
  }
  seenIds.add(gameId);

  // 2. Validate Title
  if (!manifest.title) {
    console.error(`❌ [Error] "games/${folder}": Missing required field "title" in game.json.`);
    hasErrors = true;
    continue;
  }

  // 3. Validate Entry file
  const entryFile = manifest.entry || (fs.existsSync(path.join(folderPath, 'index.html')) ? 'index.html' : 'game.js');
  const entryPath = path.join(folderPath, entryFile);
  if (!fs.existsSync(entryPath)) {
    console.error(`❌ [Missing Entry] "games/${folder}": Entry file "${entryFile}" not found.`);
    hasErrors = true;
    continue;
  }

  // 4. Validate Thumbnail / Icon
  const thumbFile = manifest.thumbnail || manifest.icon || 'thumbnail.webp';
  const thumbPath = path.join(folderPath, thumbFile);
  const hasThumbnail = fs.existsSync(thumbPath);
  if (!hasThumbnail) {
    console.warn(`⚠️  [Notice] "games/${folder}": Thumbnail file "${thumbFile}" not found; automated SVG fallback will be used.`);
  }

  validGames.push({
    folder,
    id: gameId,
    title: manifest.title,
    category: manifest.category || 'Arcade',
    entry: entryFile,
    type: entryFile.endsWith('.html') ? 'HTML (iframe)' : 'Module (Canvas/Phaser)',
    thumbnail: hasThumbnail ? thumbFile : 'SVG Fallback',
  });
}

console.log('\n📊 === Game Discovery Validation Summary ===');
console.table(validGames);

if (hasErrors) {
  console.error('\n❌ Game validation finished with errors. Please fix missing files or duplicates.');
  process.exit(1);
} else {
  console.log(`\n✅ All ${validGames.length} games verified and ready for automatic discovery!\n`);
}
