import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image,
    StyleSheet, Pressable, Dimensions, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, {
    FadeInDown, FadeIn, FadeOut,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
    Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, StorageKeys } from '../constants';
import { haptics, setHapticToneMode } from '../utils/haptics';
import { useNavVisibility } from '../contexts/NavVisibilityContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface SelectedFile {
    name: string;
    type: 'image' | 'document';
    uri: string;
    size?: number;
}

// ═══════════════════════════════════════════════════════════════
// PULSE BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════
function PulseButton({ onPress, isActive }: { onPress: () => void; isActive: boolean }) {
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (!isActive) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            pulse.value = withTiming(1, { duration: 150 });
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Animated.View style={[styles.attachButton, isActive && styles.attachButtonActive, animatedStyle]}>
                <Ionicons
                    name={isActive ? 'close' : 'add'}
                    size={22}
                    color={isActive ? '#f59e0b' : '#71717a'}
                />
            </Animated.View>
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════════════════════════════
function TypingIndicator() {
    const dots = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

    useEffect(() => {
        dots.forEach((dot, i) => {
            dot.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
                    withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
                ),
                -1,
                false
            );
            // Stagger by 100ms
            setTimeout(() => { }, i * 100);
        });
    }, []);

    const dotStyles = dots.map(dot => useAnimatedStyle(() => ({
        transform: [{ translateY: -3 * dot.value }],
        opacity: 0.6 + 0.4 * dot.value,
    })));

    return (
        <Animated.View entering={FadeIn.duration(150)} style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                    {dotStyles.map((style, i) => (
                        <Animated.View key={i} style={[styles.dot, style]} />
                    ))}
                </View>
            </View>
        </Animated.View>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CHAT SCREEN
// ═══════════════════════════════════════════════════════════════
export default function ChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const { onTap, onGestureStart, onGestureEnd, showNav } = useNavVisibility();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const [user, setUser] = useState<any>(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

    // ═══════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
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
            if (savedTone) {
                setToneMode(savedTone as any);
                setHapticToneMode(savedTone as any);
            }

            await loadHistory(userData.id);
            haptics.screenEntered();
        } catch (error) {
            router.replace('/login');
        }
    };

    const loadHistory = async (userId: string) => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`${API_URL}/messages/${userId}?limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages?.length > 0) {
                    setMessages(data.messages.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })));
                } else {
                    setWelcomeMessage();
                }
            } else {
                setWelcomeMessage();
            }
        } catch {
            setWelcomeMessage();
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const setWelcomeMessage = () => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hey. How's your day?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
    };

    // ═══════════════════════════════════════════════════════════
    // MESSAGING
    // ═══════════════════════════════════════════════════════════
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        haptics.messageSent();

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFile(null);
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

            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            haptics.messageReceived();

            setMessages(prev => [...prev, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch {
            haptics.connectionError();
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I'm having trouble connecting. Please try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // TONE & ATTACHMENTS
    // ═══════════════════════════════════════════════════════════
    const handleToneChange = async (newTone: typeof toneMode) => {
        if (newTone === toneMode) return;
        setToneMode(newTone);
        setHapticToneMode(newTone);
        haptics.toneChanged();
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, newTone);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            haptics.attachmentSelected();
            setSelectedFile({
                name: result.assets[0].fileName || 'Image',
                type: 'image',
                uri: result.assets[0].uri,
            });
            setShowAttachMenu(false);
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'text/*', 'application/msword'],
        });

        if (!result.canceled && result.assets[0]) {
            haptics.attachmentSelected();
            setSelectedFile({
                name: result.assets[0].name,
                type: 'document',
                uri: result.assets[0].uri,
                size: result.assets[0].size,
            });
            setShowAttachMenu(false);
        }
    };

    const getToneLabel = (tone: string) => {
        const map: Record<string, string> = { soft: 'Gentle', balanced: 'Balanced', strict_clean: 'Direct', strict_raw: 'Raw' };
        return map[tone] || 'Balanced';
    };

    const headerHeight = 110 + insets.top;

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <Pressable
            style={{ flex: 1 }}
            onPressIn={(e) => onGestureStart(e.nativeEvent.locationY)}
            onPressOut={onGestureEnd}
            onPress={(e) => onTap(e.nativeEvent.locationY)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                {/* ═══════════ HEADER ═══════════ */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.headerContent}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerLeft}>
                                <View style={styles.avatarWrap}>
                                    <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
                                    <View style={styles.online} />
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

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toneScroll}>
                            <View style={styles.toneRow}>
                                {(['soft', 'balanced', 'strict_clean', 'strict_raw'] as const).map(tone => (
                                    <TouchableOpacity
                                        key={tone}
                                        onPress={() => handleToneChange(tone)}
                                        style={[styles.toneBtn, toneMode === tone && styles.toneBtnActive]}
                                    >
                                        <Text style={[styles.toneTxt, toneMode === tone && styles.toneTxtActive]}>
                                            {getToneLabel(tone)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <View style={styles.headerBorder} />
                </View>

                {/* ═══════════ MESSAGES ═══════════ */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.messages}
                    contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 160, paddingHorizontal: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoadingHistory ? (
                        <View style={styles.loading}>
                            <ActivityIndicator color="#f59e0b" />
                            <Text style={styles.loadingTxt}>Loading...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.badge}>
                                <Text style={styles.badgeTxt}>CONVERSATION</Text>
                            </View>

                            {messages.map((msg, idx) => (
                                <Animated.View
                                    key={msg.id}
                                    entering={FadeInDown.delay(Math.min(idx * 30, 200)).duration(150)}
                                    style={[styles.msgWrap, msg.role === 'user' ? styles.msgUser : styles.msgAssistant]}
                                >
                                    {msg.role === 'user' ? (
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                                            style={styles.bubbleUser}
                                        >
                                            <Text style={styles.msgTxtUser}>{msg.content}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.bubbleAssistant}>
                                            <Text style={styles.msgTxtAssistant}>{msg.content}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.timestamp}>{msg.timestamp}</Text>
                                </Animated.View>
                            ))}

                            {isLoading && <TypingIndicator />}
                        </>
                    )}
                </ScrollView>

                {/* ═══════════ INPUT AREA ═══════════ */}
                <View style={styles.inputArea}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

                    {/* Attachment Menu */}
                    {showAttachMenu && (
                        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)} style={styles.attachMenu}>
                            <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
                                <View style={[styles.attachIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                                    <Ionicons name="image" size={18} color="#3b82f6" />
                                </View>
                                <Text style={styles.attachTxt}>Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
                                <View style={[styles.attachIcon, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                                    <Ionicons name="document" size={18} color="#a855f7" />
                                </View>
                                <Text style={styles.attachTxt}>Document</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Selected File Chip */}
                    {selectedFile && (
                        <Animated.View entering={FadeIn.duration(100)} style={styles.fileChip}>
                            <Ionicons
                                name={selectedFile.type === 'image' ? 'image' : 'document'}
                                size={16}
                                color="#a1a1aa"
                            />
                            <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                <Ionicons name="close-circle" size={18} color="#71717a" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Input Row */}
                    <View style={styles.inputRow}>
                        <PulseButton
                            onPress={() => { setShowAttachMenu(!showAttachMenu); haptics.selection(); }}
                            isActive={showAttachMenu}
                        />

                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Message AERA..."
                            placeholderTextColor="#52525b"
                            style={styles.input}
                            multiline
                            maxLength={1000}
                            onFocus={showNav}
                            onSubmitEditing={sendMessage}
                        />

                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!input.trim() || isLoading}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={input.trim() && !isLoading ? ['#f59e0b', '#d97706'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                                style={styles.sendBtn}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={18}
                                    color={input.trim() && !isLoading ? '#000' : '#52525b'}
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Pressable>
    );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },

    // Header
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerContent: { paddingHorizontal: 20, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerBorder: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
    avatarWrap: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    online: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 5, borderWidth: 2, borderColor: '#0a0a0b' },
    title: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
    subtitle: { fontSize: 10, color: '#f59e0b', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 },
    menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    toneScroll: { marginTop: 4 },
    toneRow: { flexDirection: 'row', gap: 8 },
    toneBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
    toneBtnActive: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)' },
    toneTxt: { fontSize: 11, fontWeight: '600', color: '#71717a', letterSpacing: 0.3 },
    toneTxtActive: { color: '#f59e0b' },

    // Messages
    messages: { flex: 1 },
    loading: { alignItems: 'center', paddingTop: 60 },
    loadingTxt: { color: '#71717a', fontSize: 13, marginTop: 12 },
    badge: { alignSelf: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    badgeTxt: { fontSize: 9, fontWeight: '700', color: '#52525b', letterSpacing: 1.5 },
    msgWrap: { marginBottom: 12 },
    msgUser: { alignItems: 'flex-end' },
    msgAssistant: { alignItems: 'flex-start' },
    bubbleUser: { maxWidth: '85%', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, borderBottomRightRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    bubbleAssistant: { maxWidth: '85%', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, borderBottomLeftRadius: 4, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    msgTxtUser: { fontSize: 15, lineHeight: 22, color: '#fafafa', fontWeight: '400' },
    msgTxtAssistant: { fontSize: 15, lineHeight: 22, color: '#d4d4d8', fontWeight: '400' },
    timestamp: { fontSize: 10, color: '#52525b', marginTop: 4, paddingHorizontal: 2, opacity: 0.7 },

    // Typing
    typingContainer: { alignItems: 'flex-start', marginTop: 8 },
    typingBubble: { backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 22, borderBottomLeftRadius: 4 },
    typingDots: { flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, backgroundColor: '#f59e0b', borderRadius: 3 },

    // Input Area
    inputArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, paddingVertical: 8, paddingLeft: 8, paddingRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8, paddingHorizontal: 8, maxHeight: 100 },
    attachButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    attachButtonActive: { backgroundColor: 'rgba(245,158,11,0.1)' },
    sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

    // Attach Menu
    attachMenu: { position: 'absolute', bottom: 70, left: 16, backgroundColor: 'rgba(24,24,27,0.98)', borderRadius: 16, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    attachOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    attachIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    attachTxt: { color: '#fff', fontSize: 14, fontWeight: '500' },

    // File Chip
    fileChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    fileName: { flex: 1, color: '#a1a1aa', fontSize: 13 },
});
