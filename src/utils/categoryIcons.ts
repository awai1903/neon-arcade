import { Gamepad2, Target, Car, Puzzle, Swords, Compass, Rocket, Zap, Brain } from 'lucide-react';

/**
 * Picks an icon for a game category. Unknown categories fall back to a gamepad,
 * so new categories added through game.json never break the UI.
 */
export function getCategoryIcon(category: string) {
  const c = category.toLowerCase();
  if (c.includes('shoot')) return Target;
  if (c.includes('rac') || c.includes('driv') || c.includes('car')) return Car;
  if (c.includes('puzz')) return Puzzle;
  if (c.includes('fight') || c.includes('action')) return Swords;
  if (c.includes('advent')) return Compass;
  if (c.includes('space')) return Rocket;
  if (c.includes('strat') || c.includes('brain')) return Brain;
  if (c.includes('arcade')) return Zap;
  return Gamepad2;
}
