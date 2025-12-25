import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StorageKeys, ToneModes } from '../constants';

export default function SettingsScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [toneMode, setToneMode] = useState('balanced');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (userStr) {
                setUser(JSON.parse(userStr));
            }
            const savedTone = await AsyncStorage.getItem(StorageKeys.TONE_MODE);
            if (savedTone) setToneMode(savedTone);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem(StorageKeys.USER);
                        await AsyncStorage.removeItem(StorageKeys.ACCESS_TOKEN);
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const handleToneChange = async (mode: string) => {
        setToneMode(mode);
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, mode);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={require('../assets/images/icon.png')}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>

            {/* Tone Preference */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Default Tone</Text>
                <Text style={styles.sectionSubtitle}>Set your preferred communication style</Text>
                <View style={styles.toneGrid}>
                    {Object.values(ToneModes).map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[
                                styles.toneOption,
                                toneMode === mode.id && styles.toneOptionActive,
                            ]}
                            onPress={() => handleToneChange(mode.id)}
                        >
                            <Text
                                style={[
                                    styles.toneLabel,
                                    toneMode === mode.id && styles.toneLabelActive,
                                ]}
                            >
                                {mode.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About AERA</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version</Text>
                    <Text style={styles.infoValue}>1.0.0</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Your companion for accountability</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="help-circle-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.menuItemText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.menuItemText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="document-text-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.menuItemText}>Terms of Service</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Made with 💛 for your growth</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 32,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 24,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 16,
    },
    toneGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    toneOption: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toneOptionActive: {
        backgroundColor: `${Colors.primary}20`,
        borderColor: Colors.primary,
    },
    toneLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    toneLabelActive: {
        color: Colors.primary,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 14,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        marginTop: 16,
        backgroundColor: `${Colors.error}15`,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${Colors.error}30`,
    },
    logoutText: {
        fontSize: 16,
        color: Colors.error,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 13,
    },
});
