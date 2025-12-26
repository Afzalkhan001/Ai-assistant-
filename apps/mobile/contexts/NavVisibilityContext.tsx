import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { haptics } from '../utils/haptics';

interface NavVisibilityContextType {
    isVisible: boolean;
    showNav: () => void;
    hideNav: () => void;
    toggleNav: () => void;
    handleScreenTap: (y: number, screenHeight: number) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType | undefined>(undefined);

const AUTO_HIDE_DELAY = 3000; // 3 seconds
const BOTTOM_ZONE_HEIGHT = 120; // Tap zone in pixels from bottom

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const startHideTimer = useCallback(() => {
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            haptics.navHide();
        }, AUTO_HIDE_DELAY);
    }, [clearHideTimer]);

    const showNav = useCallback(() => {
        if (!isVisible) {
            setIsVisible(true);
            haptics.navAppear();
        }
        startHideTimer();
    }, [isVisible, startHideTimer]);

    const hideNav = useCallback(() => {
        clearHideTimer();
        if (isVisible) {
            setIsVisible(false);
            haptics.navHide();
        }
    }, [isVisible, clearHideTimer]);

    const toggleNav = useCallback(() => {
        if (isVisible) {
            hideNav();
        } else {
            showNav();
        }
    }, [isVisible, showNav, hideNav]);

    const handleScreenTap = useCallback((y: number, screenHeight: number) => {
        const distanceFromBottom = screenHeight - y;

        if (distanceFromBottom < BOTTOM_ZONE_HEIGHT) {
            // Tapped in bottom zone - show nav
            showNav();
        } else if (isVisible) {
            // Tapped elsewhere - hide nav
            hideNav();
        }
    }, [isVisible, showNav, hideNav]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => clearHideTimer();
    }, [clearHideTimer]);

    return (
        <NavVisibilityContext.Provider value={{ isVisible, showNav, hideNav, toggleNav, handleScreenTap }}>
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
