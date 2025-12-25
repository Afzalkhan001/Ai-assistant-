import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

export default function CheckinScreen() {
    const router = useRouter();
    const [mood, setMood] = useState(5);
    const [energy, setEnergy] = useState(5);
    const [reflection, setReflection] = useState('');
    const [accountability, setAccountability] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasExistingCheckin, setHasExistingCheckin] = useState(false);
    const [userName, setUserName] = useState('there');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadUserAndCheckin();
    }, []);

    const loadUserAndCheckin = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
                setUserName(userData.name || 'there');
                await loadTodayCheckin(userData.id);
            }
        } catch (error) {
            console.error('Error loading checkin:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTodayCheckin = async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/checkins/${userId}/today`);
            if (response.ok) {
                const data = await response.json();
                if (data.checkin) {
                    setMood(data.checkin.mood || 5);
                    setEnergy(data.checkin.energy || 5);
                    setReflection(data.checkin.reflection || '');
                    setAccountability(data.checkin.accountability);
                    setHasExistingCheckin(true);
                }
            }
        } catch (error) {
            console.error('Error loading today checkin:', error);
        }
    };

    const handleSubmit = async () => {
        if (!user?.id) return;

        haptics.success();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/checkins?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mood,
                    energy,
                    reflection: reflection.trim() || null,
                    accountability,
                }),
            });

            if (response.ok) {
                router.back();
            }
        } catch (error) {
            console.error('Error submitting checkin:', error);
            haptics.error();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMoodLabel = (v: number) => {
        if (v <= 2) return 'Struggling';
        if (v <= 4) return 'Low';
        if (v <= 6) return 'Neutral';
        if (v <= 8) return 'Good';
        return 'Thriving';
    };

    const getEnergyLabel = (v: number) => {
        if (v <= 2) return 'Exhausted';
        if (v <= 4) return 'Tired';
        if (v <= 6) return 'Okay';
        if (v <= 8) return 'Energized';
        return 'Peak';
    };

    const getTimeOfDay = () => {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#0a0a0b] items-center justify-center">
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#0a0a0b]" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {/* Header */}
            <View className="mb-8">
                <Text className="text-3xl font-bold text-white mb-2">Good {getTimeOfDay()}, {userName}</Text>
                <Text className="text-[15px] text-zinc-400">Take a moment to pause and reflect.</Text>
            </View>

            {/* Mood Slider */}
            <View className="bg-[#18181b] rounded-3xl p-6 mb-4 border border-white/5">
                <Text className="text-base font-semibold text-white mb-1">How are you feeling? (1-10)</Text>
                <Text className="text-[13px] text-zinc-500 mb-6">Your emotional state right now</Text>

                <View className="flex-row items-center mb-4">
                    <Text className="text-[10px] text-zinc-500 uppercase tracking-wider mr-2">Low</Text>
                    <Slider
                        style={{ flex: 1, height: 40 }}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={mood}
                        onValueChange={(v) => {
                            setMood(v);
                            haptics.selectionChanged();
                        }}
                        minimumTrackTintColor="#f59e0b"
                        maximumTrackTintColor="#27272a"
                        thumbTintColor="#f59e0b"
                    />
                    <Text className="text-[10px] text-zinc-500 uppercase tracking-wider ml-2">High</Text>
                </View>
                <View className="items-center">
                    <Text className="text-4xl font-bold text-[#f59e0b] mb-1">{mood}</Text>
                    <Text className="text-sm text-[#f59e0b] uppercase tracking-widest">{getMoodLabel(mood)}</Text>
                </View>
            </View>

            {/* Energy Slider */}
            <View className="bg-[#18181b] rounded-3xl p-6 mb-4 border border-white/5">
                <Text className="text-base font-semibold text-white mb-1">Energy level? (1-10)</Text>
                <Text className="text-[13px] text-zinc-500 mb-6">Physical and mental energy</Text>

                <View className="flex-row items-center mb-4">
                    <Text className="text-[10px] text-zinc-500 uppercase tracking-wider mr-2">Drained</Text>
                    <Slider
                        style={{ flex: 1, height: 40 }}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={energy}
                        onValueChange={(v) => {
                            setEnergy(v);
                            haptics.selectionChanged();
                        }}
                        minimumTrackTintColor="#10b981"
                        maximumTrackTintColor="#27272a"
                        thumbTintColor="#10b981"
                    />
                    <Text className="text-[10px] text-zinc-500 uppercase tracking-wider ml-2">Full</Text>
                </View>
                <View className="items-center">
                    <Text className="text-4xl font-bold text-[#10b981] mb-1">{energy}</Text>
                    <Text className="text-sm text-[#10b981] uppercase tracking-widest">{getEnergyLabel(energy)}</Text>
                </View>
            </View>

            {/* Reflection */}
            <View className="bg-[#18181b] rounded-3xl p-6 mb-4 border border-white/5">
                <Text className="text-base font-semibold text-white mb-1">Reflection</Text>
                <Text className="text-[13px] text-zinc-500 mb-4">What was the most significant part of your day?</Text>
                <TextInput
                    value={reflection}
                    onChangeText={setReflection}
                    placeholder="I felt proud when..."
                    placeholderTextColor="#52525b"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-[#0a0a0b] border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] min-h-[100px]"
                />
            </View>

            {/* Accountability */}
            <View className="bg-[#18181b] rounded-3xl p-6 mb-6 border border-white/5">
                <Text className="text-base font-semibold text-white mb-1">Accountability</Text>
                <Text className="text-[13px] text-zinc-500 mb-4">Did you stick to your core habit today?</Text>
                <View className="flex-row gap-3">
                    {[
                        { value: 'yes', label: 'Yes', icon: '✓' },
                        { value: 'partial', label: 'Partial', icon: '~' },
                        { value: 'no', label: 'No', icon: '✕' },
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                                setAccountability(option.value as any);
                                haptics.selectionChanged();
                            }}
                            className={`flex-1 bg-[#0a0a0b] border rounded-2xl p-4 items-center ${accountability === option.value ? 'border-[#f59e0b] bg-[#f59e0b]/10' : 'border-white/10'
                                }`}
                        >
                            <Text className="text-xl mb-2">{option.icon}</Text>
                            <Text className={`text-[13px] font-semibold ${accountability === option.value ? 'text-[#f59e0b]' : 'text-zinc-400'
                                }`}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`bg-[#f59e0b] rounded-2xl py-5 items-center mb-6 ${isSubmitting ? 'opacity-60' : ''}`}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text className="text-black font-bold text-base uppercase tracking-widest">
                        {hasExistingCheckin ? 'Update Check-in' : 'Complete Check-in'}
                    </Text>
                )}
            </TouchableOpacity>

            <View className="items-center">
                <Text className="text-xs text-zinc-600">🔒 Your reflections are private and encrypted</Text>
            </View>
        </ScrollView>
    );
}
