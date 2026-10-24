/**
 * Game Manifest Interface & Discovery Types
 */

export interface GameManifest {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  entry: string;
  icon?: string;
  style?: string;
  engine?: 'phaser' | 'canvas' | 'threejs' | 'html' | 'custom' | string;
  version?: string;
  featured?: boolean;
  author?: string;
  releaseDate?: string;
  tags?: string[];
  controls?: {
    desktop?: string;
    mobile?: string;
  };
  orientation?: 'landscape' | 'portrait' | 'auto';
}

export interface DiscoveredGame {
  id: string;
  folderName: string;
  manifest: GameManifest;
  thumbnailUrl: string;
  hasValidThumbnail: boolean;
  entryType: 'module' | 'html';
  htmlUrl?: string;
  rawCss?: string;
  assets: Record<string, string>; // Maps relative path (e.g., 'assets/player.png') to bundled URL
  getAssetUrl: (relativePath: string) => string;
  loadEntryModule: () => Promise<GameModule>;
  isFeatured: boolean;
  category: string;
  logoUrl?: string;
  iconUrl?: string;
}

export interface GameModule {
  createGame?: (container: HTMLElement, options: GameOptions) => GameObject | Promise<GameObject>;
  default?: ((container: HTMLElement, options: GameOptions) => GameObject | Promise<GameObject>) | any;
}

export interface GameObject {
  gameInstance?: any;
  destroy?: (removeCanvas?: boolean, noReturn?: boolean) => void;
  pause?: () => void;
  resume?: () => void;
  restart?: () => void;
  setMuted?: (muted: boolean) => void;
}

export interface GameOptions {
  container: HTMLElement;
  manifest: GameManifest;
  assets: Record<string, string>;
  getAssetUrl: (relPath: string) => string;
  isMuted?: boolean;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onStateChange?: (state: string) => void;
}
