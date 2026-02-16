'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    UserCircle,
    LogOut,
    Settings,
    ClipboardList,
    Menu,
    X,
    Bell,
    Plus,
    CheckCircle,
    CalendarCheck,
    Car,
    Megaphone,
    MessageSquare,
    ChevronDown,
    ClipboardCheck,
    Lightbulb,
    Activity,
    Sun,
    Moon,
} from 'lucide-react';
import api from '../lib/api';
import { useTheme } from '../lib/hooks/useTheme';
import { useSocket } from '../lib/hooks/useSocket';

interface MenuItem {
    name: string;
    icon: React.ReactNode;
    href: string;
    children?: MenuItem[];
}

interface UserInfo {
    id: number;
    userId?: string;
    name: string;
    email?: string;
    role?: string;
    position?: string;
    departmentId?: number;
    teamId?: number;
    department?: { name: string };
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const { resolvedTheme, toggleTheme } = useTheme();
    useSocket(); // WebSocket 연결 (SWR 캐시 자동 갱신)

    useEffect(() => {
        // 클라이언트 사이드에서 사용자 정보 로드
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        }
        localStorage.removeItem('user_name');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const menuItems: MenuItem[] = [
        { name: '대시보드', icon: <LayoutDashboard size={18} />, href: '/' },
        { name: '일일 업무 보고', icon: <FileText size={18} />, href: '/daily-report' },
        { name: '주간 업무 현황', icon: <Calendar size={18} />, href: '/weekly-status' },
        { name: '연차 신청', icon: <ClipboardList size={18} />, href: '/attendance' },
        { name: '예약', icon: <CalendarCheck size={18} />, href: '/reservation' },
        { name: '공지사항', icon: <Megaphone size={18} />, href: '/board/notice' },
        {
            name: '게시판', icon: <MessageSquare size={18} />, href: '/board',
            children: [
                { name: '팀현황보고', icon: <ClipboardCheck size={16} />, href: '/board/team-status' },
                { name: '자유게시판', icon: <MessageSquare size={16} />, href: '/board/free' },
                { name: '건의게시판', icon: <Lightbulb size={16} />, href: '/board/suggestion' },
            ],
        },
    ];

    if (user?.role === 'DEPT_HEAD') {
        menuItems.push({ name: '연차 승인', icon: <CheckCircle size={18} />, href: '/attendance/approval' });
    }

    const managementItems: MenuItem[] = [];
    if (['CEO', 'EXECUTIVE', 'DEPT_HEAD', 'TEAM_LEADER'].includes(user?.role || '')) {
        managementItems.push({ name: '활동 로그', icon: <Activity size={18} />, href: '/activity-log' });
    }
    if (user?.departmentId === 3) {
        managementItems.push({
            name: '연차 관리',
            icon: <Plus size={18} />,
            href: '/vacation-mgmt',
        });
        managementItems.push({
            name: '차량 관리',
            icon: <Car size={18} />,
            href: '/settings/vehicles',
        });
    }
    managementItems.push({ name: '설정', icon: <Settings size={18} />, href: '/settings' });

    if (pathname === '/login') return <>{children}</>;

    return (
        <div className="min-h-screen bg-[#fdfbf7] dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex flex-col font-sans transition-colors duration-300 whitespace-nowrap">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-stone-200 dark:border-slate-700 h-16 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all transform group-hover:scale-105">
                            <span className="font-bold text-white text-lg">O</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base leading-none tracking-tight text-slate-800">OWMS</span>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Work System</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                            if (item.children) {
                                return (
                                    <div
                                        key={item.href}
                                        className="relative"
                                        onMouseEnter={() => setOpenSubmenu(item.name)}
                                        onMouseLeave={() => setOpenSubmenu(null)}
                                    >
                                        <button
                                            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                                ? 'bg-stone-50 text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-stone-50'
                                                }`}
                                        >
                                            {item.icon}
                                            <span>{item.name}</span>
                                            <ChevronDown size={14} className={`transition-transform ${openSubmenu === item.name ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openSubmenu === item.name && (
                                            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50">
                                                {item.children.map((child) => {
                                                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold transition-all ${isChildActive
                                                                ? 'bg-indigo-50 text-indigo-600'
                                                                : 'text-slate-500 hover:text-slate-900 hover:bg-stone-50'
                                                                }`}
                                                        >
                                                            {child.icon}
                                                            <span>{child.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-stone-50 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-stone-50'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section (Profile & Settings) */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Special Management Buttons */}
                        <div className="flex items-center space-x-2 mr-2">
                            {managementItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${isActive
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50'
                                            : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="h-6 w-px bg-stone-200 dark:bg-slate-600 mx-2"></div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition-all"
                            title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
                        >
                            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-400 rounded-full border-2 border-white dark:border-slate-800"></span>
                        </button>

                        <div className="flex items-center space-x-3 pl-2 relative">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-slate-700 leading-none">{user?.name || '관리자'}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">{user?.department?.name || '부서 정보 없음'}</p>
                            </div>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-white shadow-sm flex items-center justify-center hover:ring-2 hover:ring-indigo-200 transition-all active:scale-95"
                                title="프로필 메뉴"
                            >
                                <UserCircle size={20} className="text-indigo-400" />
                            </button>

                            {/* Profile Popover */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-3xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <div className="p-5 border-b border-stone-100 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800/50">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-11 h-11 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                                                    <UserCircle size={28} className="text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm leading-tight">{user?.name || '사용자'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight uppercase">{user?.userId || 'ID 없음'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="px-3 py-2">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Professional Info</p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">부서</span>
                                                        <span className="text-slate-700">{user?.department?.name || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">직급</span>
                                                        <span className="text-slate-700">{user?.position || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-px bg-stone-100 my-3 mx-2"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all text-xs font-black uppercase tracking-widest"
                                            >
                                                <LogOut size={14} />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-stone-50 rounded-xl transition-all"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-700 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300 z-50">
                        <nav className="flex flex-col space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                                if (item.children) {
                                    return (
                                        <div key={item.href}>
                                            <button
                                                onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive
                                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                                                    : 'text-slate-500 hover:bg-stone-50'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    {item.icon}
                                                    <span>{item.name}</span>
                                                </div>
                                                <ChevronDown size={16} className={`transition-transform ${openSubmenu === item.name ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openSubmenu === item.name && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {item.children.map((child) => {
                                                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-bold ${isChildActive
                                                                    ? 'bg-indigo-50 text-indigo-600'
                                                                    : 'text-slate-400 hover:text-slate-700 hover:bg-stone-50'
                                                                    }`}
                                                            >
                                                                {child.icon}
                                                                <span>{child.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive
                                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                                            : 'text-slate-500 hover:bg-stone-50'
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            <div className="h-px bg-stone-100 my-2"></div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 mt-2">Special Menu</p>

                            {managementItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                            : 'bg-indigo-50 text-indigo-600'
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}

                            <div className="h-px bg-stone-100 my-2"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all text-sm font-bold"
                            >
                                <LogOut size={18} />
                                <span>로그아웃</span>
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 pt-16 relative">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
                    <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-purple-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-emerald-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
