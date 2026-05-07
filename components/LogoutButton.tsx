'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh(); // Force a refresh to update client state and clear cached redirects
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors"
        >
            Sign Out
        </button>
    );
}
