/**
 * Haptic feedback utilities for mobile devices
 */

export type HapticIntensity = "light" | "medium" | "heavy";

/**
 * Trigger haptic feedback if available on the device
 */
export function triggerHaptic(intensity: HapticIntensity = "medium"): void {
  // Check if the Vibration API is available
  if (!("vibrate" in navigator)) return;

  const patterns: Record<HapticIntensity, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: [50, 30, 50],
  };

  try {
    navigator.vibrate(patterns[intensity]);
  } catch {
    // Silently fail if vibration not supported
  }
}

/**
 * Haptic feedback for swipe completion
 */
export function swipeHaptic(direction: "left" | "right" | "up"): void {
  switch (direction) {
    case "left":
      triggerHaptic("light"); // Skip - light feedback
      break;
    case "right":
      triggerHaptic("heavy"); // Contact - strong feedback
      break;
    case "up":
      triggerHaptic("medium"); // Save - medium feedback
      break;
  }
}

/**
 * Haptic feedback for undo action
 */
export function undoHaptic(): void {
  triggerHaptic("medium");
}
