import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                mode: 'cors',
            });

            if (!response.ok) {
                let errorMessage = 'Login failed';
                try {
                    const data = await response.json();
                    errorMessage = data.detail || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Store session
            localStorage.setItem('access_token', data.session.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Navigate to chat
            navigate('/chat');
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.message || err.toString() || 'Something went wrong';
            setError(errorMessage);
            
            // Log more details for debugging
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Cannot connect to server. Make sure the backend is running on http://localhost:8000');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#f59e0b] opacity-[0.04] blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#14b8a6] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo/Header */}
                <div className="text-center mb-12 animate-float">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#d97706] mb-4">
                        <span className="text-3xl">✨</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-zinc-500">Your accountability companion</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="glass-panel rounded-3xl p-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full liquid-input px-4 py-3"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full liquid-input px-4 py-3"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full glass-button rounded-2xl py-3 px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-zinc-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-[#f59e0b] hover:text-[#d97706] font-medium transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
