import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    created_at?: string;
}

const API_URL = 'http://localhost:8000';

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const getUser = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    const loadHistoryWithRetry = async (userId: string, retryCount = 0): Promise<any[]> => {
        const maxRetries = 3;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

        try {
            console.log(`Loading messages for user ${userId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            const response = await fetch(`${API_URL}/messages/${userId}?limit=50`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log(`Loaded ${data.messages?.length || 0} messages`);

            if (data.messages && data.messages.length > 0) {
                return data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    created_at: m.created_at
                }));
            }
            return [];
        } catch (error) {
            console.error(`Error loading messages (attempt ${retryCount + 1}):`, error);

            // Retry logic
            if (retryCount < maxRetries) {
                console.log(`Retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return loadHistoryWithRetry(userId, retryCount + 1);
            }

            // Max retries exceeded
            throw error;
        }
    };

    useEffect(() => {
        const loadHistory = async () => {
            const user = getUser();
            if (!user?.id) {
                console.log('No user found, showing welcome message');
                setIsLoadingHistory(false);
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: "Hey. How's your day?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                return;
            }

            try {
                const loadedMessages = await loadHistoryWithRetry(user.id);

                if (loadedMessages.length > 0) {
                    setMessages(loadedMessages);
                } else {
                    // No messages in history, show welcome
                    setMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: "Hey. How's your day?",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                }
            } catch (error) {
                console.error('Failed to load message history after retries:', error);
                // Show error message to user
                setMessages([{
                    id: 'error-loading',
                    role: 'assistant',
                    content: "I'm having trouble loading your message history. The backend might be offline. Your new messages will still work once it's back online.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadHistory();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        haptics.messageSent();
        const user = getUser();

        const userMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                        email: user?.email || "default@example.com",
                        name: user?.name || "User",
                        tone_mode: toneMode,
                        explicit_allowed: toneMode === 'strict_raw'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            haptics.messageReceived();

            setMessages(prev => [...prev, {
                id: `resp-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (error) {
            console.error('Error:', error);
            haptics.error();
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please make sure the backend is running and try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToneChange = (newTone: typeof toneMode) => {
        setToneMode(newTone);
        haptics.selectionChanged();
    };

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0b] relative">
            {/* Header */}
            <div className="pt-8 pb-4 px-6 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src="/logo.png"
                                alt="AERA"
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] border-2 border-[#0a0a0b] rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-wider">AERA</h1>
                            <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
                                {toneMode === 'soft' && 'Gentle'}
                                {toneMode === 'balanced' && 'Balanced'}
                                {toneMode === 'strict_clean' && 'Direct'}
                                {toneMode === 'strict_raw' && 'Raw'}
                            </p>
                        </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                        <span className="text-sm">⋮</span>
                    </button>
                </div>

                {/* Tone Mode Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                        { id: 'soft', label: 'Gentle' },
                        { id: 'balanced', label: 'Balanced' },
                        { id: 'strict_clean', label: 'Direct' },
                        { id: 'strict_raw', label: 'Raw' }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => handleToneChange(mode.id as any)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase transition-all duration-150 whitespace-nowrap ${toneMode === mode.id
                                ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                                : 'bg-transparent text-zinc-500 border border-white/5 hover:bg-white/5 hover:text-zinc-300'
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    className="w-2 h-2 bg-[#f59e0b] rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05]">CONVERSATION</span>
                        </div>

                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] px-5 py-3.5 backdrop-blur-md border shadow-lg ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 rounded-[24px] rounded-br-[4px] text-white/95'
                                        : 'bg-[#18181b]/60 border-white/[0.05] rounded-[24px] rounded-bl-[4px] text-zinc-200'
                                        }`}
                                >
                                    <p className="text-[15px] leading-relaxed font-light">{msg.content}</p>
                                </div>
                                <span className="text-[10px] text-zinc-600 mt-2 px-1 font-medium opacity-60">
                                    {msg.timestamp}
                                </span>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex justify-start"
                            >
                                <div className="bg-[#18181b]/60 border border-white/[0.05] rounded-[24px] rounded-bl-[4px] px-5 py-4">
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-24 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent">
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setShowAttachMenu(false); haptics.optionSelected(); } }} />
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setShowAttachMenu(false); haptics.optionSelected(); } }} />

                <AnimatePresence>
                    {selectedFile && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mb-3 mx-2 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 overflow-hidden"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{selectedFile.name}</p>
                                <p className="text-zinc-500 text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => { setSelectedFile(null); haptics.buttonTap(); }}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass-panel rounded-[28px] p-2 flex items-end gap-2 pr-2 transition-all duration-150 focus-within:ring-1 focus-within:ring-[#f59e0b]/30 relative">
                    <AnimatePresence>
                        {showAttachMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ duration: 0.1 }}
                                className="absolute bottom-16 left-2 bg-[#18181b]/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl z-30 min-w-[180px] backdrop-blur-xl"
                            >
                                <button
                                    onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); haptics.buttonTap(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-white text-sm font-medium">Photo</span>
                                </button>
                                <button
                                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); haptics.buttonTap(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <span className="text-white text-sm font-medium">Document</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => { setShowAttachMenu(!showAttachMenu); haptics.buttonTap(); }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${showAttachMenu ? 'text-[#f59e0b] bg-[#f59e0b]/10 rotate-45' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className="text-xl font-light">+</span>
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        onFocus={() => setShowAttachMenu(false)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white placeholder-zinc-600 text-[15px] py-2.5 max-h-32 focus:outline-none resize-none mx-1"
                        rows={1}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${input.trim()
                            ? 'bg-gradient-to-tr from-[#f59e0b] to-[#d97706] shadow-[0_0_15px_rgba(245,158,11,0.5)] text-white scale-110'
                            : 'bg-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <span className="text-lg">↑</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
