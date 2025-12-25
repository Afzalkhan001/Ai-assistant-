import { useState, useRef, useEffect } from 'react';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: 'assistant',
            content: "Hey. How's your day?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict_clean' | 'strict_raw'>('balanced');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history (excluding the initial greeting)
            const conversationHistory = messages
                .slice(1) // Skip the initial greeting
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    conversation_history: conversationHistory,
                    tone_mode: toneMode,
                    user_data: {
                        name: "Alex",
                        tone_mode: toneMode,
                        explicit_allowed: toneMode === 'strict_raw',
                        patterns: []
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (error) {
            console.error('Error:', error);
            // Show error message to user
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please make sure the backend is running and try again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0b] relative">
            {/* Header (Glass) */}
            <div className="pt-8 pb-4 px-6 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl z-20 sticky top-0 transition-all duration-300">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#d97706] p-[1px]">
                                <div className="w-full h-full rounded-full bg-[#0a0a0b] flex items-center justify-center">
                                    <span className="text-xs">🤖</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] border-2 border-[#0a0a0b] rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white tracking-tight">Companion</h1>
                            <p className="text-[10px] text-[#f59e0b] font-medium tracking-widest uppercase">
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
                        { id: 'soft', label: 'Gentle', emoji: '🌸' },
                        { id: 'balanced', label: 'Balanced', emoji: '⚖️' },
                        { id: 'strict_clean', label: 'Direct', emoji: '💪' },
                        { id: 'strict_raw', label: 'Raw', emoji: '🔥' }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setToneMode(mode.id as any)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wide transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${toneMode === mode.id
                                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                                    : 'bg-white/5 text-zinc-500 border border-white/5 hover:bg-white/10 hover:text-zinc-300'
                                }`}
                        >
                            <span>{mode.emoji}</span>
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                <div className="flex justify-center mb-8">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05] backdrop-blur-sm">TODAY</span>
                </div>

                {messages.map((msg, index) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div
                            className={`max-w-[85%] px-5 py-3.5 backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 rounded-[24px] rounded-br-[4px] text-white/95'
                                : 'bg-[#18181b]/60 border-white/[0.05] rounded-[24px] rounded-bl-[4px] text-zinc-200'
                                }`}
                        >
                            <p className="text-[15px] leading-relaxed font-light">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 mt-2 px-1 font-medium opacity-60">
                            {msg.timestamp}
                        </span>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-slide-up">
                        <div className="bg-[#18181b]/60 border border-white/[0.05] rounded-[24px] rounded-bl-[4px] px-5 py-4">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Advanced Glass) */}
            <div className="p-4 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent">
                <div className="glass-panel rounded-[28px] p-2 flex items-end gap-2 pr-2 transition-all duration-300 focus-within:ring-1 focus-within:ring-[#f59e0b]/30">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <span className="text-xl font-light">+</span>
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white placeholder-zinc-600 text-[15px] py-2.5 max-h-32 focus:outline-none resize-none mx-1"
                        rows={1}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${input.trim()
                            ? 'bg-gradient-to-tr from-[#f59e0b] to-[#d97706] shadow-[0_0_15px_rgba(245,158,11,0.5)] text-white scale-110 rotate-0'
                            : 'bg-white/5 text-zinc-600 cursor-not-allowed rotate-90 opacity-50'
                            }`}
                    >
                        <span className="text-lg">↑</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
