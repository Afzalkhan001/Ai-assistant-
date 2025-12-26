import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet, Dimensions, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, {
    FadeInDown,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    withSequence,
    withSpring,
    Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';
import { useNavVisibility } from '../contexts/NavVisibilityContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
}

// Enhanced Typing Indicator with Wave Animation
function TypingIndicator() {
    const dot1Anim = useSharedValue(0);
    const dot2Anim = useSharedValue(0);
    const dot3Anim = useSharedValue(0);
    const glowAnim = useSharedValue(0);

    useEffect(() => {
        // Wave animation for dots
        dot1Anim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
        dot2Anim.value = withDelay(150, withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        ));
        dot3Anim.value = withDelay(300, withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        ));
        // Glow pulse
        glowAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            false
        );

        // Trigger typing start haptic
        haptics.aiTypingStart();
    }, []);

    const dot1Style = useAnimatedStyle(() => ({
        transform: [{ translateY: -4 * dot1Anim.value }, { scale: 1 + 0.2 * dot1Anim.value }],
        opacity: 0.5 + 0.5 * dot1Anim.value,
    }));
    const dot2Style = useAnimatedStyle(() => ({
        transform: [{ translateY: -4 * dot2Anim.value }, { scale: 1 + 0.2 * dot2Anim.value }],
        opacity: 0.5 + 0.5 * dot2Anim.value,
    }));
    const dot3Style = useAnimatedStyle(() => ({
        transform: [{ translateY: -4 * dot3Anim.value }, { scale: 1 + 0.2 * dot3Anim.value }],
        opacity: 0.5 + 0.5 * dot3Anim.value,
    }));
    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowAnim.value,
    }));

    return (
        <Animated.View entering={FadeIn} style={styles.assistantWrapper}>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.typingGlow, glowStyle]} />
                <View style={styles.typingDots}>
                    <Animated.View style={[styles.dot, dot1Style]} />
                    <Animated.View style={[styles.dot, dot2Style]} />
                    <Animated.View style={[styles.dot, dot3Style]} />
                </View>
            </View>
            <Text style={styles.typingLabel}>AERA is thinking...</Text>
        </Animated.View>
    );
}

// Streaming Message Component
function StreamingMessage({ content }: { content: string }) {
    const [displayedContent, setDisplayedContent] = useState('');
    const hasTriggeredFirstWord = useRef(false);

    useEffect(() => {
        let index = 0;
        const words = content.split(' ');

        const interval = setInterval(() => {
            if (index < words.length) {
                setDisplayedContent(words.slice(0, index + 1).join(' '));

                // Haptic on first word
                if (!hasTriggeredFirstWord.current && index === 0) {
                    haptics.aiFirstWord();
                    hasTriggeredFirstWord.current = true;
                }

                index++;
            } else {
                clearInterval(interval);
                haptics.aiResponseComplete();
            }
        }, 40); // 40ms per word for smooth streaming effect

        return () => clearInterval(interval);
    }, [content]);

    return (
        <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={[styles.messageText, styles.assistantText]}>{displayedContent}</Text>
            {displayedContent.length < content.length && (
                <View style={styles.streamingCursor} />
            )}
        </View>
    );
}

