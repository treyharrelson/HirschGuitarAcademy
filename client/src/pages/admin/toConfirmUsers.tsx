import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import type { TempUser } from '../../types/user';
import UserConfirmCard from '../../components/admin/UserConfirmCard';

const ToConfirmUsers: React.FC = () => {
    const [users, setUsers] = useState<TempUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const getTempUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/user/tempUsers');
            setUsers(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending users.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTempUsers();
    }, []);

    const handleConfirmUser = async (user: TempUser, selectedRole: 'student' | 'instructor' | 'moderator') => {
        setProcessingId(user.id);
        try {
            await api.post(`/confirm/${user.id}`, { role: selectedRole });
            setUsers(prev => prev.filter(u => u.emailConfirmed ? u.id !== user.id : false));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to confirm user.');
        } finally {
            setProcessingId(null);
        }
    }

    const handleDenyUser = async (user: TempUser) => {
        setProcessingId(user.id);
        try {
            await api.delete(`/confirm/${user.id}`);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to deny user.');
        } finally {
            setProcessingId(null);
        }
    }

    const filteredUsers = users.filter(u => 
        (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-700 tracking-tight">User Confirmations</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {users.length} registration{users.length !== 1 ? 's' : ''} pending review
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </span>
                    <button className="underline text-xs opacity-70 hover:opacity-100 font-semibold" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </div>

            {/* User List */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-semibold">No pending users found</p>
                    <p className="text-gray-400 text-sm mt-1">All registrations have been processed.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Headers */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        <span>User Information</span>
                        <span className="text-center">Assign Role</span>
                        <span className="text-right">Review Action</span>
                    </div>
                    {filteredUsers.map(user => (
                        <UserConfirmCard
                            key={user.id}
                            user={user}
                            onConfirm={handleConfirmUser}
                            onDeny={handleDenyUser}
                            isProcessing={processingId === user.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ToConfirmUsers;
