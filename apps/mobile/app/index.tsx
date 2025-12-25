import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, API_URL, StorageKeys, ToneModes } from '../constants';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toneMode, setToneMode] = useState<string>('balanced');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (!userStr) {
                router.replace('/login');
                return;
            }

            const userData = JSON.parse(userStr);
            setUser(userData);

            // Load saved tone mode
            const savedTone = await AsyncStorage.getItem(StorageKeys.TONE_MODE);
            if (savedTone) setToneMode(savedTone);

            // Load message history
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

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
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I couldn't connect. Make sure the backend is running.",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToneChange = async (mode: string) => {
        setToneMode(mode);
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, mode);
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isLoadingHistory) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Tone Selector */}
            <View style={styles.toneContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.toneRow}>
                        {Object.values(ToneModes).map((mode) => (
                            <TouchableOpacity
                                key={mode.id}
                                style={[
                                    styles.toneButton,
                                    toneMode === mode.id && styles.toneButtonActive,
                                ]}
                                onPress={() => handleToneChange(mode.id)}
                            >
                                <Text
                                    style={[
                                        styles.toneText,
                                        toneMode === mode.id && styles.toneTextActive,
                                    ]}
                                >
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
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={scrollToBottom}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                        ]}
                    >
                        <Text style={styles.messageText}>{msg.content}</Text>
                        <Text style={styles.messageTime}>{msg.timestamp}</Text>
                    </View>
                ))}

                {isLoading && (
                    <View style={[styles.messageBubble, styles.assistantBubble]}>
                        <View style={styles.typingIndicator}>
                            <View style={styles.typingDot} />
                            <View style={[styles.typingDot, styles.typingDot2]} />
                            <View style={[styles.typingDot, styles.typingDot3]} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textPlaceholder}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    <Ionicons
                        name="arrow-up"
                        size={20}
                        color={input.trim() ? Colors.background : Colors.textMuted}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    toneContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    toneRow: {
        flexDirection: 'row',
        gap: 8,
    },
    toneButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toneButtonActive: {
        backgroundColor: `${Colors.primary}20`,
        borderColor: Colors.primary,
    },
    toneText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toneTextActive: {
        color: Colors.primary,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        gap: 12,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 14,
        borderRadius: 20,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.surfaceLight,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        color: Colors.textPrimary,
        fontSize: 15,
        lineHeight: 22,
    },
    messageTime: {
        color: Colors.textMuted,
        fontSize: 10,
        marginTop: 6,
        alignSelf: 'flex-end',
    },
    typingIndicator: {
        flexDirection: 'row',
        gap: 4,
        paddingVertical: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.6,
    },
    typingDot3: {
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: 24,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        paddingRight: 16,
        fontSize: 16,
        color: Colors.textPrimary,
        maxHeight: 120,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.surface,
    },
});
