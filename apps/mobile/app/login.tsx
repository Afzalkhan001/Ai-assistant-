import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                let errorMessage = 'Login failed';
                try { const data = await response.json(); errorMessage = data.detail || errorMessage; } catch (e) { }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, data.session.access_token);
            await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(data.user));
            haptics.success();
            router.replace('/');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            haptics.error();
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={ZoomIn.springify()} style={styles.logoContainer}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.logoGradient}>
                        <Text style={styles.logoIcon}>✨</Text>
                    </LinearGradient>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Your accountability companion</Text>
                </Animated.View>

                <Animated.View entering={FadeIn.delay(200)} style={styles.formContainer}>
                    {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#52525b" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#52525b" secureTextEntry style={styles.input} />
                    </View>

                    <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.submitBtn, loading && styles.submitBtnDisabled]}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Log In</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText}>Don't have an account? </Text>
                        <Link href="/signup" style={styles.link}>Sign up</Link>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    glowTop: { position: 'absolute', top: -100, left: -50, width: 400, height: 400, backgroundColor: '#f59e0b', opacity: 0.04, borderRadius: 200 },
    glowBottom: { position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, backgroundColor: '#14b8a6', opacity: 0.03, borderRadius: 150 },
    logoContainer: { alignItems: 'center', marginBottom: 48 },
    logoGradient: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoIcon: { fontSize: 28 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#71717a' },
    formContainer: { backgroundColor: 'rgba(24,24,27,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 32 },
    errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24 },
    errorText: { color: '#f87171', fontSize: 14 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '500', color: '#a1a1aa', marginBottom: 8 },
    input: { backgroundColor: '#0a0a0b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 15 },
    submitBtn: { borderRadius: 16, overflow: 'hidden' },
    submitBtnDisabled: { opacity: 0.5 },
    submitGradient: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
    submitText: { color: '#000', fontWeight: '600', fontSize: 16 },
    linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    linkText: { fontSize: 14, color: '#71717a' },
    link: { fontSize: 14, color: '#f59e0b', fontWeight: '500' },
});
