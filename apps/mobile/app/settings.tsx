import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StorageKeys, ToneModes } from '../constants';
import { haptics } from '../utils/haptics';

export default function SettingsScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [toneMode, setToneMode] = useState('balanced');

    useEffect(() => { loadUserData(); }, []);

    const loadUserData = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (userStr) setUser(JSON.parse(userStr));
            const savedTone = await AsyncStorage.getItem(StorageKeys.TONE_MODE);
            if (savedTone) setToneMode(savedTone);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive', onPress: async () => {
                    haptics.buttonTap();
                    await AsyncStorage.removeItem(StorageKeys.USER);
                    await AsyncStorage.removeItem(StorageKeys.ACCESS_TOKEN);
                    router.replace('/login');
                }
            },
        ]);
    };

    const handleToneChange = async (mode: string) => {
        setToneMode(mode);
        haptics.selectionChanged();
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, mode);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Animated.View entering={FadeIn}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
                    </View>
                    <Text style={styles.name}>{user?.name || 'User'}</Text>
                    <Text style={styles.email}>{user?.email || ''}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Default Tone</Text>
                    <Text style={styles.sectionSubtext}>Set your preferred communication style</Text>
                    <View style={styles.toneGrid}>
                        {Object.values(ToneModes).map((mode) => (
                            <TouchableOpacity key={mode.id} onPress={() => handleToneChange(mode.id)} style={[styles.toneBtn, toneMode === mode.id && styles.toneBtnActive]}>
                                <Text style={[styles.toneLabel, toneMode === mode.id && styles.toneLabelActive]}>{mode.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About AERA</Text>
                    <View style={styles.aboutCard}>
                        <View style={styles.aboutRow}>
                            <Text style={styles.aboutLabel}>Version</Text>
                            <Text style={styles.aboutValue}>1.0.0</Text>
                        </View>
                        <View style={styles.aboutRowLast}>
                            <Text style={styles.aboutLabel}>Your companion for accountability</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity onPress={() => haptics.buttonTap()} style={styles.menuItem}>
                        <Text style={styles.menuIcon}>ℹ️</Text>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => haptics.buttonTap()} style={styles.menuItem}>
                        <Text style={styles.menuIcon}>🔒</Text>
                        <Text style={styles.menuText}>Privacy Policy</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => haptics.buttonTap()} style={styles.menuItem}>
                        <Text style={styles.menuIcon}>📄</Text>
                        <Text style={styles.menuText}>Terms of Service</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.footer}><Text style={styles.footerText}>Made with 💛 for your growth</Text></View>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    content: { padding: 24, paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
    avatar: { width: 76, height: 76, borderRadius: 38 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    email: { fontSize: 14, color: '#71717a' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
    sectionSubtext: { fontSize: 13, color: '#71717a', marginBottom: 16 },
    toneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    toneBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    toneBtnActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    toneLabel: { fontSize: 14, fontWeight: '600', color: '#a1a1aa' },
    toneLabelActive: { color: '#f59e0b' },
    aboutCard: { backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16 },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    aboutRowLast: { paddingTop: 12 },
    aboutLabel: { fontSize: 14, color: '#a1a1aa' },
    aboutValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    menuIcon: { fontSize: 18, color: '#a1a1aa', marginRight: 12 },
    menuText: { flex: 1, fontSize: 15, color: '#fff' },
    menuArrow: { fontSize: 18, color: '#52525b' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 16, paddingVertical: 16, marginTop: 16 },
    logoutIcon: { fontSize: 18 },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
    footer: { alignItems: 'center', marginTop: 40 },
    footerText: { fontSize: 13, color: '#52525b' },
});
