import * as Haptics from 'expo-haptics';

/**
 * Simple, reliable haptics
 * Only the essential patterns that work
 */
export const haptics = {
    // Selection - for choices
    selection: () => {
        Haptics.selectionAsync();
    },

    // Light tap
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    // Medium tap
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    // Success
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    // Warning
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    // Error
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
};

export default haptics;
