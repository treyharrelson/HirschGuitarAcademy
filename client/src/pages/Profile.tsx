import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { UserInfo } from '../types/user';

type RoleLink = {
    label: string;
    path: string;
    icon: React.ReactNode;
}



export const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId?: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const targetUserId = userId || user?.id;

    const [profileUser, setProfileUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editing state
    const isSelf = user?.id === parseInt(targetUserId as string);
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editPrivate, setEditPrivate] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!targetUserId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/api/user/${targetUserId}`);
                const u = response.data.user;
                setProfileUser({
                    id: u.id,
                    name: (u.name || 'Unknown'),
                    email: u.email,
                    role: u.role,
                    bio: u.bio,
                    privacy: u.private,
                    dateCreated: new Date(u.createdAt)
                });
                setEditBio(u.bio || '');
                setEditPrivate(u.private || false);
            } catch (err: any) {
                if (err.response && err.response.status === 403) {
                    setError('This profile is private.');
                } else {
                    setError('Failed to load profile.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchProfile();
        }
    }, [targetUserId, authLoading]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/api/user/${targetUserId}`, {
                bio: editBio,
                private: editPrivate
            });
            if (profileUser) {
                setProfileUser({ ...profileUser, bio: editBio, privacy: editPrivate });
            }
            setIsEditing(false);
        } catch (err) {
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) return <div className="text-center mt-10">Loading auth...</div>;
    if (!user) {
        navigate('/');
        return null;
    }

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-8">


                <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-24 bg-gray-200 rounded"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{error}</h3>
                            </div>
                        ) : profileUser ? (
                            <div className="max-w-3xl">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-4xl shadow-inner">
                                            {(profileUser?.name?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                                {profileUser?.name || 'Unknown User'}
                                            </h1>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                                    {profileUser?.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isSelf && !isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">About Me</label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-y"
                                                rows={5}
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                placeholder="Tell us a little bit about yourself..."
                                            />
                                        </div>

                                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900">Private Profile</h4>
                                                <p className="text-sm text-gray-500">Only you will be able to see your profile.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={editPrivate}
                                                    onChange={(e) => setEditPrivate(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditBio(profileUser?.bio || '');
                                                    setEditPrivate(profileUser?.privacy || false);
                                                }}
                                                disabled={saving}
                                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
                                            {profileUser.bio ? (
                                                <div className="prose prose-blue max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                                    {profileUser.bio.split('\n').map((paragraph: string, i: number) => (
                                                        <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 italic bg-gray-50 p-6 rounded-xl border border-gray-100 border-dashed">No biography provided yet.</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-500 mb-1">Member Since</p>
                                                <p className="font-medium text-gray-900">
                                                    {profileUser?.dateCreated ? new Date(profileUser.dateCreated).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : 'Unknown'}
                                                </p>
                                            </div>
                                            {isSelf && (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-sm text-gray-500 mb-1">Visibility</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${profileUser?.privacy ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                        <p className="font-medium text-gray-900">
                                                            {profileUser?.privacy ? 'Private' : 'Public'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
