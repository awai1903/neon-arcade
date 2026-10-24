import type { DiscoveredGame, GameManifest, GameModule } from '../types/game';

// 1. Build-time discovery of all game manifests inside /games/**/
// Supports both the repo's legacy `game.json` format and the current nested `config.json` layout.
const manifestGlob = import.meta.glob<GameManifest | { default: GameManifest }>(
  ['/games/**/game.json', '/games/**/config.json'],
  { eager: true }
);

// 2. Discover thumbnails and root icons in individual game folders
const imageGlob = import.meta.glob<string>(
  '/games/**/*.{png,jpg,jpeg,webp,svg,gif}',
  { eager: true, query: '?url', import: 'default' }
);

// 3. Discover game assets inside individual game assets/ subdirectories (nested branding, sprites, audio)
const assetGlob = import.meta.glob<string>(
  '/games/**/assets/**/*',
  { eager: true, query: '?url', import: 'default' }
);

// 4. Discover game-specific CSS styles
const cssGlob = import.meta.glob<string>(
  '/games/**/*.css',
  { eager: true, query: '?inline', import: 'default' }
);

// 5. Discover executable JavaScript/TypeScript game modules (code-split dynamic imports)
const moduleGlob = import.meta.glob<GameModule>(
  '/games/**/*.{js,ts,jsx,tsx}'
);

// 6. Discover standalone HTML game entry points
const htmlGlob = import.meta.glob<string>(
  '/games/**/*.html',
  { eager: true, query: '?url', import: 'default' }
);

/**
 * Normalizes relative path against folder.
 * folder may be nested like "arcade/bomb-blast".
 */
