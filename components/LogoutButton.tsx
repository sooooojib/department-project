'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/login' });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="px-6 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors"
        >
            Sign Out
        </button>
    );
}
