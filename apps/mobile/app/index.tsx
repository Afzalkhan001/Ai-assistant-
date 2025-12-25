import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL, StorageKeys } from '../constants';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const [user, setUser] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const checkAuthAndLoad = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (!userStr) {
                router.replace('/login');
                return;
            }

            const userData = JSON.parse(userStr);
            setUser(userData);

            const savedTone = await AsyncStorage.getItem(StorageKeys.TONE_MODE);
            if (savedTone) setToneMode(savedTone as any);

            await loadHistory(userData.id);
        } catch (error) {
            console.error('Auth check error:', error);
            router.replace('/login');
        }
    };

    const loadHistory = async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/messages/${userId}?limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                    })));
                } else {
                    setMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: "Hey. How's your day?",
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                    }]);
                }
            } else {
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: "Hey. How's your day?",
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                }]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: "Hey. How's your day?",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    conversation_history: [],
                    tone_mode: toneMode,
                    user_data: {
                        email: user?.email || 'user@example.com',
                        name: user?.name || 'User',
                        tone_mode: toneMode,
                        explicit_allowed: toneMode === 'strict_raw',
                    },
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            setMessages(prev => [...prev, {
                id: `resp-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting. Please try again.",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToneChange = async (newTone: typeof toneMode) => {
        setToneMode(newTone);
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, newTone);
    };

    const getToneLabel = (tone: string) => {
        const map: Record<string, string> = {
            soft: 'Gentle',
            balanced: 'Balanced',
            strict_clean: 'Direct',
            strict_raw: 'Raw'
        };
        return map[tone] || 'Balanced';
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#0a0a0b]"
        >
            {/* Header */}
            <View className="pt-12 pb-4 px-6 border-b border-white/5 bg-[#0a0a0b]">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center gap-3">
                        <View className="relative">
                            <Image
                                source={require('../assets/images/icon.png')}
                                className="w-9 h-9 rounded-full"
                                style={{ shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 }}
                            />
                            <View className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] border-2 border-[#0a0a0b] rounded-full" />
                        </View>
                        <View>
                            <Text className="text-base font-bold text-white tracking-wider">AERA</Text>
                            <Text className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
                                {getToneLabel(toneMode)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                        <Text className="text-sm text-white/50">⋮</Text>
                    </TouchableOpacity>
                </View>

                {/* Tone Mode Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                    <View className="flex-row gap-2">
                        {[
                            { id: 'soft', label: 'Gentle' },
                            { id: 'balanced', label: 'Balanced' },
                            { id: 'strict_clean', label: 'Direct' },
                            { id: 'strict_raw', label: 'Raw' }
                        ].map(mode => (
                            <TouchableOpacity
                                key={mode.id}
                                onPress={() => handleToneChange(mode.id as any)}
                                className={`px-4 py-1.5 rounded-full border ${toneMode === mode.id
                                        ? 'bg-[#f59e0b]/15 border-[#f59e0b]/30'
                                        : 'bg-transparent border-white/5'
                                    }`}
                            >
                                <Text className={`text-[11px] font-semibold tracking-wider uppercase ${toneMode === mode.id ? 'text-[#f59e0b]' : 'text-zinc-500'
                                    }`}>
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 py-6"
                contentContainerStyle={{ gap: 16 }}
            >
                {isLoadingHistory ? (
                    <View className="flex-1 items-center justify-center h-32">
                        <ActivityIndicator size="small" color="#f59e0b" />
                    </View>
                ) : (
                    <>
                        <View className="items-center mb-6">
                            <View className="bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05]">
                                <Text className="text-[10px] font-bold tracking-widest text-zinc-500">CONVERSATION</Text>
                            </View>
                        </View>

                        {messages.map((msg) => (
                            <View key={msg.id} className={`flex ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <View className={`max-w-[85%] px-5 py-3.5 border shadow-lg ${msg.role === 'user'
                                        ? 'bg-white/10 border-white/10 rounded-3xl rounded-br-sm'
                                        : 'bg-[#18181b]/60 border-white/[0.05] rounded-3xl rounded-bl-sm'
                                    }`}>
                                    <Text className={`text-[15px] leading-relaxed font-light ${msg.role === 'user' ? 'text-white/95' : 'text-zinc-200'
                                        }`}>
                                        {msg.content}
                                    </Text>
                                </View>
                                <Text className="text-[10px] text-zinc-600 mt-2 px-1 font-medium opacity-60">
                                    {msg.timestamp}
                                </Text>
                            </View>
                        ))}

                        {isLoading && (
                            <View className="items-start">
                                <View className="bg-[#18181b]/60 border border-white/[0.05] px-5 py-3.5 rounded-3xl rounded-bl-sm">
                                    <View className="flex-row gap-1.5">
                                        <View className="w-2 h-2 bg-[#f59e0b] rounded-full opacity-30" />
                                        <View className="w-2 h-2 bg-[#f59e0b] rounded-full opacity-60" />
                                        <View className="w-2 h-2 bg-[#f59e0b] rounded-full" />
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Input */}
            <View className="px-4 pb-6 pt-3 bg-[#0a0a0b] border-t border-white/5">
                <View className="flex-row items-center gap-3 bg-[#18181b] border border-white/10 rounded-2xl px-5 py-2">
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Message AERA..."
                        placeholderTextColor="#52525b"
                        onSubmitEditing={sendMessage}
                        editable={!isLoading}
                        className="flex-1 text-white text-[15px] py-2"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className={`w-8 h-8 rounded-full items-center justify-center ${input.trim() && !isLoading ? 'bg-[#f59e0b]' : 'bg-white/5'
                            }`}
                    >
                        <Text className={input.trim() && !isLoading ? 'text-black' : 'text-zinc-600'}>↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
