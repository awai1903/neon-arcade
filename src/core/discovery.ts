import type { DiscoveredGame, GameManifest, GameModule } from '../types/game';

// 1. Build-time discovery of all game.json manifests inside /games/*/
const manifestGlob = import.meta.glob<GameManifest | { default: GameManifest }>(
  '/games/*/game.json',
  { eager: true }
);

// 2. Discover thumbnails and root icons in individual game folders
const imageGlob = import.meta.glob<string>(
  '/games/*/*.{png,jpg,jpeg,webp,svg,gif}',
  { eager: true, query: '?url', import: 'default' }
);

// 3. Discover game assets inside individual game assets/ subdirectories (nested branding, sprites, audio)
const assetGlob = import.meta.glob<string>(
  '/games/*/assets/**/*',
  { eager: true, query: '?url', import: 'default' }
);

// 4. Discover game-specific CSS styles
const cssGlob = import.meta.glob<string>(
  '/games/*/*.css',
  { eager: true, query: '?inline', import: 'default' }
);

// 5. Discover executable JavaScript/TypeScript game modules (code-split dynamic imports)
const moduleGlob = import.meta.glob<GameModule>(
  '/games/*/*.{js,ts,jsx,tsx}'
);

// 6. Discover standalone HTML game entry points
const htmlGlob = import.meta.glob<string>(
  '/games/*/*.html',
  { eager: true, query: '?url', import: 'default' }
);

/**
 * Normalizes relative path against folder
 */