function normalizeRelativePath(folder: string, relativePath: string): string {
  const cleanRel = relativePath.replace(/^\.?\//, '');
  return `/games/${folder}/${cleanRel}`.replace(/\/+/g, '/');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'game';
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getFolderNameFromManifestPath(manifestPath: string): string {
  return manifestPath
    .replace(/^\/games\//, '')
    .replace(/\/(?:game|config)\.json$/, '')
    .trim();
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
 * Validates manifest metadata.
 * Handles both `game.json` and nested `config.json` structures.
 */
function validateManifest(raw: any, folder: string): GameManifest | null {
  const data = raw?.default || raw;
  if (!data || typeof data !== 'object') {
    console.warn(`[AwaisGames Discovery] Invalid or missing manifest in "games/${folder}"`);
    return null;
  }

  const folderParts = folder.split('/');
  const lastFolder = folderParts[folderParts.length - 1] || 'game';
  const fallbackCategory = folderParts.length > 1 ? folderParts[0] : 'Arcade';

  const id = String(data.id || data.slug || lastFolder).trim();
  const title = String(data.title || data.name || titleCase(lastFolder.replace(/[-_]/g, ' '))).trim();
  const description = String(
    data.description ||
      data.summary ||
      data.meta?.description ||
      `Instant-play browser game in ${titleCase(fallbackCategory)}.`
  ).trim();
  const category = String(
    data.category ||
      data.genre ||
      titleCase(fallbackCategory || 'Arcade')
  ).trim();
  const thumbnail = String(
    data.thumbnail ||
      data.icon ||
      data.cover ||
      data.images2?.background ||
      data.images1?.enemyA ||
      data.images1?.player ||
      './thumbnail.webp'
  ).trim();
  const entry = String(data.entry || data.html || 'index.html').trim();

  return {
    ...data,
    id: slugify(id),
    title,
    description,
    category,
    thumbnail,
    entry,
  };
}

/**
 * Parses, validates, and registers all games discovered across games/** at build-time.
 */
export function discoverGames(): DiscoveredGame[] {
  const discovered: DiscoveredGame[] = [];
  const seenIds = new Set<string>();

  for (const [manifestPath, rawContent] of Object.entries(manifestGlob)) {
    const folderName = getFolderNameFromManifestPath(manifestPath);
    if (!folderName) continue;

    const manifest = validateManifest(rawContent, folderName);
    if (!manifest) continue;

    const baseFolderName = folderName.split('/').at(-1) || folderName;
    let uniqueId = slugify(manifest.id || baseFolderName);
    if (seenIds.has(uniqueId)) {
      console.warn(`[AwaisGames Discovery] Duplicate game ID detected: "${uniqueId}". Deduplicating with folder name "${folderName}".`);
      uniqueId = `${slugify(manifest.id || baseFolderName)}-${slugify(baseFolderName)}`;
    }
    seenIds.add(uniqueId);

    const entryPathCandidates = [
      manifest.entry,
      manifest.entry.split('/').at(-1) || manifest.entry,
      'index.html',
    ]
      .filter(Boolean)
      .map((candidate) => normalizeRelativePath(folderName, candidate))
      .filter((value, index, arr) => arr.indexOf(value) === index);

    let entryType: 'html' | 'module' = manifest.entry.toLowerCase().endsWith('.html') ? 'html' : 'module';
    let htmlUrl: string | undefined = undefined;
    let entryLoader: (() => Promise<GameModule>) | undefined = undefined;
    let resolvedEntryPath = entryPathCandidates[0];

    const htmlMatch = entryPathCandidates.find((candidatePath) => Boolean(htmlGlob[candidatePath]));
    const moduleMatch = entryPathCandidates.find((candidatePath) => Boolean(moduleGlob[candidatePath]));

    if (htmlMatch) {
      entryType = 'html';
      htmlUrl = htmlGlob[htmlMatch];
      resolvedEntryPath = htmlMatch;
    } else if (moduleMatch) {
      entryType = 'module';
      entryLoader = () => moduleGlob[moduleMatch]();
      resolvedEntryPath = moduleMatch;
    } else if (entryType === 'html') {
      console.warn(
        `[AwaisGames Discovery] Skipping game "${manifest.title}" (games/${folderName}): HTML entry point "${manifest.entry}" not found.`
      );
      continue;
    } else {
      const fallbackHtml = normalizeRelativePath(folderName, 'index.html');
      if (htmlGlob[fallbackHtml]) {
        entryType = 'html';
        htmlUrl = htmlGlob[fallbackHtml];
        resolvedEntryPath = fallbackHtml;
      } else {
        console.warn(
          `[AwaisGames Discovery] Skipping game "${manifest.title}" (games/${folderName}): Entry module "${manifest.entry}" not found.`
        );
        continue;
      }
    }

    const targetThumbPath = normalizeRelativePath(folderName, manifest.thumbnail);
    let resolvedThumbnail = imageGlob[targetThumbPath] || '';
    let hasValidThumbnail = Boolean(resolvedThumbnail);

    if (!hasValidThumbnail) {
      for (const [imgPath, url] of Object.entries(imageGlob)) {
        if (imgPath.startsWith(`/games/${folderName}/`)) {
          resolvedThumbnail = url;
          hasValidThumbnail = true;
          break;
        }
      }
    }

    const folderAssetPrefix = `/games/${folderName}/assets/`;
    const gameAssets: Record<string, string> = {};
    let logoUrl: string | undefined = undefined;
    let iconUrl: string | undefined = undefined;

    for (const [assetPath, bundledUrl] of Object.entries(assetGlob)) {
      if (assetPath.startsWith(folderAssetPrefix)) {
        const relativeKey = assetPath.slice(`/games/${folderName}/`.length);
        gameAssets[relativeKey] = bundledUrl;

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

    if (!hasValidThumbnail) {
      resolvedThumbnail = generateFallbackIcon(manifest.title, manifest.category);
      hasValidThumbnail = true;
    }

    const targetCssPath = manifest.style
      ? normalizeRelativePath(folderName, manifest.style)
      : (() => {
          const directPath = normalizeRelativePath(folderName, 'game.css');
          return cssGlob[directPath] ? directPath : `/games/${folderName}/style.css`;
        })();
    const rawCss = cssGlob[targetCssPath] || undefined;

    const loadEntryModule = async (): Promise<GameModule> => {
      if (entryType === 'html') {
        return {};
      }
      if (!entryLoader) {
        throw new Error(`Entry module "${resolvedEntryPath}" not found in "games/${folderName}/".`);
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
  return gameCatalogue.find((g) => g.id === id || g.folderName === id || g.folderName.endsWith(`/${id}`));
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  categories.add('All');
  gameCatalogue.forEach((g) => {
    if (g.category) categories.add(g.category);
  });
  return Array.from(categories);
}
