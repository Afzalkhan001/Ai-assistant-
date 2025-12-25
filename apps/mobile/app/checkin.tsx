import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import Animated, { FadeIn } from 'react-native-reanimated';
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

    useEffect(() => { loadUserAndCheckin(); }, []);

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
                body: JSON.stringify({ mood, energy, reflection: reflection.trim() || null, accountability }),
            });
            if (response.ok) router.back();
        } catch (error) {
            console.error('Error submitting checkin:', error);
            haptics.error();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMoodLabel = (v: number) => v <= 2 ? 'Struggling' : v <= 4 ? 'Low' : v <= 6 ? 'Neutral' : v <= 8 ? 'Good' : 'Thriving';
    const getEnergyLabel = (v: number) => v <= 2 ? 'Exhausted' : v <= 4 ? 'Tired' : v <= 6 ? 'Okay' : v <= 8 ? 'Energized' : 'Peak';
    const getTimeOfDay = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };

    if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#f59e0b" /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Animated.View entering={FadeIn}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Good {getTimeOfDay()}, {userName}</Text>
                    <Text style={styles.subtext}>Take a moment to pause and reflect.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>How are you feeling? (1-10)</Text>
                    <Text style={styles.cardSubtext}>Your emotional state right now</Text>
                    <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Low</Text>
                        <Slider style={styles.slider} minimumValue={1} maximumValue={10} step={1} value={mood} onValueChange={(v) => { setMood(v); haptics.selectionChanged(); }} minimumTrackTintColor="#f59e0b" maximumTrackTintColor="#27272a" thumbTintColor="#f59e0b" />
                        <Text style={styles.sliderLabel}>High</Text>
                    </View>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.valueNumber, { color: '#f59e0b' }]}>{mood}</Text>
                        <Text style={[styles.valueLabel, { color: '#f59e0b' }]}>{getMoodLabel(mood)}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Energy level? (1-10)</Text>
                    <Text style={styles.cardSubtext}>Physical and mental energy</Text>
                    <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>Drained</Text>
                        <Slider style={styles.slider} minimumValue={1} maximumValue={10} step={1} value={energy} onValueChange={(v) => { setEnergy(v); haptics.selectionChanged(); }} minimumTrackTintColor="#10b981" maximumTrackTintColor="#27272a" thumbTintColor="#10b981" />
                        <Text style={styles.sliderLabel}>Full</Text>
                    </View>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.valueNumber, { color: '#10b981' }]}>{energy}</Text>
                        <Text style={[styles.valueLabel, { color: '#10b981' }]}>{getEnergyLabel(energy)}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Reflection</Text>
                    <Text style={styles.cardSubtext}>What was the most significant part of your day?</Text>
                    <TextInput value={reflection} onChangeText={setReflection} placeholder="I felt proud when..." placeholderTextColor="#52525b" multiline numberOfLines={4} textAlignVertical="top" style={styles.textArea} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Accountability</Text>
                    <Text style={styles.cardSubtext}>Did you stick to your core habit today?</Text>
                    <View style={styles.optionsRow}>
                        {[{ value: 'yes', label: 'Yes', icon: '✓' }, { value: 'partial', label: 'Partial', icon: '~' }, { value: 'no', label: 'No', icon: '✕' }].map((option) => (
                            <TouchableOpacity key={option.value} onPress={() => { setAccountability(option.value as any); haptics.selectionChanged(); }} style={[styles.optionBtn, accountability === option.value && styles.optionBtnActive]}>
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <Text style={[styles.optionLabel, accountability === option.value && styles.optionLabelActive]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}>
                    {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{hasExistingCheckin ? 'Update Check-in' : 'Complete Check-in'}</Text>}
                </TouchableOpacity>

                <View style={styles.footer}><Text style={styles.footerText}>🔒 Your reflections are private and encrypted</Text></View>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    content: { padding: 24, paddingBottom: 40 },
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0b', alignItems: 'center', justifyContent: 'center' },
    header: { marginBottom: 32 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtext: { fontSize: 15, color: '#a1a1aa' },
    card: { backgroundColor: '#18181b', borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
    cardSubtext: { fontSize: 13, color: '#71717a', marginBottom: 24 },
    sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sliderLabel: { fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1 },
    slider: { flex: 1, height: 40, marginHorizontal: 8 },
    valueContainer: { alignItems: 'center' },
    valueNumber: { fontSize: 36, fontWeight: 'bold', marginBottom: 4 },
    valueLabel: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 },
    textArea: { backgroundColor: '#0a0a0b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, color: '#fff', fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    optionsRow: { flexDirection: 'row', gap: 12 },
    optionBtn: { flex: 1, backgroundColor: '#0a0a0b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, alignItems: 'center' },
    optionBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
    optionIcon: { fontSize: 20, marginBottom: 8 },
    optionLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa' },
    optionLabelActive: { color: '#f59e0b' },
    submitBtn: { backgroundColor: '#f59e0b', borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 24 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#000', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2 },
    footer: { alignItems: 'center' },
    footerText: { fontSize: 12, color: '#52525b' },
});
