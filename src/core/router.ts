import type { DiscoveredGame } from '../types/game';
import { getGameById } from './discovery';

export interface RouteState {
  view: 'home' | 'game' | 'not-found';
  gameId?: string;
  category?: string;
}

/**
 * Extracts game ID from current URL (path, hash, or query)
 */
export function getCurrentRoute(): RouteState {
  if (typeof window === 'undefined') return { view: 'home' };

  const pathname = window.location.pathname.replace(/\/+$/, '');
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const queryGame = searchParams.get('game');
  const queryCategory = searchParams.get('category');

  let targetId: string | null = null;

  // 1. Path-based route: /games/cyber-invaders or /game/cyber-invaders
  const pathMatch = pathname.match(/^\/(?:games|game)\/([^/]+)$/i);
  if (pathMatch) {
    targetId = pathMatch[1].trim();
  }

  // 2. Hash-based fallback: #game/cyber-invaders or #/games/cyber-invaders
  if (!targetId && hash) {
    const hashMatch = hash.match(/^(?:games|game)\/([^/]+)$/i);
    if (hashMatch) {
      targetId = hashMatch[1].trim();
    }
  }

  // 3. Query-based fallback: ?game=cyber-invaders
  if (!targetId && queryGame) {
    targetId = queryGame.trim();
  }

  if (targetId) {
    const game = getGameById(targetId);
    if (game) {
      return { view: 'game', gameId: game.id };
    }
    return { view: 'not-found', gameId: targetId };
  }

  return {
    view: 'home',
    category: queryCategory || undefined,
  };
}

/**
 * Updates browser URL and meta tags dynamically for SEO
 */
export function navigateTo(path: string, game?: DiscoveredGame) {
  if (typeof window === 'undefined') return;

  if (window.location.pathname !== path) {
    try {
      window.history.pushState(null, '', path);
    } catch {
      // Fallback if pushState fails in isolated context
      window.location.hash = path.replace(/^\//, '');
    }
  }

  // Scroll to top with instant response
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Update dynamic SEO & OpenGraph tags
  updateSEO(game);
}

/**
 * Updates document title, meta descriptions, and structured data
 */
export function updateSEO(game?: DiscoveredGame) {
  if (typeof document === 'undefined') return;

  const siteName = 'AwaisGames';
  const baseUrl = 'https://awaisgames.netlify.app';

  if (game) {
    const { manifest } = game;
    const title = `${manifest.title} — Play Free Online on ${siteName}`;
    const desc = `Play ${manifest.title} free in your browser on ${siteName}. ${manifest.description} No downloads, instant gameplay!`;
    const gameUrl = `${baseUrl}/games/${game.id}`;

    document.title = title;
    setMeta('description', desc);
    setMetaProperty('og:title', title);
    setMetaProperty('og:description', desc);
    setMetaProperty('og:url', gameUrl);
    setMetaProperty('og:type', 'game');
    setMetaProperty('twitter:title', title);
    setMetaProperty('twitter:description', desc);

    if (game.thumbnailUrl) {
      setMetaProperty('og:image', game.thumbnailUrl);
      setMetaProperty('twitter:image', game.thumbnailUrl);
    }

    setCanonical(gameUrl);
    injectGameSchema(game, gameUrl);
  } else {
    const homeTitle = `${siteName} — Free Online Browser Games`;
    const homeDesc = `Play the best free online browser games on ${siteName}. Instant play, arcade classics, shooters, and puzzles with zero downloads.`;

    document.title = homeTitle;
    setMeta('description', homeDesc);
    setMetaProperty('og:title', homeTitle);
    setMetaProperty('og:description', homeDesc);
    setMetaProperty('og:url', baseUrl);
    setMetaProperty('og:type', 'website');
    setMetaProperty('twitter:title', homeTitle);
    setMetaProperty('twitter:description', homeDesc);
    setCanonical(baseUrl);
    injectPlatformSchema(baseUrl);
  }
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function injectGameSchema(game: DiscoveredGame, url: string) {
  let script = document.getElementById('dynamic-json-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'dynamic-json-ld';
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.manifest.title,
    description: game.manifest.description,
    url: url,
    genre: game.category,
    playMode: 'SinglePlayer',
    applicationCategory: 'Game',
    operatingSystem: 'Any modern web browser',
    inLanguage: 'en',
    author: {
      '@type': 'Organization',
      name: game.manifest.author || 'AwaisGames Studios',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  script.textContent = JSON.stringify(schema);
}

function injectPlatformSchema(baseUrl: string) {
  let script = document.getElementById('dynamic-json-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'dynamic-json-ld';
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AwaisGames',
    url: baseUrl,
    applicationCategory: 'GameApplication',
    operatingSystem: 'All',
    description: 'Play high-performance browser games on AwaisGames with zero downloads or waiting.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  script.textContent = JSON.stringify(schema);
}
