import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';

const API_URL = 'http://localhost:8000';

export default function CheckinScreen() {
    const navigate = useNavigate();
    const [mood, setMood] = useState(5);
    const [energy, setEnergy] = useState(5);
    const [reflection, setReflection] = useState('');
    const [accountability, setAccountability] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasExistingCheckin, setHasExistingCheckin] = useState(false);
    const [userName, setUserName] = useState('there');
    const [lastMood, setLastMood] = useState(5);
    const [lastEnergy, setLastEnergy] = useState(5);

    const getUser = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    useEffect(() => {
        const loadTodayCheckin = async () => {
            const user = getUser();
            if (user?.name) setUserName(user.name);
            if (!user?.id) return;
            try {
                const response = await fetch(`${API_URL}/checkins/${user.id}/today`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.checkin) {
                        setMood(data.checkin.mood || 5);
                        setEnergy(data.checkin.energy || 5);
                        setLastMood(data.checkin.mood || 5);
                        setLastEnergy(data.checkin.energy || 5);
                        setReflection(data.checkin.reflection || '');
                        setAccountability(data.checkin.accountability);
                        setHasExistingCheckin(true);
                    }
                }
            } catch (error) { console.error('Error loading checkin:', error); }
        };
        loadTodayCheckin();
    }, []);

    // Haptic feedback on slider tick
    useEffect(() => {
        if (mood !== lastMood) {
            haptics.sliderTick();
            setLastMood(mood);
        }
    }, [mood, lastMood]);

    useEffect(() => {
        if (energy !== lastEnergy) {
            haptics.sliderTick();
            setLastEnergy(energy);
        }
    }, [energy, lastEnergy]);

    const handleSubmit = async () => {
        const user = getUser();
        if (!user?.id) { navigate('/chat'); return; }
        setIsSubmitting(true);
        haptics.success();
        try {
            const response = await fetch(`${API_URL}/checkins?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood, energy, reflection: reflection.trim() || null, accountability })
            });
            if (response.ok) navigate('/chat');
        } catch (error) {
            console.error('Error submitting checkin:', error);
            haptics.error();
        } finally { setIsSubmitting(false); }
    };

    const getMoodLabel = (v: number) => v <= 2 ? 'Struggling' : v <= 4 ? 'Low' : v <= 6 ? 'Neutral' : v <= 8 ? 'Good' : 'Thriving';
    const getEnergyLabel = (v: number) => v <= 2 ? 'Exhausted' : v <= 4 ? 'Tired' : v <= 6 ? 'Okay' : v <= 8 ? 'Energized' : 'Peak';
    const getTimeOfDay = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-6 pb-32 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-20%] w-[600px] h-[600px] bg-[#f59e0b] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="mb-10 pt-4 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => { navigate(-1); haptics.buttonTap(); }} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                        <span className="text-sm">Back</span>
                    </button>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#f59e0b]/90 uppercase border border-[#f59e0b]/20 px-3 py-1 rounded-full">
                        {hasExistingCheckin ? 'Update Check-in' : 'Daily Check-in'}
                    </span>
                    <div className="w-12" />
                </div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3 tracking-tight">Good {getTimeOfDay()}, {userName}</h1>
                <p className="text-zinc-400 font-light text-sm tracking-wide">Take a moment to pause and reflect on your day.</p>
            </div>

            {/* Mood */}
            <div className="glass-panel rounded-[32px] p-8 mb-6 relative overflow-hidden">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-2">How are you feeling? (1-10)</label>
                <p className="text-zinc-500 text-xs mb-6">Your emotional state right now</p>
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold tracking-widest mb-4 px-1 uppercase"><span>Low</span><span>High</span></div>
                <div className="relative h-14 flex items-center mb-4">
                    <div className="absolute w-full h-3 bg-[#1a1a1c] border border-white/5 rounded-full overflow-hidden shadow-inner">
                        <motion.div className="h-full bg-gradient-to-r from-[#f59e0b]/10 via-[#f59e0b] to-[#f59e0b] shadow-[0_0_20px_#f59e0b]" animate={{ width: `${(mood / 10) * 100}%` }} transition={{ duration: 0.1 }} />
                    </div>
                    <input type="range" min="1" max="10" step="1" value={mood} onChange={(e) => setMood(parseInt(e.target.value))} className="absolute w-full h-14 opacity-0 cursor-pointer z-20" />
                    <motion.div className="absolute w-10 h-10 rounded-full bg-[#0a0a0b] border-2 border-[#f59e0b] shadow-[0_0_25px_rgba(245,158,11,0.6)] pointer-events-none flex items-center justify-center z-10" animate={{ left: `calc(${((mood - 1) / 9) * 100}% - 20px)` }} transition={{ duration: 0.1 }}>
                        <span className="text-[#f59e0b] text-sm font-bold">{mood}</span>
                    </motion.div>
                </div>
                <p className="text-center text-[#f59e0b] text-base font-medium tracking-widest uppercase">{getMoodLabel(mood)}</p>
            </div>

            {/* Energy */}
            <div className="glass-panel rounded-[32px] p-8 mb-6 relative overflow-hidden">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-2">Energy level? (1-10)</label>
                <p className="text-zinc-500 text-xs mb-6">Physical and mental energy</p>
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold tracking-widest mb-4 px-1 uppercase"><span>Drained</span><span>Full</span></div>
                <div className="relative h-14 flex items-center mb-4">
                    <div className="absolute w-full h-3 bg-[#1a1a1c] border border-white/5 rounded-full overflow-hidden shadow-inner">
                        <motion.div className="h-full bg-gradient-to-r from-[#10b981]/10 via-[#10b981] to-[#10b981] shadow-[0_0_20px_#10b981]" animate={{ width: `${(energy / 10) * 100}%` }} transition={{ duration: 0.1 }} />
                    </div>
                    <input type="range" min="1" max="10" step="1" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="absolute w-full h-14 opacity-0 cursor-pointer z-20" />
                    <motion.div className="absolute w-10 h-10 rounded-full bg-[#0a0a0b] border-2 border-[#10b981] shadow-[0_0_25px_rgba(16,185,129,0.6)] pointer-events-none flex items-center justify-center z-10" animate={{ left: `calc(${((energy - 1) / 9) * 100}% - 20px)` }} transition={{ duration: 0.1 }}>
                        <span className="text-[#10b981] text-sm font-bold">{energy}</span>
                    </motion.div>
                </div>
                <p className="text-center text-[#10b981] text-base font-medium tracking-widest uppercase">{getEnergyLabel(energy)}</p>
            </div>

            {/* Reflection */}
            <div className="glass-panel rounded-[32px] p-8 mb-6">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-3">Reflection</label>
                <p className="text-zinc-500 text-xs mb-5 leading-relaxed">What was the most significant part of your day?</p>
                <div className="relative group">
                    <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="I felt proud when..."
                        className="w-full bg-[#0a0a0b]/60 border border-white/10 rounded-2xl p-5 text-zinc-300 placeholder-zinc-700 min-h-[140px] focus:border-[#f59e0b]/50 focus:bg-[#0a0a0b]/80 focus:shadow-[0_0_20px_rgba(245,158,11,0.05)] focus:outline-none transition-all duration-150 text-[15px] leading-relaxed resize-none" />
                    <div className="absolute bottom-4 right-4 text-zinc-700 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">{reflection.length} chars</div>
                </div>
            </div>

            {/* Accountability */}
            <div className="glass-panel rounded-[32px] p-8 mb-8">
                <label className="text-zinc-200 text-sm font-medium tracking-wide block mb-4">Accountability</label>
                <p className="text-zinc-500 text-xs mb-6">Did you stick to your core habit today?</p>
                <div className="grid grid-cols-3 gap-4">
                    {[{ value: 'yes', label: 'Yes', emoji: '✓' }, { value: 'partial', label: 'Partial', emoji: '~' }, { value: 'no', label: 'No', emoji: '✕' }].map((option) => (
                        <button key={option.value} onClick={() => { setAccountability(option.value as any); haptics.optionSelected(); }}
                            className={`py-4 rounded-2xl font-medium text-sm transition-all duration-150 border backdrop-blur-sm active:scale-95 ${accountability === option.value
                                ? 'bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                : 'bg-transparent border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}>
                            <span className="block text-lg mb-1">{option.emoji}</span>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={isSubmitting}
                className={`glass-button w-full py-5 rounded-2xl text-sm font-bold tracking-[0.15em] uppercase shadow-lg shadow-amber-900/20 mb-8 active:scale-98 transition-transform ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSubmitting ? 'Saving...' : hasExistingCheckin ? 'Update Check-in' : 'Complete Check-in'}
            </button>

            <div className="flex items-center justify-center gap-2 mt-6 opacity-30 hover:opacity-100 transition-opacity duration-200">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full shadow-[0_0_5px_#10b981]"></div>
                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">End-to-end encrypted & private</p>
            </div>
        </div>
    );
}
