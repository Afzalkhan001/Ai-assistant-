import { useState } from 'react';

export default function SettingsScreen() {
    const [toneMode, setToneMode] = useState<'soft' | 'balanced' | 'strict'>('balanced');
    const [checkinTime, setCheckinTime] = useState('08:00');
    const [beginFeedback, setBeginFeedback] = useState(true);

    return (
        <div className="min-h-screen bg-bg-primary p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-text-primary mb-2">Settings</h1>
                <p className="text-text-muted text-sm">Personalize your experience</p>
            </div>

            {/* Profile */}
            <div className="card mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-accent-amber rounded-full flex items-center justify-center text-2xl font-bold text-bg-primary">
                        AC
                    </div>
                    <div>
                        <p className="text-text-primary font-medium">Alex Chen</p>
                        <p className="text-text-muted text-sm">alex.chen@example.com</p>
                    </div>
                </div>
                <button className="text-accent-amber text-sm font-medium">Edit Profile</button>
            </div>

            {/* Tone Mode */}
            <div className="card mb-6">
                <label className="text-text-primary font-medium block mb-3">Tone Mode</label>
                <p className="text-text-muted text-sm mb-4">
                    How should your companion speak? This affects the directness and intensity of accountability.
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {(['soft', 'balanced', 'strict'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setToneMode(mode)}
                            className={`py-3 px-4 rounded-xl font-medium capitalize transition-all ${toneMode === mode
                                    ? 'bg-accent-amber text-bg-primary'
                                    : 'bg-bg-primary text-text-secondary hover:bg-bg-elevated border border-border'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Daily Check-in */}
            <div className="card mb-6">
                <label className="text-text-primary font-medium block mb-3">Daily Check-in</label>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-text-secondary text-sm">Morning Check-in time</span>
                    <input
                        type="time"
                        value={checkinTime}
                        onChange={(e) => setCheckinTime(e.target.value)}
                        className="input-field py-2 px-3"
                    />
                </div>
            </div>

            {/* Begin Feedback */}
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <p className="text-text-primary font-medium mb-1">Begin Feedback</p>
                        <p className="text-text-muted text-sm">Get gentle nudges when starting tasks</p>
                    </div>
                    <button
                        onClick={() => setBeginFeedback(!beginFeedback)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${beginFeedback ? 'bg-accent-amber' : 'bg-bg-elevated'
                            }`}
                    >
                        <div
                            className={`w-5 h-5 bg-bg-primary rounded-full absolute top-1 transition-transform ${beginFeedback ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <p className="text-text-primary font-medium mb-1">Appearance</p>
                        <p className="text-text-muted text-sm">Dark mode (always on)</p>
                    </div>
                    <div className="text-text-muted">🌙</div>
                </div>
            </div>

            {/* Other Options */}
            <div className="space-y-2 mb-6">
                <button className="card w-full text-left flex justify-between items-center">
                    <span className="text-text-primary">Export Data</span>
                    <span className="text-text-muted">→</span>
                </button>

                <button className="card w-full text-left flex justify-between items-center">
                    <span className="text-text-primary">Help Center</span>
                    <span className="text-text-muted">→</span>
                </button>

                <button className="card w-full text-left text-red-400">
                    Log Out
                </button>
            </div>

            <p className="text-center text-text-muted text-xs">
                Version 1.0.0 • Privacy & Terms
            </p>
        </div>
    );
}
