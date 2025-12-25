import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
    const navItems = [
        { path: '/chat', icon: '💬', label: 'Chat' },
        { path: '/tasks', icon: '⚡', label: 'Flow' },
        { path: '/reflections', icon: '🌊', label: 'Insights' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="min-h-screen flex flex-col w-full max-w-md relative bg-[#0a0a0b] shadow-2xl overflow-hidden">
            {/* Ambient background glow - Moving liquid orb */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#f59e0b] opacity-[0.04] blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#14b8a6] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pb-28 z-10 custom-scrollbar relative">
                <Outlet />
            </main>

            {/* Floating Capsule Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[280px]">
                <div className="glass-panel rounded-full px-2 py-3 flex justify-evenly items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 bg-[#0a0a0b]/80 backdrop-blur-2xl">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-500 group ${isActive ? '-translate-y-1' : 'opacity-50 hover:opacity-100'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Glow Behind Icon */}
                                    <div className={`absolute inset-0 bg-[#f59e0b] blur-[20px] rounded-full opacity-0 transition-opacity duration-500 pointer-events-none ${isActive ? 'opacity-40' : ''
                                        }`} />

                                    <div className={`text-2xl transition-all duration-500 relative z-10 ${isActive
                                        ? 'text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110'
                                        : 'text-zinc-400 group-hover:text-zinc-200'
                                        }`}>
                                        {item.icon}
                                    </div>

                                    {/* Active Indicator Dot */}
                                    <div className={`absolute -bottom-1 w-1 h-1 rounded-full transition-all duration-500 ${isActive
                                        ? 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] opacity-100 scale-100'
                                        : 'bg-transparent opacity-0 scale-0'
                                        }`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Floating Action Button (Liquid Animation) */}
            <NavLink
                to="/checkin"
                className="fixed bottom-32 right-6 w-14 h-14 glass-button rounded-[20px] 
                   flex items-center justify-center text-xl z-50
                   hover:rounded-[28px] animate-liquid transition-all duration-500"
            >
                <span className="relative z-10 drop-shadow-md">✨</span>
            </NavLink>
        </div>
    );
}
