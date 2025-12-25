import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    time: string;
}

export default function ChatScreen() {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Good evening! How was your day? I noticed you completed your morning meditation - that's a great way to start!",
            time: '6:30 PM',
        },
        {
            id: '2',
            role: 'user',
            content: "It was productive! I finished the project proposal ahead of schedule.",
            time: '6:32 PM',
        },
        {
            id: '3',
            role: 'assistant',
            content: "That's wonderful to hear! Finishing early shows great focus. How are you feeling about the rest of your commitments for today?",
            time: '6:32 PM',
        },
    ]);

    const scrollViewRef = React.useRef<ScrollView>(null);

    const sendMessage = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMessage]);
        setInput('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I hear you. Remember, consistency matters more than perfection. What's one small step you can take right now?",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev: Message[]) => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
            >
                {/* Date separator */}
                <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>Today</Text>
                </View>

                {messages.map((msg: Message) => (
                    <View key={msg.id} style={styles.messageRow}>
                        {msg.role === 'assistant' && (
                            <View style={styles.avatar}>
                                <Ionicons name="sparkles" size={16} color="#f97316" />
                            </View>
                        )}
                        <View style={[
                            styles.bubble,
                            msg.role === 'user' ? styles.userBubble : styles.aiBubble
                        ]}>
                            <Text style={styles.bubbleText}>{msg.content}</Text>
                            <Text style={styles.timeText}>{msg.time}</Text>
                        </View>
                        {msg.role === 'user' && (
                            <View style={[styles.avatar, styles.userAvatar]}>
                                <Text style={styles.avatarText}>ME</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.inputBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Share your thoughts..."
                    placeholderTextColor="#64748b"
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim()}
                >
                    <Ionicons name="arrow-up" size={20} color={input.trim() ? '#0f172a' : '#64748b'} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    messages: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 20,
    },
    dateSeparator: {
        alignItems: 'center',
        marginBottom: 20,
    },
    dateText: {
        color: '#64748b',
        fontSize: 12,
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    userAvatar: {
        marginRight: 0,
        marginLeft: 8,
        backgroundColor: '#334155',
    },
    avatarText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '600',
    },
    bubble: {
        maxWidth: '75%',
        padding: 14,
        borderRadius: 18,
    },
    aiBubble: {
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#334155',
        borderBottomRightRadius: 4,
        marginLeft: 'auto',
    },
    bubbleText: {
        color: '#f8fafc',
        fontSize: 15,
        lineHeight: 22,
    },
    timeText: {
        color: '#64748b',
        fontSize: 10,
        marginTop: 6,
        textAlign: 'right',
    },
    inputBar: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        alignItems: 'flex-end',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        color: '#f8fafc',
        fontSize: 16,
        maxHeight: 100,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f97316',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#334155',
    },
});
