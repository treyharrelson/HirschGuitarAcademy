import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { type Thread } from '../types/thread';
import VisibilityToggle from '../components/generic/VisibilityToggle';

interface MemberUser {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
}

// TODO: add role guard here once roles are finalized
// e.g. if (user.role !== 'moderator' || user.role !== 'admin') return <AccessDenied />

function ThreadManager() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [settingVisibilityId, setSettingVisibilityId] = useState<number | null>(null);
    // private members panel state
    const [expandedMembersId, setExpandedMembersId] = useState<number | null>(null);
    const [membersByThread, setMembersByThread] = useState<Record<number, MemberUser[]>>({});
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<MemberUser[]>([]);
    const [memberSearchLoading, setMemberSearchLoading] = useState(false);
    const [addingUserId, setAddingUserId] = useState<number | null>(null);
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // fetches all threads
    const loadAllThreads = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/threads', { params: { limit: 500, offset: 0 } });
            setThreads(res.data.threads);
        } catch {
            setError('Failed to load threads.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllThreads();
    }, []);

    // event handler to fetch members when panel is opened
    const handleOpenMembers = async (threadId: number) => {
        if (expandedMembersId === threadId) {
            setExpandedMembersId(null);
            return;
        }
        setExpandedMembersId(threadId);
        setMemberSearch('');
        setMemberSearchResults([]);
        // lazy loading
        if (!membersByThread[threadId]) {
            await refreshMembers(threadId);
        }
    };

    // gets members from the backend
    const refreshMembers = async (threadId: number) => {
        try {
            const res = await api.get(`/api/threads/${threadId}/members`);
            setMembersByThread(prev => ({ ...prev, [threadId]: res.data }));
        } catch {
            setError('Failed to load thread members.');
        }
    };

    // Debounced user search for adding members
    const handleMemberSearchChange = (query: string) => {
        setMemberSearch(query);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!query.trim()) {
            setMemberSearchResults([]);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            setMemberSearchLoading(true);
            try {
                const res = await api.get('/api/users', { params: { search: query } });
                setMemberSearchResults(res.data);
            } catch {
                setError('Failed to search users.');
            } finally {
                setMemberSearchLoading(false);
            }
        }, 300);
    };

    const handleAddMember = async (threadId: number, user: MemberUser) => {
        setAddingUserId(user.id);
        try {
            await api.post(`/api/threads/${threadId}/members`, { userId: user.id });
            // add the user to the local member list
            setMembersByThread(prev => ({
                ...prev,
                [threadId]: [...(prev[threadId] || []), user]
            }))
            setMemberSearch('');
            setMemberSearchResults([]);
        } catch {
            setError('Failed to add member.');
        } finally {
            setAddingUserId(null);
        }
    };

    const handleRemoveMember = async (threadId: number, userId: number) => {
        setRemovingUserId(userId);
        try {
            await api.delete(`/api/threads/${threadId}/members/${userId}`);
            setMembersByThread(prev => ({
                ...prev,
                [threadId]: (prev[threadId] || []).filter(u => u.id !== userId)
            }));
        } catch {
            setError('Failed to remove member.');
        } finally {
            setRemovingUserId(null);
        }
    };

    // event handler for global or private toggles
    const handleSetVisibility = async (threadId: number, visibility: 'public' | 'global' | 'private') => {
    setSettingVisibilityId(threadId);
    try {
        const res = await api.patch(`/api/threads/${threadId}/visibility`, { visibility });
        setThreads(prev =>
            prev.map(t => t.id === threadId ? { ...t, visibility: res.data.visibility } : t)
        );
        if (visibility !== 'private' && expandedMembersId === threadId) {
            setExpandedMembersId(null);
        }
    } catch {
        setError('Failed to update thread visibility.');
    } finally {
        setSettingVisibilityId(null);
    }
};

    // event handler for delete button being pressed on a thread
    const handleDelete = async (threadId: number) => {
        try {
            await api.delete(`/api/threads/${threadId}`);
            setThreads(prev => prev.filter(t => t.id !== threadId));
            setConfirmDeleteId(null);
        } catch {
            setError('Failed to delete thread.');
        }
    };

    const filtered = threads.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const globalCount = threads.filter(t => t.visibility === 'global').length;
    const privateCount = threads.filter(t => t.visibility === 'private').length;

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/home"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
                >
                    ← Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-700 tracking-tight">Thread Manager</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {threads.length} total &middot; {globalCount} global &middot; {privateCount} private
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex justify-between">
                    <span>{error}</span>
                    <button className="underline text-xs ml-4" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-5">
                <input
                    type="text"
                    placeholder="Search threads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-200 rounded-full px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </div>

            {/* Thread list */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No threads found.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Thread</span>
                        <span className="w-52 text-center">Visibility</span>
                        <span className="w-24 text-center">Members</span>
                        <span className="w-16 text-center">Delete</span>
                    </div>

                    {filtered.map(thread => (
                        <div key={thread.id} className="flex flex-col">
                            {/* Main row */}
                            <div
                                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${
                                    thread.visibility === 'private'
                                        ? 'border-amber-200 bg-amber-50/30'
                                        : thread.visibility === 'global'
                                        ? 'border-blue-200 bg-blue-50/40'
                                        : 'border-gray-100'
                                } ${expandedMembersId === thread.id ? 'rounded-b-none border-b-0' : ''}`}
                            >
                                {/* Title + meta */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            to={`/forum/thread/${thread.id}`}
                                            className="font-medium text-gray-800 hover:text-blue-600 truncate text-sm"
                                        >
                                            {thread.title}
                                        </Link>
                                        {thread.visibility === 'global' && (
                                            <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                Global
                                            </span>
                                        )}
                                        {thread.visibility === 'private' && (
                                            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                Private
                                            </span>
                                        )}
                                        {thread.parentThreadId && (
                                            <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                Sub-thread
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        by {thread.author?.userName ?? 'unknown'} &middot; {new Date(thread.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Visibility control */}
                                <div className="w-52 flex justify-center">
                                    <VisibilityToggle
                                        value={thread.visibility}
                                        onChange={(v) => !settingVisibilityId && handleSetVisibility(thread.id, v)}
                                        disabled={settingVisibilityId === thread.id}
                                    />
                                </div>

                                {/* Manage Members button */}
                                <div className="w-24 flex justify-center">
                                    {thread.visibility === 'private' ? (
                                        <button
                                            onClick={() => handleOpenMembers(thread.id)}
                                            title="Manage members"
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                                expandedMembersId === thread.id
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            }`}
                                        >
                                            {expandedMembersId === thread.id ? 'Close' : '👥 Members'}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-300">—</span>
                                    )}
                                </div>

                                {/* Delete */}
                                <div className="w-16 flex justify-center">
                                    {confirmDeleteId === thread.id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDelete(thread.id)}
                                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-semibold"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(thread.id)}
                                            title="Delete thread"
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Inline member management panel */}
                            {expandedMembersId === thread.id && thread.visibility==='private' && (
                                <div className="border border-t-0 border-amber-200 bg-amber-50/60 rounded-b-xl px-4 py-4">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                                        Private Thread Members
                                    </p>

                                    {/* Current members list */}
                                    <div className="flex flex-col gap-1.5 mb-4">
                                        {(membersByThread[thread.id] || []).length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">No members added yet.</p>
                                        ) : (
                                            (membersByThread[thread.id] || []).map(user => (
                                                <div key={user.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-1.5">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-800">{user.userName}</span>
                                                        <span className="text-xs text-gray-400 ml-2">{user.firstName} {user.lastName}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMember(thread.id, user.id)}
                                                        disabled={removingUserId === user.id}
                                                        title="Remove from thread"
                                                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add member search */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search users to add..."
                                            value={memberSearch}
                                            onChange={(e) => handleMemberSearchChange(e.target.value)}
                                            className="w-full border border-amber-200 rounded-lg px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        />
                                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                        </svg>

                                        {/* Search results dropdown */}
                                        {(memberSearchResults.length > 0 || memberSearchLoading) && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg overflow-hidden">
                                                {memberSearchLoading ? (
                                                    <p className="text-xs text-gray-400 px-3 py-2">Searching…</p>
                                                ) : (
                                                    memberSearchResults.map(user => {
                                                        const alreadyMember = (membersByThread[thread.id] || []).some(m => m.id === user.id);
                                                        return (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => !alreadyMember && handleAddMember(thread.id, user)}
                                                                disabled={alreadyMember || addingUserId === user.id}
                                                                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-amber-50 transition-colors text-left ${
                                                                    alreadyMember ? 'opacity-50 cursor-default' : ''
                                                                }`}
                                                            >
                                                                <div>
                                                                    <span className="font-medium text-gray-800">{user.userName}</span>
                                                                    <span className="text-xs text-gray-400 ml-2">{user.firstName} {user.lastName}</span>
                                                                </div>
                                                                {alreadyMember ? (
                                                                    <span className="text-xs text-gray-400">Already added</span>
                                                                ) : addingUserId === user.id ? (
                                                                    <span className="text-xs text-amber-600">Adding…</span>
                                                                ) : (
                                                                    <span className="text-xs text-amber-600 font-semibold">+ Add</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ThreadManager;