import * as Haptics from 'expo-haptics';

/**
 * AERA Modern Haptics System (2025)
 * 
 * Design Principles:
 * - Purposeful: Confirm actions, not distract
 * - Synchronized: Aligned with animations
 * - Subtle: Light patterns preferred
 * - Contextual: Different patterns for different contexts
 */

export const haptics = {
    // === BASIC PATTERNS ===

    /** Ultra-light feedback for selections */
    selection: () => {
        Haptics.selectionAsync();
    },

    /** Light tap for subtle UI interactions */
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /** Medium impact for confirmations */
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /** Soft thud for background events */
    soft: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    },

    /** Sharp snap for threshold events */
    rigid: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    },

    /** Heavy impact - use sparingly! */
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    // === NOTIFICATION PATTERNS ===

    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    // === CONTEXTUAL PATTERNS ===

    /** Button tap - light and quick */
    buttonTap: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /** Tab or option selection changed */
    selectionChanged: () => {
        Haptics.selectionAsync();
    },

    /** Message sent by user */
    messageSent: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    /** Message received from AI */
    messageReceived: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    },

    // === NAVIGATION PATTERNS ===

    /** Nav bar appears */
    navAppear: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    },

    /** Nav bar hides */
    navHide: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    // === AI INTERACTION PATTERNS ===

    /** AI starts typing/thinking */
    aiTypingStart: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    /** First word of AI response appears */
    aiFirstWord: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    },

    /** AI response complete */
    aiResponseComplete: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    // === GESTURE PATTERNS ===

    /** Pull-to-refresh threshold reached */
    pullThreshold: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    },

    /** Long press activated */
    longPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    /** Swipe gesture detected */
    swipe: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
};

export default haptics;