export default function ChatScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [connectionError, setConnectionError] = useState(false);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const [user, setUser] = useState<any>(null);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const insets = useSafeAreaInsets();
    const { handleScreenTap, showNav } = useNavVisibility();

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

    const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
        const timeout = 30000;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    };

    const loadHistory = async (userId: string) => {
        setIsLoadingHistory(true);
        setConnectionError(false);
        try {
            const response = await fetchWithTimeout(`${API_URL}/messages/${userId}?limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map((m: any) => ({
                        id: m.id, role: m.role, content: m.content,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })));
                } else {
                    setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                }
            } else {
                console.log('Messages API returned non-OK, starting fresh conversation');
                setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            }
        } catch (error) {
            console.log('Could not load history, starting fresh:', error);
            setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        haptics.messageSent();
        const userMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setConnectionError(false);

        try {
            const response = await fetchWithTimeout(`${API_URL}/chat`, {
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
                        explicit_allowed: toneMode === 'strict_raw'
                    }
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            // Add message with streaming flag
            const newMsgId = `resp-${Date.now()}`;
            setStreamingMessageId(newMsgId);
            setMessages(prev => [...prev, {
                id: newMsgId,
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: true
            }]);

            // Clear streaming after animation completes
            const wordCount = data.response.split(' ').length;
            setTimeout(() => {
                setStreamingMessageId(null);
                setMessages(prev => prev.map(m =>
                    m.id === newMsgId ? { ...m, isStreaming: false } : m
                ));
            }, wordCount * 40 + 500);

        } catch (error) {
            haptics.error();
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting. Please try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToneChange = async (newTone: typeof toneMode) => {
        setToneMode(newTone);
        haptics.selectionChanged();
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, newTone);
    };

    const getToneLabel = (tone: string) => ({ soft: 'Gentle', balanced: 'Balanced', strict_clean: 'Direct', strict_raw: 'Raw' }[tone] || 'Balanced');

    const headerHeight = 60 + 40 + insets.top;

    // Handle tap for nav visibility
    const handleTap = (event: any) => {
        const { locationY } = event.nativeEvent;
        handleScreenTap(locationY, SCREEN_HEIGHT);
    };

    return (
        <Pressable style={{ flex: 1 }} onPress={handleTap}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                {/* Header with Blur */}
                <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.headerContent}>
                        <Animated.View entering={FadeIn.duration(300)}>
                            <View style={styles.headerTop}>
                                <View style={styles.headerLeft}>
                                    <View style={styles.avatarContainer}>
                                        <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
                                        <View style={styles.onlineIndicator} />
                                    </View>
                                    <View>
                                        <Text style={styles.title}>AERA</Text>
                                        <Text style={styles.subtitle}>{getToneLabel(toneMode)}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.menuButton} onPress={() => { haptics.buttonTap(); showNav(); }}>
                                    <Text style={styles.menuText}>⋮</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toneContainer}>
                                <View style={styles.toneRow}>
                                    {[{ id: 'soft', label: 'Gentle' }, { id: 'balanced', label: 'Balanced' }, { id: 'strict_clean', label: 'Direct' }, { id: 'strict_raw', label: 'Raw' }].map(mode => (
                                        <TouchableOpacity key={mode.id} onPress={() => handleToneChange(mode.id as any)} style={[styles.toneButton, toneMode === mode.id && styles.toneButtonActive]}>
                                            <Text style={[styles.toneText, toneMode === mode.id && styles.toneTextActive]}>{mode.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </View>
                    <View style={styles.headerBorder} />
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={[styles.messagesContent, { paddingTop: headerHeight + 20, paddingBottom: 140 }]}
                >
                    {isLoadingHistory ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#f59e0b" />
                            <Text style={styles.loadingText}>Connecting to AERA...</Text>
                        </View>
                    ) : (
                        <>
                            <Animated.View entering={FadeIn.delay(100)} style={styles.conversationBadge}>
                                <View style={styles.badge}><Text style={styles.badgeText}>CONVERSATION</Text></View>
                            </Animated.View>

                            {connectionError && (
                                <View style={styles.errorBanner}><Text style={styles.errorBannerText}>Connection issues detected. Messages may be delayed.</Text></View>
                            )}

                            {messages.map((msg, index) => (
                                <Animated.View key={msg.id} entering={FadeInDown.delay(Math.min(index * 50, 500)).springify()} style={[styles.messageWrapper, msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper]}>
                                    {msg.role === 'user' ? (
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                            style={[styles.messageBubble, styles.userBubble]}
                                        >
                                            <Text style={[styles.messageText, styles.userText]}>{msg.content}</Text>
                                        </LinearGradient>
                                    ) : msg.isStreaming && msg.id === streamingMessageId ? (
                                        <StreamingMessage content={msg.content} />
                                    ) : (
                                        <View style={[styles.messageBubble, styles.assistantBubble]}>
                                            <Text style={[styles.messageText, styles.assistantText]}>{msg.content}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.timestamp}>{msg.timestamp}</Text>
                                </Animated.View>
                            ))}

                            {isLoading && <TypingIndicator />}
                        </>
                    )}
                </ScrollView>

                {/* Input with Blur */}
                <BlurView intensity={80} tint="dark" style={[styles.inputContainer, { marginBottom: 100, paddingBottom: 12 }]}>
                    <View style={styles.inputBorder} />
                    <View style={styles.inputRow}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message AERA..."
                            placeholderTextColor="#52525b"
                            onSubmitEditing={sendMessage}
                            editable={!isLoading}
                            style={styles.input}
                            multiline
                            maxLength={500}
                            onFocus={showNav}
                        />
                        <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || isLoading} style={styles.sendButtonWrapper}>
                            <LinearGradient
                                colors={input.trim() && !isLoading ? ['#f59e0b', '#d97706'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                                style={styles.sendButton}
                            >
                                <Text style={input.trim() && !isLoading ? styles.sendIconActive : styles.sendIconInactive}>↑</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, overflow: 'hidden' },
    headerContent: { paddingHorizontal: 24, paddingBottom: 16 },
    headerBorder: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 5, borderWidth: 2, borderColor: '#0a0a0b' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
    subtitle: { fontSize: 11, color: '#f59e0b', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
    menuButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    menuText: { fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
    toneContainer: { paddingBottom: 4 },
    toneRow: { flexDirection: 'row', gap: 8 },
    toneButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
    toneButtonActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' },
    toneText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: '#71717a' },
    toneTextActive: { color: '#f59e0b' },
    messagesContainer: { flex: 1 },
    messagesContent: { gap: 16, paddingHorizontal: 16 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 200 },
    loadingText: { color: '#71717a', fontSize: 13, marginTop: 16, letterSpacing: 0.5 },
    errorBanner: { marginTop: 20, padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    errorBannerText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
    conversationBadge: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    badge: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, color: '#52525b' },
    messageWrapper: { flexDirection: 'column', marginBottom: 4 },
    userWrapper: { alignItems: 'flex-end' },
    assistantWrapper: { alignItems: 'flex-start' },
    messageBubble: { maxWidth: '85%', paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1 },
    userBubble: { borderRadius: 24, borderBottomRightRadius: 4, borderColor: 'rgba(255,255,255,0.1)' },
    assistantBubble: { backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 24, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    userText: { color: '#FAFAFA' },
    assistantText: { color: '#d4d4d8' },
    timestamp: { fontSize: 11, color: '#52525b', marginTop: 6, paddingHorizontal: 4, fontWeight: '500' },
    typingBubble: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', paddingHorizontal: 24, paddingVertical: 18, borderRadius: 24, borderBottomLeftRadius: 4, position: 'relative', overflow: 'hidden' },
    typingGlow: { position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, backgroundColor: 'rgba(245,158,11,0.05)', borderRadius: 40 },
    typingDots: { flexDirection: 'row', gap: 8 },
    typingLabel: { fontSize: 10, color: '#52525b', marginTop: 8, fontWeight: '500', letterSpacing: 0.5 },
    dot: { width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 },
    streamingCursor: { width: 2, height: 16, backgroundColor: '#f59e0b', marginLeft: 4, opacity: 0.8 },
    inputContainer: { paddingTop: 16, paddingHorizontal: 16 },
    inputBorder: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', width: '100%', position: 'absolute', top: 0 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, paddingVertical: 10, paddingLeft: 20, paddingRight: 10, minHeight: 56 },
    input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 8, maxHeight: 120 },
    sendButtonWrapper: { borderRadius: 20, overflow: 'hidden', marginBottom: 4 },
    sendButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    sendIconActive: { color: '#000', fontSize: 18, fontWeight: 'bold' },
    sendIconInactive: { color: '#52525b', fontSize: 18 },
});
