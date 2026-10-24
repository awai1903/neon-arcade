/**
 * Light / dark theme helper.
 * The theme is stored in localStorage and applied as a `light` class on <html>.
 * Dark stays the default so existing visitors see no change until they toggle.
 */
export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'awaisgames_theme';

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    console.warn('Theme load error:', e);
  }
  return 'dark';
}

/** Apply a theme to the page and remember it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('light', theme === 'light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Theme save error:', e);
  }
}

/** Apply the saved theme without writing anything. Call once at startup. */
export function initTheme(): Theme {
  const theme = getStoredTheme();
  document.documentElement.classList.toggle('light', theme === 'light');
  return theme;
}
