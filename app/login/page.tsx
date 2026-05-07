'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!identifier || !password) {
            setError('Fields are required');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Login failed');
                setLoading(false);
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            if (!router) setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-8 sm:p-12 md:p-16"
            style={{ backgroundColor: '#A4ADB4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* Animated card wrapper */}
            <div
                className="w-full flex flex-col md:flex-row shadow-2xl relative overflow-hidden"
                style={{ 
                    maxWidth: '900px', // Forces smaller box in center
                    minHeight: '600px',
                    borderRadius: '2.5rem',
                    animation: 'slideUp 0.5s ease forwards',
                    background: 'linear-gradient(135deg, #f1f2f1 0%, #f6f5ea 50%, #f0dfa1 100%)'
                }}
            >
                {/* LEFT PANEL — form and brand */}
                <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col relative z-10">
                    {/* Brand logo + name */}
                    <div 
                        className="flex items-center space-x-2 border border-gray-300 rounded-full px-5 py-2 mb-auto"
                        style={{ width: 'max-content' }}
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        <span className="text-gray-700 font-medium text-sm tracking-wide">EduPortal</span>
                    </div>

                    <div className="flex-grow flex flex-col justify-center py-10 w-full mx-auto" style={{ maxWidth: '320px' }}>
                        <div className="mb-8 text-center">
                            <h2
                                className="text-3xl font-semibold text-gray-900 tracking-tight"
                            >
                                Log in to Portal
                            </h2>
                            <p className="text-gray-500 text-sm mt-2 font-medium">
                                Welcome back! Enter your details.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 w-full">
                            {error && (
                                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center">
                                    {error}
                                </div>
                            )}

                            {/* Email / ID field */}
                            <div className="space-y-1.5 w-full">
                                <label className="block text-xs font-semibold text-gray-500 ml-3">
                                    Email, Student ID, or Phone
                                </label>
                                <div className="relative flex items-center w-full">
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="text"
                                        required
                                        placeholder="Enter your identifier"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-5 rounded-full text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 border border-white focus:border-gray-400"
                                        style={{ height: '52px', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div className="space-y-1.5 w-full">
                                <label className="block text-xs font-semibold text-gray-500 ml-3">
                                    Password
                                </label>
                                <div className="relative flex items-center w-full">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-5 rounded-full text-sm text-gray-900 placeholder-gray-400 tracking-widest outline-none transition-all duration-200 border border-white focus:border-gray-400"
                                        style={{ height: '52px', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                                    />
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="pt-4 w-full">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full text-gray-900 font-bold transition-all duration-200"
                                    style={{
                                        height: '52px',
                                        background: loading ? '#fce28b' : '#FCD043',
                                        borderRadius: '9999px',
                                        boxShadow: '0 8px 20px rgba(252, 208, 67, 0.3)',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {loading ? 'Logging in...' : 'Log In'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-auto flex gap-1 items-center justify-start text-xs text-gray-500 w-full pt-6">
                        <span>Don&rsquo;t have an account?</span>
                        <Link href="/signup" className="font-semibold text-gray-800 underline decoration-1 underline-offset-4 hover:text-gray-900">
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* RIGHT PANEL — image container */}
                <div 
                    className="hidden md:flex w-full md:w-1/2 relative flex-col justify-center items-center bg-white shadow-inner m-3 ml-0 "
                    style={{ borderRadius: '2rem' }}
                >
                    {/* Desk Illustration centered inside */}
                    <img
                        src="/desk_illustration.png"
                        alt="Desk Setup Illustration"
                        className="w-[85%] h-auto object-contain z-10 mix-blend-multiply"
                    />

                    {/* Tagline overlay underneath illustration */}
                    <p className="mt-8 mb-4 text-gray-500 text-sm xl:text-base text-center leading-relaxed max-w-[260px] z-10 font-medium">
                        Your academic journey, organized in one place.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
