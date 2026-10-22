import type { DiscoveredGame, GameManifest, GameModule } from '../types/game';

// 1. Build-time discovery of all game.json manifests inside /games/*/
const manifestGlob = import.meta.glob<GameManifest | { default: GameManifest }>(
  '/games/*/game.json',
  { eager: true }
);

// 2. Discover thumbnails in individual game folders
const thumbnailGlob = import.meta.glob<string>(
  '/games/*/*.{png,jpg,jpeg,webp,svg,gif}',
  { eager: true, query: '?url', import: 'default' }
);

// 3. Discover game assets inside individual game assets/ subdirectories
const assetGlob = import.meta.glob<string>(
  '/games/*/assets/**/*',
  { eager: true, query: '?url', import: 'default' }
);

// 4. Discover game-specific CSS styles
const cssGlob = import.meta.glob<string>(
  '/games/*/*.css',
  { eager: true, query: '?inline', import: 'default' }
);

// 5. Discover executable game entry files (code-split dynamic modules)
const moduleGlob = import.meta.glob<GameModule>(
  '/games/*/*.{js,ts,jsx,tsx}'
);

/**
 * Normalizes relative path against folder
 */
function normalizeRelativePath(folder: string, relativePath: string): string {
  const cleanRel = relativePath.replace(/^\.?\//, '');
  return `/games/${folder}/${cleanRel}`;
}

/**
 * Validates manifest metadata
 */
function validateManifest(raw: any, folder: string): GameManifest | null {
  const data = raw?.default || raw;
  if (!data || typeof data !== 'object') {
    console.warn(`[Neon Arcade] Invalid game.json in folder "games/${folder}"`);
    return null;
  }

  const id = String(data.id || folder).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const title = String(data.title || folder).trim();
  const description = String(data.description || 'An interactive browser game').trim();
  const category = String(data.category || 'Arcade').trim();
  const thumbnail = String(data.thumbnail || './thumbnail.webp').trim();
  const entry = String(data.entry || 'game.js').trim();

  return {
    ...data,
    id,
    title,
    description,
    category,
    thumbnail,
    entry,
  };
}

/**
 * Parses all games discovered at build time
 */
export function discoverGames(): DiscoveredGame[] {
  const discovered: DiscoveredGame[] = [];
  const seenIds = new Set<string>();

  for (const [manifestPath, rawContent] of Object.entries(manifestGlob)) {
    // Extract folder name: e.g. /games/endless-runner/game.json -> endless-runner
    const match = manifestPath.match(/\/games\/([^/]+)\/game\.json$/);
    if (!match) continue;

    const folderName = match[1];
    const manifest = validateManifest(rawContent, folderName);
    if (!manifest) continue;

    // Prevent duplicate IDs
    let uniqueId = manifest.id;
    if (seenIds.has(uniqueId)) {
      console.warn(`[Neon Arcade] Duplicate game ID detected: "${uniqueId}". Appending folder suffix.`);
      uniqueId = `${manifest.id}-${folderName}`;
    }
    seenIds.add(uniqueId);

    // Resolve Thumbnail
    const targetThumbPath = normalizeRelativePath(folderName, manifest.thumbnail);
    let resolvedThumbnail = thumbnailGlob[targetThumbPath] || '';
    let hasValidThumbnail = Boolean(resolvedThumbnail);

    // If exact thumbnail not matched, search any image in game folder
    if (!hasValidThumbnail) {
      for (const [thumbPath, url] of Object.entries(thumbnailGlob)) {
        if (thumbPath.startsWith(`/games/${folderName}/`) && !thumbPath.includes('/assets/')) {
          resolvedThumbnail = url;
          hasValidThumbnail = true;
          break;
        }
      }
    }

    // Isolate Game Assets (Only files belonging to this specific folder)
    const folderAssetPrefix = `/games/${folderName}/assets/`;
    const gameAssets: Record<string, string> = {};

    for (const [assetPath, bundledUrl] of Object.entries(assetGlob)) {
      if (assetPath.startsWith(folderAssetPrefix)) {
        // Create relative key, e.g. 'assets/player.png'
        const relativeKey = assetPath.slice(`/games/${folderName}/`.length);
        gameAssets[relativeKey] = bundledUrl;
      }
    }

    // Scoped CSS
    const targetCssPath = manifest.style
      ? normalizeRelativePath(folderName, manifest.style)
      : `/games/${folderName}/game.css`;
    const rawCss = cssGlob[targetCssPath] || undefined;

    // Entry Loader
    const targetEntryPath = normalizeRelativePath(folderName, manifest.entry);
    const entryLoader = moduleGlob[targetEntryPath];

    const loadEntryModule = async (): Promise<GameModule> => {
      if (!entryLoader) {
        throw new Error(
          `Entry module "${manifest.entry}" not found in "games/${folderName}/". Expected "${targetEntryPath}".`
        );
      }
      return await entryLoader();
    };

    const getAssetUrl = (relativePath: string): string => {
      const clean = relativePath.replace(/^\.?\//, '');
      return gameAssets[clean] || gameAssets[`assets/${clean}`] || relativePath;
    };

    discovered.push({
      id: uniqueId,
      folderName,
      manifest: {
        ...manifest,
        id: uniqueId,
      },
      thumbnailUrl: resolvedThumbnail,
      hasValidThumbnail,
      rawCss,
      assets: gameAssets,
      getAssetUrl,
      loadEntryModule,
      isFeatured: Boolean(manifest.featured),
      category: manifest.category || 'Arcade',
    });
  }

  // Sort: Featured first, then alphabetical by title
  return discovered.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.manifest.title.localeCompare(b.manifest.title);
  });
}

/**
 * Singleton catalogue instance
 */
export const gameCatalogue: DiscoveredGame[] = discoverGames();

export function getGameById(id: string): DiscoveredGame | undefined {
  return gameCatalogue.find((g) => g.id === id || g.folderName === id);
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  categories.add('All');
  gameCatalogue.forEach((g) => {
    if (g.category) categories.add(g.category);
  });
  return Array.from(categories);
}
