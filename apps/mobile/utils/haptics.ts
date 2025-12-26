import * as Haptics from 'expo-haptics';

/**
 * AERA Premium Haptics System
 * 
 * Philosophy: Haptics are body language, not decoration.
 * Every haptic must answer: "Why did this happen?"
 * 
 * Rules:
 * - Never vibrate for every button
 * - Never vibrate repetitively  
 * - Never vibrate during typing
 * - Fewer haptics = higher perceived quality
 */

type ToneMode = 'soft' | 'balanced' | 'strict_clean' | 'strict_raw';

// Current tone mode - should be synced with app state
let currentToneMode: ToneMode = 'balanced';

/**
 * Set the current tone mode for haptic filtering
 */
export function setHapticToneMode(mode: ToneMode) {
    currentToneMode = mode;
}

/**
 * Check if a haptic intensity is allowed for current tone
 */
function isAllowed(intensity: 'light' | 'medium' | 'heavy' | 'notification'): boolean {
    switch (currentToneMode) {
        case 'soft':
            // Gentle: Only Selection or Light Impact
            return intensity === 'light';
        case 'balanced':
            // Balanced: Selection + Light + Medium allowed
            return intensity !== 'heavy';
        case 'strict_clean':
        case 'strict_raw':
            // Direct/Raw: All allowed
            return true;
        default:
            return true;
    }
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC HAPTIC PATTERNS
// ═══════════════════════════════════════════════════════════════

/**
 * Selection Feedback
 * Meaning: "A choice changed"
 * Use for: Sliders, pickers, tone mode change, tab selection
 */
export function selection() {
    Haptics.selectionAsync();
}

/**
 * Light Impact
 * Meaning: "UI reacted softly"
 * Use for: Navigation, screen focus, gentle acknowledgment
 */
export function lightImpact() {
    if (isAllowed('light')) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
}

/**
 * Medium Impact
 * Meaning: "Intent confirmed"
 * Use for: Mode changes, commitments, confirmations
 */
export function mediumImpact() {
    if (isAllowed('medium')) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
}

/**
 * Heavy Impact
 * Meaning: "This matters"
 * Use for: Accountability, serious actions (use sparingly)
 */
export function heavyImpact() {
    if (isAllowed('heavy')) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
}

/**
 * Success Notification
 * Meaning: "Completed / closed / resolved"
 * Use for: Message sent, task complete, check-in submitted
 */
export function success() {
    if (isAllowed('notification')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
}

/**
 * Warning Notification  
 * Meaning: "Attention needed"
 * Use for: Skipped actions, connection issues
 */
export function warning() {
    if (isAllowed('notification')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
}

/**
 * Error Notification
 * Meaning: "Something failed"
 * Use for: Real failures only
 */
export function error() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

// ═══════════════════════════════════════════════════════════════
// COMPOUND PATTERNS (Max 2 steps, 100ms delay)
// ═══════════════════════════════════════════════════════════════

/**
 * Soft Confirmation: Selection → Light
 * Use for: Gentle acknowledgment with choice
 */
export async function softConfirmation() {
    selection();
    await delay(100);
    lightImpact();
}

/**
 * Grounded Arrival: Medium → Selection
 * Use for: Entering important screens
 */
export async function groundedArrival() {
    if (isAllowed('medium')) {
        mediumImpact();
        await delay(100);
        selection();
    } else {
        lightImpact();
    }
}

/**
 * Serious Attention: Heavy → Medium
 * Use for: Accountability moments (Raw mode only)
 */
export async function seriousAttention() {
    if (currentToneMode === 'strict_raw' && isAllowed('heavy')) {
        heavyImpact();
        await delay(100);
        mediumImpact();
    } else if (isAllowed('medium')) {
        mediumImpact();
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTUAL HAPTIC TRIGGERS
// ═══════════════════════════════════════════════════════════════

export const haptics = {
    // Tone mode
    setToneMode: setHapticToneMode,

    // Basic patterns
    selection,
    lightImpact,
    mediumImpact,
    heavyImpact,
    success,
    warning,
    error,

    // Compound patterns
    softConfirmation,
    groundedArrival,
    seriousAttention,

    // === Contextual triggers ===

    /** Tab navigation changed */
    tabChanged: () => selection(),

    /** Tone mode selector changed */
    toneChanged: () => selection(),

    /** Message sent successfully */
    messageSent: () => success(),

    /** AI response received */
    messageReceived: () => lightImpact(),

    /** Screen focused/entered */
    screenEntered: () => lightImpact(),

    /** Nav bar appeared */
    navAppeared: () => lightImpact(),

    /** Attachment selected */
    attachmentSelected: () => selection(),

    /** Task completed */
    taskCompleted: () => mediumImpact(),

    /** Check-in submitted */
    checkinSubmitted: () => success(),

    /** Connection error */
    connectionError: () => warning(),

    /** Operation failed */
    operationFailed: () => error(),
};

// Utility
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default haptics;