function normalizeRelativePath(folder: string, relativePath: string): string {
  const cleanRel = relativePath.replace(/^\.?\//, '');
  return `/games/${folder}/${cleanRel}`;
}

/**
 * Generates an SVG data-URI fallback icon if a game lacks custom art
 */
function generateFallbackIcon(title: string, category: string): string {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0f20"/>
        <stop offset="100%" stop-color="#0e152d"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="24" fill="url(#bg)" stroke="#00d4ff" stroke-width="2" stroke-opacity="0.4"/>
    <circle cx="60" cy="52" r="28" fill="#00d4ff" fill-opacity="0.12"/>
    <text x="60" y="59" font-family="sans-serif" font-size="22" font-weight="900" fill="#00d4ff" text-anchor="middle" dominant-baseline="middle">${initials || 'AG'}</text>
    <text x="60" y="96" font-family="sans-serif" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${category.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Validates manifest metadata
 */
function validateManifest(raw: any, folder: string): GameManifest | null {
  const data = raw?.default || raw;
  if (!data || typeof data !== 'object') {
    console.warn(`[AwaisGames Discovery] Invalid or missing game.json in "games/${folder}"`);
    return null;
  }

  const id = String(data.id || folder).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const title = String(data.title || folder.replace(/[-_]/g, ' ')).trim();
  const description = String(data.description || 'Fast, instant-play browser game.').trim();
  const category = String(data.category || 'Arcade').trim();
  const thumbnail = String(data.thumbnail || data.icon || './thumbnail.webp').trim();
  const entry = String(data.entry || (data.html ? 'index.html' : 'game.js')).trim();

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
 * Parses, validates, and registers all games discovered across games/* at build-time.
 * Scalable: simply adding a folder to /games/ with game.json auto-registers the game.
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

    // Deduplicate game IDs
    let uniqueId = manifest.id;
    if (seenIds.has(uniqueId)) {
      console.warn(`[AwaisGames Discovery] Duplicate game ID detected: "${uniqueId}". Deduplicating with folder name "${folderName}".`);
      uniqueId = `${manifest.id}-${folderName}`;
    }
    seenIds.add(uniqueId);

    // Determine entry point type (.html vs .js/.ts module)
    const isHtmlEntry = manifest.entry.endsWith('.html');
    const targetEntryPath = normalizeRelativePath(folderName, manifest.entry);
    let entryType: 'html' | 'module' = isHtmlEntry ? 'html' : 'module';
    let htmlUrl: string | undefined = undefined;
    let entryLoader = moduleGlob[targetEntryPath];

    if (isHtmlEntry) {
      htmlUrl = htmlGlob[targetEntryPath] || undefined;
      if (!htmlUrl) {
        console.warn(
          `[AwaisGames Discovery] Skipping game "${manifest.title}" (games/${folderName}): HTML entry point "${manifest.entry}" not found at "${targetEntryPath}".`
        );
        continue;
      }
    } else {
      if (!entryLoader) {
        // Fallback: check if index.html exists instead
        const fallbackHtml = normalizeRelativePath(folderName, 'index.html');
        if (htmlGlob[fallbackHtml]) {
          entryType = 'html';
          htmlUrl = htmlGlob[fallbackHtml];
        } else {
          console.warn(
            `[AwaisGames Discovery] Skipping game "${manifest.title}" (games/${folderName}): Entry module "${manifest.entry}" not found at "${targetEntryPath}".`
          );
          continue;
        }
      }
    }

    // Resolve Thumbnail / Square Icon
    const targetThumbPath = normalizeRelativePath(folderName, manifest.thumbnail);
    let resolvedThumbnail = imageGlob[targetThumbPath] || '';
    let hasValidThumbnail = Boolean(resolvedThumbnail);

    // If not matched, search for any image in the game folder root
    if (!hasValidThumbnail) {
      for (const [imgPath, url] of Object.entries(imageGlob)) {
        if (imgPath.startsWith(`/games/${folderName}/`)) {
          resolvedThumbnail = url;
          hasValidThumbnail = true;
          break;
        }
      }
    }

    // Scoped Game Assets (assets/ subfolder)
    const folderAssetPrefix = `/games/${folderName}/assets/`;
    const gameAssets: Record<string, string> = {};
    let logoUrl: string | undefined = undefined;
    let iconUrl: string | undefined = undefined;

    for (const [assetPath, bundledUrl] of Object.entries(assetGlob)) {
      if (assetPath.startsWith(folderAssetPrefix)) {
        const relativeKey = assetPath.slice(`/games/${folderName}/`.length);
        gameAssets[relativeKey] = bundledUrl;

        // Auto-detect branding icons
        if (relativeKey.includes('logo.') || relativeKey.includes('logo-')) {
          logoUrl = bundledUrl;
        }
        if (relativeKey.includes('icon.') || relativeKey.includes('icon-')) {
          iconUrl = bundledUrl;
          if (!hasValidThumbnail) {
            resolvedThumbnail = bundledUrl;
            hasValidThumbnail = true;
          }
        }
      }
    }

    // If still no valid thumbnail, generate responsive branded SVG fallback
    if (!hasValidThumbnail) {
      resolvedThumbnail = generateFallbackIcon(manifest.title, manifest.category);
      hasValidThumbnail = true;
    }

    // Scoped CSS Stylesheet (optional)
    const targetCssPath = manifest.style
      ? normalizeRelativePath(folderName, manifest.style)
      : `/games/${folderName}/game.css`;
    const rawCss = cssGlob[targetCssPath] || undefined;

    // Module loader wrapper
    const loadEntryModule = async (): Promise<GameModule> => {
      if (entryType === 'html') {
        return {};
      }
      if (!entryLoader) {
        throw new Error(
          `Entry module "${manifest.entry}" not found in "games/${folderName}/".`
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
      entryType,
      htmlUrl,
      rawCss,
      assets: gameAssets,
      getAssetUrl,
      loadEntryModule,
      isFeatured: Boolean(manifest.featured),
      category: manifest.category || 'Arcade',
      logoUrl: logoUrl || iconUrl,
      iconUrl: iconUrl || resolvedThumbnail,
    });
  }

  // Sort: Featured titles first, then alphabetical by title
  return discovered.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.manifest.title.localeCompare(b.manifest.title);
  });
}

/**
 * Singleton game catalogue initialized via build-time discovery
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
