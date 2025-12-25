import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { API_URL, StorageKeys } from '../constants';
import { haptics } from '../utils/haptics';

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

    useEffect(() => { checkAuthAndLoad(); }, []);
    useEffect(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, [messages]);

    const checkAuthAndLoad = async () => {
        try {
            const userStr = await AsyncStorage.getItem(StorageKeys.USER);
            if (!userStr) { router.replace('/login'); return; }
            const userData = JSON.parse(userStr);
            setUser(userData);
            const savedTone = await AsyncStorage.getItem(StorageKeys.TONE_MODE);
            if (savedTone) setToneMode(savedTone as any);
            await loadHistory(userData.id);
        } catch (error) { router.replace('/login'); }
    };

    const loadHistory = async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/messages/${userId}?limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })));
                } else {
                    setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                }
            } else {
                setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            }
        } catch (error) {
            setMessages([{ id: 'welcome', role: 'assistant', content: "Hey. How's your day?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } finally { setIsLoadingHistory(false); }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        haptics.messageSent();
        const userMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content, conversation_history: [], tone_mode: toneMode, user_data: { email: user?.email || 'user@example.com', name: user?.name || 'User', tone_mode: toneMode, explicit_allowed: toneMode === 'strict_raw' } }),
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            haptics.messageReceived();
            setMessages(prev => [...prev, { id: `resp-${Date.now()}`, role: 'assistant', content: data.response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } catch (error) {
            haptics.error();
            setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: "Sorry, I'm having trouble connecting.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        } finally { setIsLoading(false); }
    };

    const handleToneChange = async (newTone: typeof toneMode) => {
        setToneMode(newTone);
        haptics.selectionChanged();
        await AsyncStorage.setItem(StorageKeys.TONE_MODE, newTone);
    };

    const getToneLabel = (tone: string) => ({ soft: 'Gentle', balanced: 'Balanced', strict_clean: 'Direct', strict_raw: 'Raw' }[tone] || 'Balanced');

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
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
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

            <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
                {isLoadingHistory ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="small" color="#f59e0b" /></View>
                ) : (
                    <>
                        <Animated.View entering={FadeIn.delay(100)} style={styles.conversationBadge}>
                            <View style={styles.badge}><Text style={styles.badgeText}>CONVERSATION</Text></View>
                        </Animated.View>
                        {messages.map((msg, index) => (
                            <Animated.View key={msg.id} entering={FadeInDown.delay(index * 50).springify()} style={[styles.messageWrapper, msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper]}>
                                <View style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                                    <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.assistantText]}>{msg.content}</Text>
                                </View>
                                <Text style={styles.timestamp}>{msg.timestamp}</Text>
                            </Animated.View>
                        ))}
                        {isLoading && (
                            <Animated.View entering={FadeIn} style={styles.assistantWrapper}>
                                <View style={styles.typingBubble}>
                                    <View style={styles.typingDots}>
                                        <View style={[styles.dot, { opacity: 0.3 }]} />
                                        <View style={[styles.dot, { opacity: 0.6 }]} />
                                        <View style={styles.dot} />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                    <TextInput value={input} onChangeText={setInput} placeholder="Message AERA..." placeholderTextColor="#52525b" onSubmitEditing={sendMessage} editable={!isLoading} style={styles.input} multiline maxLength={500} />
                    <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || isLoading} style={[styles.sendButton, input.trim() && !isLoading ? styles.sendButtonActive : styles.sendButtonInactive]}>
                        <Text style={input.trim() && !isLoading ? styles.sendIconActive : styles.sendIconInactive}>↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0b' },
    header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: 'rgba(10,10,11,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 36, height: 36, borderRadius: 18 },
    onlineIndicator: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 5, borderWidth: 2, borderColor: '#0a0a0b' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
    subtitle: { fontSize: 10, color: '#71717a', fontWeight: '500', letterSpacing: 3, textTransform: 'uppercase' },
    toneRow: { flexDirection: 'row', gap: 8 },
    toneButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    toneButtonActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    toneText: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: '#71717a' },
    toneTextActive: { color: '#f59e0b' },
    messagesContainer: { flex: 1, paddingHorizontal: 16 },
    messagesContent: { paddingVertical: 24, gap: 16 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 128 },
    conversationBadge: { alignItems: 'center', marginBottom: 24 },
    badge: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 3, color: '#71717a' },
    messageWrapper: { flexDirection: 'column' },
    userWrapper: { alignItems: 'flex-end' },
    assistantWrapper: { alignItems: 'flex-start' },
    messageBubble: { maxWidth: '85%', paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1 },
    userBubble: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, borderBottomRightRadius: 4 },
    assistantBubble: { backgroundColor: 'rgba(24,24,27,0.6)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: 24, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22, fontWeight: '300' },
    userText: { color: 'rgba(255,255,255,0.95)' },
    assistantText: { color: '#d4d4d8' },
    timestamp: { fontSize: 10, color: '#52525b', marginTop: 8, paddingHorizontal: 4, fontWeight: '500', opacity: 0.6 },
    typingBubble: { backgroundColor: 'rgba(24,24,27,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, borderBottomLeftRadius: 4 },
    typingDots: { flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 },
    inputContainer: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, backgroundColor: 'rgba(10,10,11,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#18181b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8 },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8 },
    sendButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    sendButtonActive: { backgroundColor: '#f59e0b' },
    sendButtonInactive: { backgroundColor: 'rgba(255,255,255,0.05)' },
    sendIconActive: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    sendIconInactive: { color: '#52525b', fontSize: 16 },
});
