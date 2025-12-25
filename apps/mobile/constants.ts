// AERA Mobile App - Shared Constants

// API Configuration - PRODUCTION
export const API_URL = 'https://aera-backend.onrender.com';

// AERA Brand Colors
export const Colors = {
    // Primary
    background: '#0a0a0b',
    surface: '#18181b',
    surfaceLight: '#27272a',

    // Accent
    primary: '#f59e0b',       // Amber/Gold
    primaryDark: '#d97706',
    secondary: '#10b981',     // Green (for energy)

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textPlaceholder: '#52525b',

    // States
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',

    // Borders
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.12)',

    // Overlay
    overlay: 'rgba(0,0,0,0.6)',
};

// Tone Modes
export const ToneModes = {
    soft: { id: 'soft', label: 'Gentle' },
    balanced: { id: 'balanced', label: 'Balanced' },
    strict_clean: { id: 'strict_clean', label: 'Direct' },
    strict_raw: { id: 'strict_raw', label: 'Raw' },
};

// AsyncStorage Keys
export const StorageKeys = {
    ACCESS_TOKEN: 'aera_access_token',
    USER: 'aera_user',
    TONE_MODE: 'aera_tone_mode',
};
