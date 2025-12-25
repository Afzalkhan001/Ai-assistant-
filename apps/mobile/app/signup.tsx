import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            if (!response.ok) {
                let errorMessage = 'Signup failed';
                try {
                    const data = await response.json();
                    errorMessage = data.detail || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Store session
            await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, data.session.access_token);
            await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(data.user));

            haptics.success();
            router.replace('/');
        } catch (err: any) {
            console.error('Signup error:', err);
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
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                {/* Ambient glow effects */}
                <View className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#f59e0b] opacity-[0.04] blur-3xl rounded-full" />
                <View className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#14b8a6] opacity-[0.03] blur-3xl rounded-full" />

                {/* Logo/Header */}
                <View className="items-center mb-12">
                    <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#d97706] items-center justify-center mb-4">
                        <Text className="text-3xl">✨</Text>
                    </View>
                    <Text className="text-3xl font-bold text-white mb-2">Join AERA</Text>
                    <Text className="text-zinc-500">Start your accountability journey</Text>
                </View>

                {/* Signup Form */}
                <View className="bg-[#18181b]/50 border border-white/10 rounded-3xl p-8">
                    {error && (
                        <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-6">
                            <Text className="text-red-400 text-sm">{error}</Text>
                        </View>
                    )}

                    <View className="mb-6">
                        <Text className="text-sm font-medium text-zinc-400 mb-2">Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor="#52525b"
                            className="w-full bg-[#0a0a0b] border border-white/10 rounded-2xl px-4 py-3 text-white text-[15px]"
                        />
                    </View>

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
                        onPress={handleSignup}
                        disabled={loading}
                        className={`w-full bg-[#f59e0b] rounded-2xl py-3 px-6 items-center ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text className="text-black font-semibold text-base">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View className="items-center mt-6">
                        <Text className="text-sm text-zinc-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#f59e0b] font-medium">
                                Log in
                            </Link>
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
