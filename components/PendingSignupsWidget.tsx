'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

type SignupRequest = {
    id: string;
    name: string;
    email: string;
    role: string;
    identifier: string;
    status: string;
    createdAt: string;
};

export default function PendingSignupsWidget() {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Request ID
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/signup-requests');
            const data = await res.json();
            if (res.ok) {
                setRequests(data.requests);
            } else {
                setError(data.message || 'Failed to load requests');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setActionLoading(id);
        setError('');
        
        try {
            const res = await fetch(`/api/admin/signup-requests/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setRequests((prev) => prev.filter((req) => req.id !== id));
                if (action === 'approve') {
                    alert('User approved! ' + (data.message.includes('failed') ? 'Warning: Email failed to send.' : 'Email sent successfully.'));
                }
            } else {
                setError(data.message || `Failed to ${action} request`);
            }
        } catch (err) {
            setError(`Error performing ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                    Pending Signup Requests
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {requests.length} Pending
                </span>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            {requests.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                    <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-lg font-medium text-zinc-900">All caught up!</p>
                    <p className="text-sm mt-1">There are no pending signup requests at this time.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Identifier</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900">{req.name}</div>
                                        <div className="text-xs text-zinc-400 mt-1">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">{req.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {req.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 font-mono">{req.identifier}</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={actionLoading === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={actionLoading === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading === req.id ? (
                                                <span className="w-4 h-4 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                            )}
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
