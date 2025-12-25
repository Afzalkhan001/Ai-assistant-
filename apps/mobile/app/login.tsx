import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
                try {
                    const data = await response.json();
                    errorMessage = data.detail || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, data.session.access_token);
            await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(data.user));

            haptics.success();
            router.replace('/');
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.message || err.toString() || 'Something went wrong';
            setError(errorMessage);
            haptics.error();

            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Cannot connect to server');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#0a0a0b]"
        >
            {/* Ambient glow effects */}
            <View className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] opacity-[0.04]">
                <LinearGradient
                    colors={['#f59e0b', 'transparent']}
                    style={{ width: '100%', height: '100%', borderRadius: 9999 }}
                />
            </View>
            <View className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] opacity-[0.03]">
                <LinearGradient
                    colors={['#14b8a6', 'transparent']}
                    style={{ width: '100%', height: '100%', borderRadius: 9999 }}
                />
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                {/* Logo/Header */}
                <Animated.View entering={ZoomIn.springify()} className="items-center mb-12">
                    <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    >
                        <Text className="text-3xl">✨</Text>
                    </LinearGradient>
                    <Text className="text-3xl font-bold text-white mb-2">Welcome Back</Text>
                    <Text className="text-zinc-500">Your accountability companion</Text>
                </Animated.View>

                {/* Login Form */}
                <Animated.View entering={FadeIn.delay(200)}>
                    <BlurView intensity={20} tint="dark" className="rounded-3xl overflow-hidden">
                        <View className="bg-[#18181b]/50 border border-white/10 p-8">
                            {error && (
                                <Animated.View entering={FadeIn} className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-6">
                                    <Text className="text-red-400 text-sm">{error}</Text>
                                </Animated.View>
                            )}

                            <View className="mb-6">
                                <Text className="text-sm font-medium text-zinc-400 mb-2">Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#52525b"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-2xl px-4 py-3 text-white text-[15px]"
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-sm font-medium text-zinc-400 mb-2">Password</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#52525b"
                                    secureTextEntry
                                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-2xl px-4 py-3 text-white text-[15px]"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                                className={`w-full rounded-2xl overflow-hidden ${loading ? 'opacity-50' : ''}`}
                            >
                                <LinearGradient
                                    colors={['#f59e0b', '#d97706']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-3 px-6 items-center"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text className="text-black font-semibold text-base">Log In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="items-center mt-6">
                                <Text className="text-sm text-zinc-500">
                                    Don't have an account?{' '}
                                    <Link href="/signup" className="text-[#f59e0b] font-medium">
                                        Sign up
                                    </Link>
                                </Text>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
