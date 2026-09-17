/**
 * Haptic Feedback Utilities using the Navigator Vibration API
 * Provides tactile physical confirmation on mobile devices for key actions
 * like 'Add to Cart' and 'Emergency SOS'.
 */

export const triggerHaptic = (pattern: number | number[] = 50): boolean => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch (err) {
      // In case vibration is restricted by browser security/iframe sandbox
      console.debug('Haptic feedback unavailable or blocked:', err);
      return false;
    }
  }
  return false;
};

/**
 * Haptic feedback pattern for 'Add to Cart' / Reserve:
 * Crisp, satisfying physical tap confirmation (e.g. 40ms pulse, 30ms rest, 60ms pulse)
 */
export const triggerAddToCartHaptic = (): boolean => {
  return triggerHaptic([40, 30, 60]);
};

/**
 * Haptic feedback pattern for 'Emergency SOS':
 * Urgent, high-intensity tactile sequence (e.g. triple alert pulse: 100ms, 50ms pause, 100ms, 50ms pause, 180ms)
 */
export const triggerSOSHaptic = (): boolean => {
  return triggerHaptic([100, 50, 100, 50, 180]);
};
