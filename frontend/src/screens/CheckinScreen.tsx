import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckinScreen() {
    const navigate = useNavigate();
    const [mood, setMood] = useState(2);
    const [reflection, setReflection] = useState('');
    const [accountability, setAccountability] = useState<string | null>(null);

    const moodLabels = ['Anxious', 'Low', 'Neutral', 'Calm', 'Flow'];

    const handleSubmit = async () => {
        try {
            console.log({ mood, reflection, accountability });
            navigate('/chat');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-6 pb-32 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] right-[-20%] w-[600px] h-[600px] bg-[#f59e0b] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="mb-10 pt-4 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                        <span className="text-sm">Back</span>
                    </button>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#f59e0b]/90 uppercase border border-[#f59e0b]/20 px-3 py-1 rounded-full">Daily Check-in</span>
                    <div className="w-12" /> {/* Layout balancer */}
                </div>

                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3 tracking-tight">Good evening, Alex</h1>
                <p className="text-zinc-400 font-light text-sm tracking-wide">Take a moment to pause and reflect on your day.</p>
            </div>

            {/* Mood Section (Liquid Glass Card) */}
            <div className="glass-panel rounded-[32px] p-8 mb-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-8 relative z-10">How are you feeling right now?</label>

                <div className="flex justify-between text-[10px] text-zinc-500 font-bold tracking-widest mb-6 px-1 uppercase">
                    <span>Anxious</span>
                    <span>Calm</span>
                </div>

                <div className="relative h-14 flex items-center mb-6">
                    {/* Track */}
                    <div className="absolute w-full h-3 bg-[#1a1a1c] border border-white/5 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-[#f59e0b]/10 via-[#f59e0b] to-[#f59e0b] shadow-[0_0_20px_#f59e0b]"
                            style={{ width: `${(mood / 4) * 100}%`, transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        />
                    </div>

                    {/* Thumb (Invisible Input) */}
                    <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={mood}
                        onChange={(e) => setMood(parseInt(e.target.value))}
                        className="absolute w-full h-14 opacity-0 cursor-pointer z-20"
                    />

                    {/* Custom Thumb Visual - Draggable Liquid Orb */}
                    <div
                        className="absolute w-10 h-10 rounded-full bg-[#0a0a0b] border-2 border-[#f59e0b] shadow-[0_0_25px_rgba(245,158,11,0.6)] pointer-events-none transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center z-10"
                        style={{ left: `calc(${(mood / 4) * 100}% - 20px)` }}
                    >
                        <div className="w-3 h-3 bg-[#f59e0b] rounded-full animate-pulse" />
                    </div>
                </div>

                <p className="text-center text-[#f59e0b] text-base font-medium tracking-widest uppercase transition-all duration-300">
                    {moodLabels[mood]}
                </p>
            </div>

            {/* Reflection Input */}
            <div className="glass-panel rounded-[32px] p-8 mb-6 transition-all duration-300 hover:bg-white/[0.05]">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-3">Reflection</label>
                <p className="text-zinc-500 text-xs mb-5 leading-relaxed">What was the most significant part of your day?</p>
                <div className="relative group">
                    <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="I felt proud when..."
                        className="w-full bg-[#0a0a0b]/60 border border-white/10 rounded-2xl p-5 text-zinc-300 placeholder-zinc-700 min-h-[140px] focus:border-[#f59e0b]/50 focus:bg-[#0a0a0b]/80 focus:shadow-[0_0_20px_rgba(245,158,11,0.05)] focus:outline-none transition-all duration-300 text-[15px] leading-relaxed resize-none"
                    />
                    <div className="absolute bottom-4 right-4 text-zinc-700 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {reflection.length} chars
                    </div>
                </div>
            </div>

            {/* Accountability */}
            <div className="glass-panel rounded-[32px] p-8 mb-8">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-4">Accountability</label>
                <p className="text-zinc-500 text-xs mb-6">Did you stick to your core habit today?</p>
                <div className="grid grid-cols-3 gap-4">
                    {['Yes', 'Partial', 'No'].map((option) => (
                        <button
                            key={option}
                            onClick={() => setAccountability(option)}
                            className={`py-4 rounded-2xl font-medium text-sm transition-all duration-300 border backdrop-blur-sm ${accountability === option
                                    ? 'bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.02]'
                                    : 'bg-transparent border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 hover:border-white/10'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="glass-button w-full py-5 rounded-2xl text-sm font-bold tracking-[0.15em] uppercase shadow-lg shadow-amber-900/20 mb-8"
            >
                Complete Check-in
            </button>

            <div className="flex items-center justify-center gap-2 mt-6 opacity-30 hover:opacity-100 transition-opacity duration-300">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full shadow-[0_0_5px_#10b981]"></div>
                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">End-to-end encrypted & private</p>
            </div>
        </div>
    );
}
