import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StorageKeys, ToneModes } from '../constants';
import { haptics } from '../utils/haptics';

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
                        haptics.buttonTap();
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
        haptics.selectionChanged();
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, mode);
    };

    return (
        <ScrollView className="flex-1 bg-[#0a0a0b]" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* Profile Section */}
            <View className="items-center py-8 border-b border-white/5 mb-6">
                <View className="w-20 h-20 rounded-full bg-[#18181b] border-2 border-[#f59e0b] items-center justify-center mb-4">
                    <Image
                        source={require('../assets/images/icon.png')}
                        className="w-18 h-18 rounded-full"
                    />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">{user?.name || 'User'}</Text>
                <Text className="text-sm text-zinc-500">{user?.email || ''}</Text>
            </View>

            {/* Tone Preference */}
            <View className="mb-6">
                <Text className="text-base font-semibold text-white mb-1">Default Tone</Text>
                <Text className="text-[13px] text-zinc-500 mb-4">Set your preferred communication style</Text>
                <View className="flex-row flex-wrap gap-2">
                    {Object.values(ToneModes).map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            onPress={() => handleToneChange(mode.id)}
                            className={`px-5 py-3 rounded-2xl border ${toneMode === mode.id
                                    ? 'bg-[#f59e0b]/15 border-[#f59e0b]/30'
                                    : 'bg-[#18181b] border-white/10'
                                }`}
                        >
                            <Text className={`text-sm font-semibold ${toneMode === mode.id ? 'text-[#f59e0b]' : 'text-zinc-400'
                                }`}>
                                {mode.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* About Section */}
            <View className="mb-6">
                <Text className="text-base font-semibold text-white mb-4">About AERA</Text>
                <View className="bg-[#18181b] rounded-2xl border border-white/5 p-4">
                    <View className="flex-row justify-between py-3 border-b border-white/5">
                        <Text className="text-sm text-zinc-400">Version</Text>
                        <Text className="text-sm text-white font-semibold">1.0.0</Text>
                    </View>
                    <View className="pt-3">
                        <Text className="text-sm text-zinc-400">Your companion for accountability</Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View className="mb-6">
                <TouchableOpacity
                    onPress={() => haptics.buttonTap()}
                    className="flex-row items-center py-4 border-b border-white/5"
                >
                    <Text className="text-zinc-400 text-lg mr-3">ℹ️</Text>
                    <Text className="flex-1 text-white text-[15px]">Help & Support</Text>
                    <Text className="text-zinc-600">›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => haptics.buttonTap()}
                    className="flex-row items-center py-4 border-b border-white/5"
                >
                    <Text className="text-zinc-400 text-lg mr-3">🔒</Text>
                    <Text className="flex-1 text-white text-[15px]">Privacy Policy</Text>
                    <Text className="text-zinc-600">›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => haptics.buttonTap()}
                    className="flex-row items-center py-4 border-b border-white/5"
                >
                    <Text className="text-zinc-400 text-lg mr-3">📄</Text>
                    <Text className="flex-1 text-white text-[15px]">Terms of Service</Text>
                    <Text className="text-zinc-600">›</Text>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 items-center flex-row justify-center gap-2 mt-4"
            >
                <Text className="text-lg">🚪</Text>
                <Text className="text-red-500 font-semibold text-base">Sign Out</Text>
            </TouchableOpacity>

            <View className="items-center mt-10">
                <Text className="text-[13px] text-zinc-600">Made with 💛 for your growth</Text>
            </View>
        </ScrollView>
    );
}
