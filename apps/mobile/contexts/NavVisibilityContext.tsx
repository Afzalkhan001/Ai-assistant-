import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Dimensions, Keyboard } from 'react-native';
import { haptics } from '../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 30; // Minimum swipe distance to trigger
const BOTTOM_ZONE = 80; // Bottom zone for tap detection
const AUTO_HIDE_DELAY = 4000; // 4 seconds

interface NavVisibilityContextType {
    isVisible: boolean;
    showNav: () => void;
    hideNav: () => void;
    onGestureStart: (y: number) => void;
    onGestureMove: (y: number) => void;
    onGestureEnd: () => void;
    onTap: (y: number) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType | undefined>(undefined);

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const gestureStartY = useRef<number | null>(null);
    const isKeyboardVisible = useRef(false);

    // Track keyboard state
    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => {
            isKeyboardVisible.current = true;
            showNav(); // Always show when keyboard is up
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            isKeyboardVisible.current = false;
            startHideTimer();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const startHideTimer = useCallback(() => {
        if (isKeyboardVisible.current) return; // Don't hide if keyboard visible

        clearHideTimer();
        hideTimerRef.current = setTimeout(() => {
            if (!isKeyboardVisible.current) {
                setIsVisible(false);
            }
        }, AUTO_HIDE_DELAY);
    }, [clearHideTimer]);

    const showNav = useCallback(() => {
        if (!isVisible) {
            setIsVisible(true);
            haptics.lightImpact(); // Subtle haptic on appear
        }
        clearHideTimer();
        startHideTimer();
    }, [isVisible, clearHideTimer, startHideTimer]);

    const hideNav = useCallback(() => {
        if (isKeyboardVisible.current) return;
        clearHideTimer();
        if (isVisible) {
            setIsVisible(false);
        }
    }, [isVisible, clearHideTimer]);

    // Gesture handling for swipe up
    const onGestureStart = useCallback((y: number) => {
        // Only track if starting from bottom of screen
        if (y > SCREEN_HEIGHT - BOTTOM_ZONE) {
            gestureStartY.current = y;
        }
    }, []);

    const onGestureMove = useCallback((y: number) => {
        if (gestureStartY.current === null) return;

        const delta = gestureStartY.current - y;

        // Swipe up detected
        if (delta > SWIPE_THRESHOLD && !isVisible) {
            showNav();
            gestureStartY.current = null;
        }
    }, [isVisible, showNav]);

    const onGestureEnd = useCallback(() => {
        gestureStartY.current = null;
    }, []);

    // Tap handling
    const onTap = useCallback((y: number) => {
        const distanceFromBottom = SCREEN_HEIGHT - y;

        if (distanceFromBottom < BOTTOM_ZONE + 100) {
            // Tap near bottom - show nav
            showNav();
        } else if (isVisible && distanceFromBottom > BOTTOM_ZONE + 150) {
            // Tap in content area - start hide timer
            startHideTimer();
        }
    }, [isVisible, showNav, startHideTimer]);

    // Cleanup
    useEffect(() => {
        startHideTimer(); // Start initial timer
        return () => clearHideTimer();
    }, []);

    return (
        <NavVisibilityContext.Provider value={{
            isVisible,
            showNav,
            hideNav,
            onGestureStart,
            onGestureMove,
            onGestureEnd,
            onTap,
        }}>
            {children}
        </NavVisibilityContext.Provider>
    );
}

export function useNavVisibility() {
    const context = useContext(NavVisibilityContext);
    if (!context) {
        throw new Error('useNavVisibility must be used within NavVisibilityProvider');
    }
    return context;
}

export default NavVisibilityContext;
