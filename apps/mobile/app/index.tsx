import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image,
    StyleSheet, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, StorageKeys } from '../constants';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
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
            router.replace('/login');
        }
    };

    const loadHistory = async (userId: string) => {
        setIsLoadingHistory(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${API_URL}/messages/${userId}?limit=50`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.messages?.length > 0) {
                    setMessages(data.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })));
                    return;
                }
            }
        } catch (e) {
            console.log('History load failed, starting fresh');
        } finally {
            setIsLoadingHistory(false);
        }

        // Default welcome
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hey. How's your day?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed');

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Connection error. Please try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.msgContainer,
            item.role === 'user' ? styles.msgContainerUser : styles.msgContainerAssistant
        ]}>
            {item.role === 'user' ? (
                <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.bubbleUser}
                >
                    <Text style={styles.msgTextUser}>{item.content}</Text>
                </LinearGradient>
            ) : (
                <View style={styles.bubbleAssistant}>
                    <Text style={styles.msgTextAssistant}>{item.content}</Text>
                </View>
            )}
            <Text style={[
                styles.timestamp,
                item.role === 'user' ? styles.timestampUser : styles.timestampAssistant
            ]}>
                {item.timestamp}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={require('../assets/images/icon.png')}
                                    style={styles.avatar}
                                />
                                <View style={styles.onlineDot} />
                            </View>
                            <View>
                                <Text style={styles.title}>AERA</Text>
                                <Text style={styles.subtitle}>{getToneLabel(toneMode)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.menuBtn}>
                            <Ionicons name="ellipsis-vertical" size={18} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.toneRow}>
                        {(['soft', 'balanced', 'strict_clean', 'strict_raw'] as const).map(tone => (
                            <TouchableOpacity
                                key={tone}
                                onPress={() => handleToneChange(tone)}
                                style={[styles.toneBtn, toneMode === tone && styles.toneBtnActive]}
                            >
                                <Text style={[styles.toneText, toneMode === tone && styles.toneTextActive]}>
                                    {getToneLabel(tone)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* MESSAGES */}
                {isLoadingHistory ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#f59e0b" size="large" />
                        <Text style={styles.loadingText}>Loading conversation...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.conversationBadge}>
                                <Text style={styles.badgeText}>CONVERSATION</Text>
                            </View>
                        }
                        ListFooterComponent={
                            isLoading ? (
                                <View style={styles.typingContainer}>
                                    <View style={styles.typingBubble}>
                                        <View style={styles.typingDots}>
                                            <View style={[styles.dot, { opacity: 0.4 }]} />
                                            <View style={[styles.dot, { opacity: 0.7 }]} />
                                            <View style={styles.dot} />
                                        </View>
                                    </View>
                                </View>
                            ) : null
                        }
                    />
                )}

                {/* INPUT */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <View style={[styles.inputContainer, { marginBottom: 90 }]}>
                        <View style={styles.inputRow}>
                            <TextInput
                                value={input}
                                onChangeText={setInput}
                                placeholder="Message AERA..."
                                placeholderTextColor="#52525b"
                                style={styles.input}
                                multiline
                                maxLength={1000}
                                returnKeyType="send"
                                onSubmitEditing={sendMessage}
                            />
                            <TouchableOpacity
                                onPress={sendMessage}
                                disabled={!input.trim() || isLoading}
                                style={styles.sendBtnWrapper}
                            >
                                <LinearGradient
                                    colors={input.trim() && !isLoading
                                        ? ['#f59e0b', '#d97706']
                                        : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                                    style={styles.sendBtn}
                                >
                                    <Ionicons
                                        name="arrow-up"
                                        size={20}
                                        color={input.trim() && !isLoading ? '#000' : '#52525b'}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0b',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a0b',
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0a0a0b',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        backgroundColor: '#10b981',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#0a0a0b',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        color: '#f59e0b',
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    menuBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toneRow: {
        flexDirection: 'row',
        gap: 8,
    },
    toneBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    toneBtnActive: {
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderColor: 'rgba(245,158,11,0.5)',
    },
    toneText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#71717a',
    },
    toneTextActive: {
        color: '#f59e0b',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#71717a',
        fontSize: 14,
    },

    // Messages List
    messagesList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    conversationBadge: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#52525b',
        letterSpacing: 1.5,
    },

    // Message Bubbles
    msgContainer: {
        marginBottom: 16,
    },
    msgContainerUser: {
        alignItems: 'flex-end',
    },
    msgContainerAssistant: {
        alignItems: 'flex-start',
    },
    bubbleUser: {
        maxWidth: '85%',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 22,
        borderBottomRightRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bubbleAssistant: {
        maxWidth: '85%',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 22,
        borderBottomLeftRadius: 6,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    msgTextUser: {
        fontSize: 16,
        lineHeight: 24,
        color: '#fafafa',
    },
    msgTextAssistant: {
        fontSize: 16,
        lineHeight: 24,
        color: '#d4d4d8',
    },
    timestamp: {
        fontSize: 11,
        color: '#52525b',
        marginTop: 6,
        paddingHorizontal: 4,
    },
    timestampUser: {
        textAlign: 'right',
    },
    timestampAssistant: {
        textAlign: 'left',
    },

    // Typing
    typingContainer: {
        alignItems: 'flex-start',
        marginTop: 8,
    },
    typingBubble: {
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 22,
        borderBottomLeftRadius: 6,
    },
    typingDots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        backgroundColor: '#f59e0b',
        borderRadius: 4,
    },

    // Input
    inputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0a0a0b',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 26,
        paddingVertical: 10,
        paddingLeft: 20,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 8,
        maxHeight: 120,
    },
    sendBtnWrapper: {
        marginBottom: 2,
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
