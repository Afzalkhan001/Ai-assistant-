import * as Haptics from 'expo-haptics';

/**
 * AERA Haptics System
 * Simple, reliable haptic feedback for all interactions
 */

// Core haptic patterns
export const haptics = {
    // === BASIC PATTERNS ===

    /** Selection feedback - for choices, mode changes */
    selection: () => {
        Haptics.selectionAsync();
    },

    /** Light impact - subtle UI reactions */
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /** Medium impact - confirmed actions */
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /** Success notification */
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    /** Warning notification */
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    /** Error notification */
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    // === ALIAS METHODS (for compatibility) ===

    /** Button tap - alias for light */
    buttonTap: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /** Selection changed - alias for selection */
    selectionChanged: () => {
        Haptics.selectionAsync();
    },

    /** Option selected - alias for selection */
    optionSelected: () => {
        Haptics.selectionAsync();
    },
};

export default haptics;
