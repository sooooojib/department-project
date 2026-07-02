'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { Users, Shield, GraduationCap, UserCircle, Plus, Trash2, X, BookOpen } from 'lucide-react';
import PendingSignupsWidget from '@/components/PendingSignupsWidget';
import SemesterRequestsWidget from '@/components/SemesterRequestsWidget';

interface UserData {
    id: string;
    name: string;
    role: string;
    identifier: string;
    createdAt: string;
    courses?: { id: string; name: string; code: string }[];
}

interface CourseData {
    id: string;
    code: string;
    name: string;
    type?: string;
    year?: number;
    semester?: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Add user modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIdentifier, setNewIdentifier] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('STUDENT');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Course management state
    const [allCourses, setAllCourses] = useState<CourseData[]>([]);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<UserData | null>(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [isSavingCourses, setIsSavingCourses] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    router.push('/login');
                    return;
                }
                // Try to get the actual error message from the server
                let errMsg = `Server error (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData?.message) errMsg = errData.message;
                } catch {}
                throw new Error(errMsg);
            }
            const data = await res.json();
            setUsers(data.users);
        } catch (err: any) {
            setError(err.message || 'Could not load user data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setAllCourses(data.courses);
            }
        } catch (err) {
            console.error('Failed to fetch courses', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAllCourses();
    }, [router]);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Shield className="w-4 h-4 text-purple-600" />;
            case 'TEACHER': return <UserCircle className="w-4 h-4 text-blue-600" />;
            case 'CR': return <Users className="w-4 h-4 text-orange-600" />;
            default: return <GraduationCap className="w-4 h-4 text-emerald-600" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'TEACHER': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'CR': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    identifier: newIdentifier,
                    password: newPassword,
                    role: newRole,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create user');
            }

            setIsAddModalOpen(false);
            setNewName('');
            setNewIdentifier('');
            setNewPassword('');
            setNewRole('STUDENT');
            fetchUsers();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openCourseModal = (teacher: UserData) => {
        setSelectedTeacher(teacher);
        setSelectedCourseIds(teacher.courses?.map(c => c.id) || []);
        setIsCourseModalOpen(true);
    };

    const handleSaveCourses = async () => {
        if (!selectedTeacher) return;
        setIsSavingCourses(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedTeacher.id}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseIds: selectedCourseIds })
            });
            if (res.ok) {
                setIsCourseModalOpen(false);
                fetchUsers();
            } else {
                alert('Failed to save courses');
            }
        } catch (err) {
            alert('Error saving courses');
        } finally {
            setIsSavingCourses(false);
        }
    };

    const groupedCourses = allCourses.reduce((acc, course) => {
        const key = `Year ${course.year ?? '?'} - Semester ${course.semester ?? '?'}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(course);
        return acc;
    }, {} as Record<string, CourseData[]>);

    const sortedGroupKeys = Object.keys(groupedCourses).sort();

    const renderUserTable = (title: string, data: UserData[], showCourses: boolean = false) => (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">{title} <span className="ml-2 text-sm text-zinc-500 font-normal bg-zinc-100 px-2 py-0.5 rounded-full">{data.length}</span></h2>
            </div>
            {data.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No {title.toLowerCase()} found in the system.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Identifier / Username</th>
                                {showCourses && <th className="px-6 py-4">Assigned Courses</th>}
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {data.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-900">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                                        {user.identifier}
                                    </td>
                                    {showCourses && (
                                        <td className="px-6 py-4">
                                            {user.role === 'TEACHER' ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-zinc-600 font-medium">
                                                        {user.courses?.length || 0} course{(user.courses?.length !== 1) ? 's' : ''}
                                                    </span>
                                                    <button
                                                        onClick={() => openCourseModal(user)}
                                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 rounded border border-zinc-200 transition-colors"
                                                    >
                                                        <BookOpen className="w-3 h-3" />
                                                        Manage
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
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

    return (
        <div className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans relative">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-emerald-600" />
                            Administrator Dashboard
                        </h1>
                        <p className="text-zinc-500 mt-1 text-sm">Manage system users, access permissions, and course assignments.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-zinc-100 rounded-lg text-sm font-medium text-zinc-700">
                            Total Users: {loading ? '...' : users.length}
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add User
                        </button>
                        <LogoutButton />
                    </div>
                </div>

                {/* Pending Signups Widget */}
                <PendingSignupsWidget />

                {/* Semester Requests Widget */}
                <SemesterRequestsWidget />

                {/* Users Table Sections */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-12 text-center text-zinc-500">
                        Loading users...
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-12 text-center space-y-3">
                        <p className="text-red-500 font-medium text-sm">{error}</p>
                        <button
                            onClick={fetchUsers}
                            className="text-sm px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {renderUserTable('Teachers', users.filter(u => u.role === 'TEACHER'), true)}
                        {renderUserTable('Students', users.filter(u => u.role === 'STUDENT'), false)}
                        {renderUserTable('Class Representatives (CRs)', users.filter(u => u.role === 'CR'), false)}
                    </>
                )}
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-900">Create New User</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700">Identifier (Email or ID)</label>
                                <input
                                    type="text"
                                    required
                                    value={newIdentifier}
                                    onChange={(e) => setNewIdentifier(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                    placeholder="johndoe@example.com or 2024CS01"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700">Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm bg-white"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="CR">Class Representative (CR)</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Courses Modal */}
            {isCourseModalOpen && selectedTeacher && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setIsCourseModalOpen(false); }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ width: '100%', maxWidth: '600px', maxHeight: '78vh' }}
                    >
                        {/* Fixed Header */}
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-900">Assign Courses</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    {selectedTeacher.name} · <span className="font-semibold text-emerald-600">{selectedCourseIds.length} selected</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCourseModalOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors flex-shrink-0 ml-3 mt-0.5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div
                            className="overflow-y-auto flex-1 px-5 py-4 space-y-5"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {sortedGroupKeys.map(group => (
                                <div key={group}>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{group}</p>
                                    <div className="space-y-1.5">
                                        {groupedCourses[group].map((course: CourseData) => {
                                            const isChecked = selectedCourseIds.includes(course.id);
                                            return (
                                                <label
                                                    key={course.id}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                                                        isChecked
                                                            ? 'bg-emerald-50 border-emerald-200'
                                                            : 'bg-white hover:bg-zinc-50'
                                                    }`}
                                                    style={{ borderColor: isChecked ? undefined : '#ebebeb' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedCourseIds(prev => [...prev, course.id]);
                                                            } else {
                                                                setSelectedCourseIds(prev => prev.filter(id => id !== course.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-emerald-600 border-zinc-300 flex-shrink-0 focus:ring-emerald-500 focus:ring-offset-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-medium ${isChecked ? 'text-emerald-900' : 'text-zinc-800'}`}>
                                                                {course.code}
                                                            </span>
                                                            {course.type && (
                                                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${
                                                                    course.type === 'Major'
                                                                        ? 'bg-blue-50 text-blue-500'
                                                                        : 'bg-amber-50 text-amber-500'
                                                                }`}>
                                                                    {course.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs truncate mt-0.5 ${isChecked ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                                            {course.name}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Footer */}
                        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between flex-shrink-0" style={{ minHeight: '64px' }}>
                            <p className="text-xs text-zinc-500">
                                <span className="font-semibold text-zinc-700">{selectedCourseIds.length}</span> of {allCourses.length} courses selected
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsCourseModalOpen(false)}
                                    className="px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-full border border-zinc-200 transition-colors"
                                    disabled={isSavingCourses}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCourses}
                                    disabled={isSavingCourses}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSavingCourses ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
