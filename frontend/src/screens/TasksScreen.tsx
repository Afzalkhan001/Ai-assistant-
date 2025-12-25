import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';

interface Task {
    id: string;
    title: string;
    description?: string;
    scheduled_for?: string;
    status: 'pending' | 'completed' | 'skipped' | 'snoozed';
    created_at: string;
}

const API_URL = 'http://localhost:8000';

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);

    const getUser = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        const user = getUser();
        if (!user?.id) { setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_URL}/tasks/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createTask = async () => {
        if (!newTaskTitle.trim()) return;
        const user = getUser();
        if (!user?.id) return;
        haptics.success();
        try {
            const response = await fetch(`${API_URL}/tasks?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle.trim() })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.task) setTasks(prev => [data.task, ...prev]);
                setNewTaskTitle('');
                setShowAddTask(false);
            }
        } catch (error) { console.error('Error creating task:', error); }
    };

    const updateTaskStatus = async (taskId: string, newStatus: 'completed' | 'skipped' | 'snoozed') => {
        const user = getUser();
        if (!user?.id) return;

        if (newStatus === 'completed') haptics.success();
        else if (newStatus === 'skipped') haptics.warning();
        else haptics.buttonTap();

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            const task = tasks.find(t => t.id === taskId);
            await fetch(`${API_URL}/tasks/${taskId}?user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, title: task?.title })
            });
        } catch (error) { console.error('Error updating task:', error); }
    };

    const deleteTask = async (taskId: string) => {
        haptics.buttonTap();
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' });
            if (response.ok) setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) { console.error('Error deleting task:', error); }
    };

    const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'snoozed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const skippedTasks = tasks.filter(t => t.status === 'skipped');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-2 h-2 bg-[#f59e0b] rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] p-4 pb-28">
            {/* Header */}
            <div className="mb-6">
                <p className="text-zinc-500 text-sm mb-1">{today}</p>
                <h1 className="text-2xl font-semibold text-white mb-3">Your Commitments</h1>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-[#f59e0b] rounded"></div>
                    <p className="text-sm text-zinc-400 italic">"Consistency is quiet work."</p>
                </div>
            </div>

            {/* Add Task */}
            <AnimatePresence mode="wait">
                {!showAddTask ? (
                    <motion.button
                        key="add-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        onClick={() => { setShowAddTask(true); haptics.buttonTap(); }}
                        className="w-full mb-6 p-4 rounded-xl border border-dashed border-white/10 text-zinc-500 hover:border-[#f59e0b]/50 hover:text-[#f59e0b] transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        <span>Add Commitment</span>
                    </motion.button>
                ) : (
                    <motion.div
                        key="add-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createTask()}
                            placeholder="What's your commitment?"
                            className="w-full bg-transparent text-white placeholder-zinc-500 mb-3 focus:outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={createTask} className="px-4 py-2 bg-[#f59e0b] text-black rounded-lg text-sm font-medium hover:bg-[#d97706] transition-colors">Add</button>
                            <button onClick={() => { setShowAddTask(false); setNewTaskTitle(''); haptics.buttonTap(); }} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-medium">Active Commitments</h2>
                    <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-zinc-400">{activeTasks.length} Remaining</span>
                </div>

                {activeTasks.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No active commitments. Add one above!</p>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {activeTasks.map(task => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.15 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xl">📋</div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{task.title}</p>
                                        {task.scheduled_for && (
                                            <span className="text-xs text-zinc-500">{new Date(task.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateTaskStatus(task.id, 'completed')} className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center active:scale-90" title="Complete">✓</button>
                                        <button onClick={() => updateTaskStatus(task.id, 'skipped')} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center active:scale-90" title="Skip">✕</button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Completed */}
            <AnimatePresence>
                {completedTasks.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-8">
                        <h2 className="text-white font-medium mb-4">Completed ✓</h2>
                        <div className="space-y-2">
                            {completedTasks.map(task => (
                                <div key={task.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 opacity-60">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-xl">✓</div>
                                    <p className="flex-1 text-zinc-400 line-through">{task.title}</p>
                                    <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors">🗑</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skipped */}
            <AnimatePresence>
                {skippedTasks.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-white font-medium mb-4">Skipped</h2>
                        <div className="space-y-2">
                            {skippedTasks.map(task => (
                                <div key={task.id} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-4 opacity-60">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-xl">✕</div>
                                    <p className="flex-1 text-zinc-400">{task.title}</p>
                                    <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors">🗑</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
