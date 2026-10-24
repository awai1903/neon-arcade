/**
 * Haptic feedback utility for mobile touch devices.
 * Uses the standard navigator.vibrate API with fallback safety
 * and respect for user reduced motion preferences.
 */

export type HapticType = 'selection' | 'light' | 'medium' | 'heavy' | 'success';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  selection: 6, // Micro-tick for chip/filter selection
  light: 10, // Subtle tap for touchstart on cards/buttons
  medium: 18, // Affirmative pulse for launching game or main action
  heavy: 30, // Strong feedback
  success: [10, 30, 15], // Double pulse for success milestones
};

/**
 * Triggers a subtle tactile vibration on supported mobile devices.
 * Silently does nothing if unsupported, restricted, or if prefers-reduced-motion is active.
 */
export function triggerHaptic(type: HapticType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Respect user motion preferences
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
  } catch {
    // Ignore matchMedia errors
  }

  // Feature detection for navigator.vibrate
  if (typeof navigator.vibrate === 'function') {
    try {
      const pattern = HAPTIC_PATTERNS[type] ?? 10;
      return navigator.vibrate(pattern);
    } catch {
      // Handle browser permission or execution restrictions gracefully
      return false;
    }
  }

  return false;
}
