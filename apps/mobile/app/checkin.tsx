import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CheckinScreen() {
    const [mood, setMood] = React.useState(2);
    const [reflection, setReflection] = React.useState('');
    const [accountability, setAccountability] = React.useState<string | null>(null);

    const moods = [
        { emoji: '😔', label: 'Struggling' },
        { emoji: '😐', label: 'Neutral' },
        { emoji: '🙂', label: 'Good' },
        { emoji: '😊', label: 'Great' },
        { emoji: '🤩', label: 'Amazing' },
    ];

    const submitCheckin = () => {
        console.log({ mood, reflection, accountability });
        // In real app, this would call the API
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Date */}
            <Text style={styles.date}>December 25, 2024</Text>
            <Text style={styles.greeting}>Good evening! Take a moment to reflect.</Text>

            {/* Mood Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>How are you feeling?</Text>
                <View style={styles.moodGrid}>
                    {moods.map((m, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.moodBtn, mood === i && styles.moodBtnActive]}
                            onPress={() => setMood(i)}
                        >
                            <Text style={styles.moodEmoji}>{m.emoji}</Text>
                            <Text style={[styles.moodLabel, mood === i && styles.moodLabelActive]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Reflection Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>What was the highlight of your day?</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="I felt proud when..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    value={reflection}
                    onChangeText={setReflection}
                    textAlignVertical="top"
                />
            </View>

            {/* Accountability Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Did you stick to your core habit today?</Text>
                <View style={styles.buttonRow}>
                    {['Yes', 'Partial', 'No'].map(option => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionBtn,
                                accountability === option && styles.optionBtnActive,
                            ]}
                            onPress={() => setAccountability(option)}
                        >
                            <Text style={[
                                styles.optionText,
                                accountability === option && styles.optionTextActive,
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={submitCheckin}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.submitText}>Complete Check-in</Text>
            </TouchableOpacity>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
                <Ionicons name="shield-checkmark" size={14} color="#64748b" />
                <Text style={styles.privacyText}>Your reflections are private and encrypted</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    date: {
        color: '#f97316',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    greeting: {
        color: '#94a3b8',
        fontSize: 16,
        marginBottom: 28,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 14,
    },
    moodGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    moodBtn: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        minWidth: 60,
    },
    moodBtnActive: {
        backgroundColor: '#f97316',
    },
    moodEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    moodLabel: {
        color: '#94a3b8',
        fontSize: 10,
    },
    moodLabelActive: {
        color: '#fff',
    },
    textArea: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: '#f8fafc',
        fontSize: 16,
        minHeight: 100,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optionBtn: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#1e293b',
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionBtnActive: {
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    optionText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    },
    optionTextActive: {
        color: '#f97316',
    },
    submitBtn: {
        backgroundColor: '#f97316',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 10,
    },
    submitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    privacyNote: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 6,
    },
    privacyText: {
        color: '#64748b',
        fontSize: 12,
    },
});
