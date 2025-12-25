import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Colors, API_URL, StorageKeys } from '../constants';

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Good {getTimeOfDay()}, {userName}</Text>
                <Text style={styles.subtitle}>Take a moment to pause and reflect.</Text>
            </View>

            {/* Mood Slider */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>How are you feeling? (1-10)</Text>
                <Text style={styles.cardSubtitle}>Your emotional state right now</Text>

                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Low</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={mood}
                        onValueChange={setMood}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.surfaceLight}
                        thumbTintColor={Colors.primary}
                    />
                    <Text style={styles.sliderLabel}>High</Text>
                </View>
                <View style={styles.sliderInfo}>
                    <Text style={styles.sliderValue}>{mood}</Text>
                    <Text style={styles.sliderLabelText}>{getMoodLabel(mood)}</Text>
                </View>
            </View>

            {/* Energy Slider */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Energy level? (1-10)</Text>
                <Text style={styles.cardSubtitle}>Physical and mental energy</Text>

                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Drained</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={energy}
                        onValueChange={setEnergy}
                        minimumTrackTintColor={Colors.secondary}
                        maximumTrackTintColor={Colors.surfaceLight}
                        thumbTintColor={Colors.secondary}
                    />
                    <Text style={styles.sliderLabel}>Full</Text>
                </View>
                <View style={styles.sliderInfo}>
                    <Text style={[styles.sliderValue, { color: Colors.secondary }]}>{energy}</Text>
                    <Text style={[styles.sliderLabelText, { color: Colors.secondary }]}>{getEnergyLabel(energy)}</Text>
                </View>
            </View>

            {/* Reflection */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Reflection</Text>
                <Text style={styles.cardSubtitle}>What was the most significant part of your day?</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="I felt proud when..."
                    placeholderTextColor={Colors.textPlaceholder}
                    value={reflection}
                    onChangeText={setReflection}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            {/* Accountability */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Accountability</Text>
                <Text style={styles.cardSubtitle}>Did you stick to your core habit today?</Text>
                <View style={styles.optionsRow}>
                    {[
                        { value: 'yes', label: 'Yes', icon: '✓' },
                        { value: 'partial', label: 'Partial', icon: '~' },
                        { value: 'no', label: 'No', icon: '✕' },
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionButton,
                                accountability === option.value && styles.optionButtonActive,
                            ]}
                            onPress={() => setAccountability(option.value as any)}
                        >
                            <Text style={styles.optionIcon}>{option.icon}</Text>
                            <Text
                                style={[
                                    styles.optionLabel,
                                    accountability === option.value && styles.optionLabelActive,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color={Colors.background} />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {hasExistingCheckin ? 'Update Check-in' : 'Complete Check-in'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>🔒 Your reflections are private and encrypted</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 20,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sliderInfo: {
        alignItems: 'center',
        marginTop: 12,
    },
    sliderValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
    },
    sliderLabelText: {
        fontSize: 14,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    textArea: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
        minHeight: 100,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionButtonActive: {
        backgroundColor: `${Colors.primary}15`,
        borderColor: Colors.primary,
    },
    optionIcon: {
        fontSize: 20,
        marginBottom: 6,
    },
    optionLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    optionLabelActive: {
        color: Colors.primary,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: Colors.background,
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 12,
    },
});
