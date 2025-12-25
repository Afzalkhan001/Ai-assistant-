/**
 * Production-quality haptic feedback system
 * Uses Web Vibration API with fallback patterns
 */

type HapticPattern = number | number[];

interface HapticPatterns {
    // Navigation
    tabSwitch: HapticPattern;
    pageTransition: HapticPattern;

    // Interactions
    buttonTap: HapticPattern;
    buttonHold: HapticPattern;
    toggle: HapticPattern;
    sliderTick: HapticPattern;
    sliderEnd: HapticPattern;

    // Feedback
    success: HapticPattern;
    error: HapticPattern;
    warning: HapticPattern;

    // Chat specific
    messageSent: HapticPattern;
    messageReceived: HapticPattern;
    typing: HapticPattern;

    // Selection
    selectionChanged: HapticPattern;
    optionSelected: HapticPattern;

    // Gestures
    swipe: HapticPattern;
    longPress: HapticPattern;
    doubleTap: HapticPattern;
}

const patterns: HapticPatterns = {
    // Navigation - subtle, quick
    tabSwitch: 8,
    pageTransition: [5, 30, 5],

    // Interactions - crisp feedback
    buttonTap: 10,
    buttonHold: [10, 50, 15],
    toggle: [8, 20, 12],
    sliderTick: 3,
    sliderEnd: [5, 10, 15],

    // Feedback - distinct patterns
    success: [10, 30, 10, 30, 20],
    error: [50, 30, 50],
    warning: [30, 50, 30],

    // Chat specific
    messageSent: [8, 40, 15],
    messageReceived: [5, 20, 8],
    typing: 2,

    // Selection
    selectionChanged: 6,
    optionSelected: [8, 15, 12],

    // Gestures
    swipe: [3, 10, 5],
    longPress: [10, 50, 20, 50, 30],
    doubleTap: [8, 30, 8]
};

class HapticsController {
    private isSupported: boolean;
    private isEnabled: boolean = true;

    constructor() {
        this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    }

    /**
     * Enable/disable haptics globally
     */
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    /**
     * Check if haptics are available
     */
    get available(): boolean {
        return this.isSupported && this.isEnabled;
    }

    /**
     * Core vibration method
     */
    private vibrate(pattern: HapticPattern): boolean {
        if (!this.available) return false;

        try {
            return navigator.vibrate(pattern);
        } catch {
            return false;
        }
    }

    /**
     * Stop any ongoing vibration
     */
    cancel() {
        if (this.isSupported) {
            navigator.vibrate(0);
        }
    }

    // === Navigation ===
    tabSwitch() { this.vibrate(patterns.tabSwitch); }
    pageTransition() { this.vibrate(patterns.pageTransition); }

    // === Interactions ===
    buttonTap() { this.vibrate(patterns.buttonTap); }
    buttonHold() { this.vibrate(patterns.buttonHold); }
    toggle() { this.vibrate(patterns.toggle); }
    sliderTick() { this.vibrate(patterns.sliderTick); }
    sliderEnd() { this.vibrate(patterns.sliderEnd); }

    // === Feedback ===
    success() { this.vibrate(patterns.success); }
    error() { this.vibrate(patterns.error); }
    warning() { this.vibrate(patterns.warning); }

    // === Chat ===
    messageSent() { this.vibrate(patterns.messageSent); }
    messageReceived() { this.vibrate(patterns.messageReceived); }
    typing() { this.vibrate(patterns.typing); }

    // === Selection ===
    selectionChanged() { this.vibrate(patterns.selectionChanged); }
    optionSelected() { this.vibrate(patterns.optionSelected); }

    // === Gestures ===
    swipe() { this.vibrate(patterns.swipe); }
    longPress() { this.vibrate(patterns.longPress); }
    doubleTap() { this.vibrate(patterns.doubleTap); }

    /**
     * Custom pattern for special cases
     */
    custom(pattern: HapticPattern) {
        this.vibrate(pattern);
    }

    /**
     * Intensity-based haptic (1-10 scale)
     */
    intensity(level: number) {
        const clamped = Math.max(1, Math.min(10, level));
        const duration = clamped * 5; // 5ms to 50ms
        this.vibrate(duration);
    }
}

// Singleton instance
export const haptics = new HapticsController();

// Convenience exports
export const {
    tabSwitch,
    pageTransition,
    buttonTap,
    buttonHold,
    toggle,
    sliderTick,
    sliderEnd,
    success,
    error,
    warning,
    messageSent,
    messageReceived,
    typing,
    selectionChanged,
    optionSelected,
    swipe,
    longPress,
    doubleTap
} = {
    tabSwitch: () => haptics.tabSwitch(),
    pageTransition: () => haptics.pageTransition(),
    buttonTap: () => haptics.buttonTap(),
    buttonHold: () => haptics.buttonHold(),
    toggle: () => haptics.toggle(),
    sliderTick: () => haptics.sliderTick(),
    sliderEnd: () => haptics.sliderEnd(),
    success: () => haptics.success(),
    error: () => haptics.error(),
    warning: () => haptics.warning(),
    messageSent: () => haptics.messageSent(),
    messageReceived: () => haptics.messageReceived(),
    typing: () => haptics.typing(),
    selectionChanged: () => haptics.selectionChanged(),
    optionSelected: () => haptics.optionSelected(),
    swipe: () => haptics.swipe(),
    longPress: () => haptics.longPress(),
    doubleTap: () => haptics.doubleTap()
};

export default haptics;
