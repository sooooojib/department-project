'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { preload } from 'swr';
import { fetcher } from '@/lib/fetcher';

const PREFETCH_MAP: Record<string, string[]> = {
    '/feedback': ['/api/feedback', '/api/users?role=TEACHER', '/api/auth/session'],
    '/counseling': ['/api/auth/session', '/api/counseling'],
    '/dashboard/admin': [
        '/api/admin/users', 
        '/api/courses', 
        '/api/admin/semester-requests', 
        '/api/admin/signup-requests'
    ]
};

export default function Sidebar({ role }: { role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'CR' | null }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

    const publicRoutes = ['/login', '/signup', '/'];
    if (publicRoutes.includes(pathname) || !role) return null;

    const handleLogout = async () => {
        try {
            await signOut({ redirect: true, callbackUrl: '/login' });
        } catch (error) {
            console.error('Logout failed:', error);
            // Force hard redirect if signOut fails
            window.location.href = '/login';
        }
    };

    const baseLinks = [
        { href: `/dashboard/${role.toLowerCase()}`, label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    ];

    const studentLinks = [
        { href: '/attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { href: '/counseling', label: 'Counseling', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { href: '/feedback', label: 'Feedback', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    ];

    const teacherLinks = [
        { href: '/attendance', label: 'Manage Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { href: '/schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: '/counseling', label: 'Counseling Requests', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { href: '/feedback', label: 'Feedback Received', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    ];

    const adminLinks = [
        { href: '/feedback', label: 'All Feedback', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    ];

    const crLinks = [
        ...studentLinks,
        { href: '/schedule', label: 'Schedule Classes', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ];

    let activeLinks = baseLinks;
    if (role === 'STUDENT') activeLinks = [...baseLinks, ...studentLinks];
    if (role === 'TEACHER') activeLinks = [...baseLinks, ...teacherLinks];
    if (role === 'ADMIN') activeLinks = [...baseLinks, ...adminLinks];
    if (role === 'CR') activeLinks = [...baseLinks, ...crLinks];

    // Determine the user label to show at bottom
    const roleLabels: Record<string, string> = {
        STUDENT: 'Student',
        TEACHER: 'Professor',
        ADMIN: 'Admin Manager',
        CR: 'Class Representative'
    };

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${isHovered ? 'w-64 shadow-xl' : 'w-[72px]'}`}
        >
            {/* Logo area */}
            <div className="flex items-center h-20 px-5 shrink-0 border-b border-transparent">
                <div className="flex items-center justify-center min-w-[32px] w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-emerald-500/30 shadow-md">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className={`text-xl font-bold tracking-tight text-slate-800 ml-4 transition-opacity whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    EduPortal
                </span>
            </div>

            {/* Navigation area */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden pt-6">
                <p className={`px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 transition-opacity whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Main Menu</p>
                {activeLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            prefetch={false}
                            onMouseEnter={() => {
                                const endpoints = PREFETCH_MAP[link.href];
                                if (endpoints) {
                                    endpoints.forEach(url => {
                                        try {
                                            const promise = preload(url, fetcher);
                                            // Preload can return a promise that rejects if unauthorized
                                            if (promise && typeof promise.catch === 'function') {
                                                promise.catch(() => {});
                                            }
                                        } catch (e) {
                                            // Ignore sync errors
                                        }
                                    });
                                }
                            }}
                            className={`flex items-center px-2.5 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-emerald-50 text-emerald-800 font-semibold before:absolute before:left-0 before:h-8 before:w-1 before:bg-emerald-500 before:rounded-r-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                }`}
                        >
                            <svg className={`min-w-[20px] w-5 h-5 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                            </svg>
                            <span className={`ml-4 transition-opacity whitespace-nowrap text-[14px] ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Profile & Logout Area */}
            <div className="p-3 border-t border-slate-100 mb-2 shrink-0">
                <div className="flex items-center px-2 py-2 mb-2">
                    <img
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${role}`}
                        alt="Profile"
                        className="min-w-[32px] w-8 h-8 rounded-full bg-slate-100 border border-slate-200 p-0.5 object-cover"
                    />
                    <div className={`ml-4 transition-opacity whitespace-nowrap overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">Current User</p>
                        <p className="text-[11px] font-medium text-slate-400 truncate">{roleLabels[role] || 'User'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2.5 py-2.5 rounded-lg text-slate-500 font-medium transition-all duration-200 hover:bg-slate-50 hover:text-slate-800"
                >
                    <svg className="min-w-[20px] w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className={`ml-4 transition-opacity whitespace-nowrap text-[14px] ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        Log out
                    </span>
                </button>
            </div>
        </aside>
    );
}
