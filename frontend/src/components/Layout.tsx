import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';

export default function Layout() {
    const location = useLocation();
    const isChat = location.pathname === '/chat';

    const navItems = [
        {
            path: '/chat', label: 'Chat', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
            )
        },
        {
            path: '/tasks', label: 'Flow', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            )
        },
        {
            path: '/reflections', label: 'Insights', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            )
        },
        {
            path: '/settings', label: 'Settings', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    const handleNavClick = () => {
        haptics.tabSwitch();
    };

    return (
        <div className="min-h-screen flex flex-col w-full max-w-md relative bg-[#0a0a0b] shadow-2xl overflow-hidden">
            {/* Ambient background glow */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#f59e0b] opacity-[0.04] blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#14b8a6] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            {/* Main content - Simple crossfade, no exit animation for speed */}
            <main className="flex-1 overflow-y-auto z-10 custom-scrollbar relative">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="h-full"
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* Floating Capsule Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[280px]">
                <div className="rounded-full px-3 py-2.5 flex justify-evenly items-center 
                    bg-gradient-to-b from-[#1a1a1d] to-[#0d0d0f]
                    border border-white/[0.08]
                    shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-200 group`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* 3D Icon Container */}
                                    <div className={`
                                        relative w-10 h-10 rounded-xl flex items-center justify-center
                                        transition-all duration-200
                                        ${isActive
                                            ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] shadow-[0_4px_15px_rgba(245,158,11,0.4),0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] -translate-y-1 scale-105'
                                            : 'bg-gradient-to-b from-[#2a2a2d] to-[#1a1a1d] shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:from-[#333336] hover:to-[#222225] hover:-translate-y-0.5'
                                        }
                                    `}>
                                        {/* Inner shadow for depth */}
                                        <div className={`absolute inset-0 rounded-xl ${isActive ? 'bg-gradient-to-t from-black/20 to-transparent' : ''}`} />

                                        <div className={`relative z-10 ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                            {item.icon}
                                        </div>
                                    </div>

                                    {/* Active glow underneath */}
                                    {isActive && (
                                        <div className="absolute -bottom-1 w-6 h-1 rounded-full bg-[#f59e0b] blur-sm opacity-60" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Floating Action Button - Top right corner, only visible on chat */}
            {isChat && (
                <NavLink
                    to="/checkin"
                    onClick={() => haptics.buttonTap()}
                    className="fixed top-24 right-4 z-50 group"
                >
                    <div className="
                        w-12 h-12 rounded-2xl
                        bg-gradient-to-br from-[#f59e0b] via-[#f59e0b] to-[#d97706]
                        flex items-center justify-center
                        shadow-[0_8px_25px_-5px_rgba(245,158,11,0.5),0_4px_10px_-5px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)]
                        group-hover:shadow-[0_12px_35px_-5px_rgba(245,158,11,0.6),0_6px_15px_-5px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]
                        group-hover:scale-105 group-hover:-translate-y-0.5
                        transition-all duration-200
                    ">
                        {/* 3D inner highlight */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent opacity-60" />
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-2xl bg-gradient-to-t from-black/20 to-transparent" />

                        <svg className="w-5 h-5 text-black relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                        <div className="bg-[#1a1a1d] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10 shadow-lg">
                            Daily Check-in
                        </div>
                    </div>
                </NavLink>
            )}
        </div>
    );
}
