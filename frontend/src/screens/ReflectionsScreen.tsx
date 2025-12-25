import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';

const API_URL = 'http://localhost:8000';

interface Checkin { date: string; mood: number; energy: number; }
interface Pattern { pattern_key: string; description: string; confidence: number; }

export default function ReflectionsScreen() {
    const navigate = useNavigate();
    const [checkins, setCheckins] = useState<Checkin[]>([]);
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [weekSummary, setWeekSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunningReflection, setIsRunningReflection] = useState(false);

    const getUser = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const user = getUser();
        if (!user?.id) { setIsLoading(false); return; }
        try {
            const checkinsRes = await fetch(`${API_URL}/checkins/${user.id}?limit=7`);
            if (checkinsRes.ok) {
                const data = await checkinsRes.json();
                setCheckins(data.checkins || []);
            }
        } catch (error) { console.error('Error loading data:', error); }
        finally { setIsLoading(false); }
    };

    const runWeeklyReflection = async () => {
        const user = getUser();
        if (!user?.id) return;
        setIsRunningReflection(true);
        haptics.buttonTap();
        try {
            const response = await fetch(`${API_URL}/reflection/weekly/${user.id}`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    setWeekSummary(data.result.week_summary);
                    haptics.success();
                    await loadData();
                }
            }
        } catch (error) {
            console.error('Error running reflection:', error);
            haptics.error();
        } finally { setIsRunningReflection(false); }
    };

    const avgMood = checkins.length > 0 ? Math.round(checkins.reduce((acc, c) => acc + c.mood, 0) / checkins.length * 10) / 10 : 0;
    const avgEnergy = checkins.length > 0 ? Math.round(checkins.reduce((acc, c) => acc + c.energy, 0) / checkins.length * 10) / 10 : 0;

    const getMoodTrend = () => {
        if (checkins.length < 2) return 'stable';
        const recent = checkins.slice(0, 3).reduce((acc, c) => acc + c.mood, 0) / Math.min(3, checkins.length);
        const older = checkins.slice(3).reduce((acc, c) => acc + c.mood, 0) / Math.max(1, checkins.length - 3);
        return recent > older + 1 ? 'improving' : recent < older - 1 ? 'declining' : 'stable';
    };

    const trendEmoji = { improving: '📈', stable: '➡️', declining: '📉' };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-2 h-2 bg-[#f59e0b] rounded-full" />)}
                </div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-4 pb-28">
            {/* Header */}
            <div className="mb-6">
                <p className="text-zinc-500 text-sm mb-1 uppercase tracking-wider">{today}</p>
                <h1 className="text-2xl font-semibold text-white mb-3">Your Weekly Reflection</h1>
            </div>

            {/* Mood Trend */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-white font-medium mb-1">Emotional Pattern</h2>
                        <p className="text-[#f59e0b] text-sm font-medium uppercase tracking-wider">{getMoodTrend()} {trendEmoji[getMoodTrend()]}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-zinc-400 text-xs">Avg Mood</p>
                        <p className="text-2xl font-bold text-white">{avgMood}/10</p>
                    </div>
                </div>
                <div className="h-24 flex items-end gap-1 mb-4">
                    {[...checkins].reverse().map((checkin, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${(checkin.mood / 10) * 100}%` }} transition={{ duration: 0.3, delay: i * 0.05 }} className="w-full bg-gradient-to-t from-[#f59e0b]/50 to-[#f59e0b] rounded-t" />
                            <span className="text-[8px] text-zinc-600">{new Date(checkin.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                        </div>
                    ))}
                    {checkins.length === 0 && <p className="text-zinc-500 text-sm w-full text-center py-8">Complete check-ins to see your mood trend</p>}
                </div>
                {weekSummary && <p className="text-zinc-400 text-sm mt-4 p-3 bg-white/5 rounded-lg">{weekSummary}</p>}
            </div>

            {/* Stats */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <h2 className="text-white font-medium mb-4">This Week's Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl text-center hover:bg-white/8 transition-colors">
                        <p className="text-zinc-400 text-xs mb-1">Check-ins</p>
                        <p className="text-2xl font-bold text-white">{checkins.length}/7</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl text-center hover:bg-white/8 transition-colors">
                        <p className="text-zinc-400 text-xs mb-1">Avg Energy</p>
                        <p className="text-2xl font-bold text-[#10b981]">{avgEnergy}/10</p>
                    </div>
                </div>
            </div>

            {/* Run Reflection */}
            <button onClick={runWeeklyReflection} disabled={isRunningReflection}
                className={`w-full py-4 rounded-xl mb-6 font-medium transition-all active:scale-98 ${isRunningReflection ? 'bg-white/10 text-zinc-500 cursor-not-allowed' : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30'}`}>
                {isRunningReflection ? 'Analyzing...' : '🧠 Run Weekly Reflection'}
            </button>

            {/* Patterns */}
            {patterns.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-white font-medium mb-4">Learned Patterns</h2>
                    <div className="space-y-2">
                        {patterns.map((pattern, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🧩</span>
                                    <div className="flex-1">
                                        <p className="text-[#f59e0b] text-xs font-medium mb-1 uppercase">{pattern.pattern_key.replace('_', ' ')}</p>
                                        <p className="text-zinc-300 text-sm">{pattern.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pattern.confidence * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-[#f59e0b]" />
                                            </div>
                                            <span className="text-[10px] text-zinc-500">{Math.round(pattern.confidence * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigate to Chat */}
            <button onClick={() => { navigate('/chat'); haptics.buttonTap(); }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold active:scale-98 transition-transform">
                Open Companion Chat
            </button>
        </div>
    );
}
