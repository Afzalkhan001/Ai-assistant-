export default function ReflectionsScreen() {
    const patterns = [
        { id: 1, title: 'Gentle Confrontation', description: 'You said you\'d start working at 9 AM. It\'s 10:15. What held you back?' },
        { id: 2, title: 'Calm Encouragement', description: 'Three days in a row of morning meditation. That consistency is building something.' },
        { id: 3, title: 'Evening Check-in', description: 'Before bed, let\'s reflect: Did today align with who you\'re becoming?' },
    ];

    return (
        <div className="min-h-screen bg-bg-primary p-4">
            {/* Header */}
            <div className="mb-6">
                <p className="text-text-muted text-sm mb-1">OCTOBER REVIEW</p>
                <h1 className="text-2xl font-semibold text-text-primary mb-3">Your Weekly Reflection</h1>
            </div>

            {/* Emotional Pattern */}
            <div className="card mb-6">
                <h2 className="text-text-primary font-medium mb-2">Emotional Feedback</h2>
                <p className="text-accent-amber text-sm font-medium mb-3">STABLE FLOW</p>

                {/* Placeholder for chart */}
                <div className="h-32 bg-bg-primary rounded-lg border border-border flex items-center justify-center mb-3">
                    <p className="text-text-muted text-sm">Mood pattern visualization</p>
                </div>

                <p className="text-text-secondary text-sm">
                    Your mood has been relatively stable this week, with a spike in energy during Tuesday evening workouts.
                </p>
            </div>

            {/* Consistency */}
            <div className="card mb-6">
                <h2 className="text-text-primary font-medium mb-3">Consistency</h2>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-secondary">Morning Reflection</span>
                            <span className="text-accent-amber">6/7 days</span>
                        </div>
                        <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
                            <div className="h-full bg-accent-amber" style={{ width: '85%' }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-secondary">Evening Checkin</span>
                            <span className="text-accent-amber">4/7 days</span>
                        </div>
                        <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
                            <div className="h-full bg-accent-amber" style={{ width: '57%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggested Actions */}
            <div className="card mb-6">
                <h2 className="text-text-primary font-medium mb-3">SUGGESTED ACTIONS</h2>
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-bg-primary rounded-lg">
                        <span className="text-xl">💡</span>
                        <div className="flex-1">
                            <p className="text-text-primary text-sm font-medium">1:1 Breathing Mode</p>
                            <p className="text-text-muted text-xs mt-1">You mentioned anxiety 3 times. Try our breathwork tool.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-bg-primary rounded-lg">
                        <span className="text-xl">📝</span>
                        <div className="flex-1">
                            <p className="text-text-primary text-sm font-medium">Journal on Tuesday</p>
                            <p className="text-text-muted text-xs mt-1">Tuesday felt significant. Want to explore that?</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Examples */}
            <div className="mb-6">
                <h2 className="text-text-primary font-medium mb-3">Reflections</h2>
                <div className="space-y-2">
                    {patterns.map(pattern => (
                        <div key={pattern.id} className="card">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💭</span>
                                <div className="flex-1">
                                    <p className="text-accent-amber text-xs font-medium mb-1">{pattern.title}</p>
                                    <p className="text-text-secondary text-sm">{pattern.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn-primary w-full">
                Open Companion Chat
            </button>
        </div>
    );
}
