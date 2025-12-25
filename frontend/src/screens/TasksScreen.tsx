import { useState } from 'react';

interface Task {
    id: number;
    title: string;
    category: string;
    time?: string;
    completed: boolean;
}

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: 'Morning meditation', category: 'Health', time: '7:00 AM', completed: true },
        { id: 2, title: 'Finish proposal', category: 'Work', completed: false },
        { id: 3, title: 'Evening breathing', category: 'Health', time: '8:00 PM', completed: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="min-h-screen bg-bg-primary p-4">
            {/* Header */}
            <div className="mb-6">
                <p className="text-text-muted text-sm mb-1">Today, Oct 24</p>
                <h1 className="text-2xl font-semibold text-text-primary mb-3">Your Commitments</h1>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-accent-amber rounded"></div>
                    <p className="text-sm text-text-secondary italic">"Consistency is quiet work."</p>
                </div>
            </div>

            {/* Active Commitments */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-text-primary font-medium">Active Commitments</h2>
                    <span className="text-xs bg-bg-elevated px-3 py-1 rounded-full text-text-secondary">
                        {activeTasks.length} Remaining
                    </span>
                </div>

                <div className="space-y-2">
                    {activeTasks.map(task => (
                        <div key={task.id} className="card flex items-center gap-4">
                            <div className="w-10 h-10 bg-bg-elevated rounded-lg flex items-center justify-center text-xl">
                                {task.category === 'Work' ? '💼' : '🧘'}
                            </div>
                            <div className="flex-1">
                                <p className="text-text-primary font-medium">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-muted">
                                        {task.category}
                                    </span>
                                    {task.time && (
                                        <>
                                            <span className="text-text-muted text-xs">•</span>
                                            <span className="text-xs text-text-muted">{task.time}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleTask(task.id)}
                                className="w-6 h-6 rounded border-2 border-border hover:border-accent-amber transition-colors"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Completed */}
            {completedTasks.length > 0 && (
                <div>
                    <h2 className="text-text-primary font-medium mb-4">Reflections & Done</h2>
                    <div className="space-y-2">
                        {completedTasks.map(task => (
                            <div key={task.id} className="card flex items-center gap-4 opacity-60">
                                <div className="w-10 h-10 bg-bg-elevated rounded-lg flex items-center justify-center text-xl opacity-50">
                                    {task.category === 'Work' ? '💼' : '🧘'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-text-secondary line-through">{task.title}</p>
                                    <span className="text-xs text-text-muted">{task.category}</span>
                                </div>
                                <div className="w-6 h-6 rounded bg-accent-amber flex items-center justify-center">
                                    <span className="text-bg-primary text-sm">✓</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
