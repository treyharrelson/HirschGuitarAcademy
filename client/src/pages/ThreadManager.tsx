import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { type Thread } from '../types/thread';
import VisibilityToggle from '../components/generic/VisibilityToggle';
import NewThreadModal from '../components/generic/NewThreadModal';
import { useAuth } from '../context/AuthContext';

interface MemberUser {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
}

// TODO: add role guard here once roles are finalized
// e.g. if (user.role !== 'moderator' || user.role !== 'admin') return <AccessDenied />

// returns the path of parent titles leading to this thread
function getThreadPath(thread: Thread, allThreads: Thread[]): string {
    const path: string[] = [];
    let current: Thread | undefined = thread;
    while (current?.parentThreadId != null) {
        const parent = allThreads.find(t => t.id === current!.parentThreadId);
        if (!parent) break;
        path.unshift(parent.title);
        current = parent;
    }
    return path.length > 0 ? path.join(' › ') : 'Root';
}

// gets the thread path, segmented by each subthread from root to leaf
// given the thread who's path we want to find, and the list of all threads
// returns an array of type {id: number; title: string} that gives the path from root to the thread
function getThreadPathSegments(thread: Thread, allThreads: Thread[]): { id: number | null; title: string}[] {
    const segments: { id: number | null; title: string }[] = [];
    let current: Thread | undefined = thread;
    while (current?.parentThreadId != null) {
        const parent = allThreads.find(t => t.id === current!.parentThreadId);
        if (!parent) break;
        segments.unshift({ id: parent.id, title: parent.title });
        current = parent;
    }
    segments.unshift({ id: null, title: 'Root' });
    return segments;
}

// returns all descendant ids of a thread, basically does a BFS
function getDescendantIds(threadId: number, allThreads: Thread[]): Set<number> {
    // stores discovered descendants
    const result = new Set<number>();
    // keeps track of threads that still need to be explored
    const queue = [threadId];
    while (queue.length > 0) {
        // remove first item from the queue
        const id = queue.shift()!;
        for (const t of allThreads) {
            // if a thread is an undiscovered child of current explored, record and queue it
            if (t.parentThreadId === id && !result.has(t.id)) {
                result.add(t.id);
                queue.push(t.id);
            }
        }
    }
    return result;
}

function ThreadManager() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [settingVisibilityId, setSettingVisibilityId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();

    // private members panel state
    const [expandedMembersId, setExpandedMembersId] = useState<number | null>(null);
    const [membersByThread, setMembersByThread] = useState<Record<number, MemberUser[]>>({});
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<MemberUser[]>([]);
    const [memberSearchLoading, setMemberSearchLoading] = useState(false);
    const [addingUserId, setAddingUserId] = useState<number | null>(null);
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // public followers panel
    const [expandedFollowersId, setExpandedFollowersId] = useState<number | null>(null);
    const [followersByThread, setFollowersByThread] = useState<Record<number, MemberUser[]>>({});
    const [removingFollowerId, setRemovingFollowerId] = useState<number | null>(null);

    // move panel
    const [movingThreadId, setMovingThreadId] = useState<number | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<number | 'root' | null>(null);
    const [savingMove, setSavingMove] = useState(false);

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

    const handleThreadCreated = () => loadAllThreads();

    useEffect(() => { loadAllThreads(); }, []);

    // ------- PRIVATE MEMBERS --------------------------------
    // event handler to fetch members when panel is opened
    const handleOpenMembers = async (threadId: number) => {
        // if panel already open, close it
        if (expandedMembersId === threadId) {
            setExpandedMembersId(null);
            return;
        }
        // if opening panel:
        setExpandedMembersId(threadId);
        setExpandedFollowersId(null); // close expanded followers panel (for public)
        setMemberSearch('');
        setMemberSearchResults([]);
        // if members haven't been loaded yet, fetch them (lazy loading)
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
        // if query is empty clear results
        if (!query.trim()) {
            setMemberSearchResults([]);
            return;
        }
        // otherwise, fetch & store search results
        // debouncing avoids spamming the API
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

    // click event handler for add member button
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

    // click event handler for remove member "x" <svg>
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

    // ------- PUBLIC FOLLOWERS --------------------------------------
    // click event handler to fetch followers when panel is opened
    const handleOpenFollowers = async (threadId: number) => {
        // if panel already open, close it
        if (expandedFollowersId === threadId) {
            setExpandedFollowersId(null);
            return;
        }
        // if opening panel
        setExpandedFollowersId(threadId);
        setExpandedMembersId(null);
        // if followers not loaded yet, fetch them
        if (!followersByThread[threadId]) {
            try {
                const res = await api.get(`/api/threads/${threadId}/followers`);
                setFollowersByThread(prev => ({ ...prev, [threadId]: res.data }));
            } catch {
                setError('Failed to load followers.');
            }
        }
    }

    // click event handler to remove a follower
    const handleRemoveFollower = async (threadId: number, userId: number) => {
        setRemovingFollowerId(userId);
        try {
            await api.delete(`/api/threads/${threadId}/followers/${userId}`);
            setFollowersByThread(prev => ({ ...prev, [threadId]: (prev[threadId] || []).filter(u => u.id !== userId) }));
        } catch {
            setError('Failed to remove follower.');
        } finally {
            setRemovingFollowerId(null);
        }
    };

    // ------ MOVE / REPARENT THREADS --------------------------
    // click event for opening panel
    const handleOpenMove = (thread: Thread) => {
        // close panel if already open
        if (movingThreadId === thread.id) { setMovingThreadId(null); return; }
        // open panel
        setMovingThreadId(thread.id);
        setSelectedParentId(thread.parentThreadId ?? 'root');
    };

    // click event for saving a thread move
    const handleSaveMove = async (threadId: number) => {
        setSavingMove(true);
        try {
            const parentThreadId = selectedParentId === 'root' ? null : selectedParentId;
            await api.patch(`/api/threads/${threadId}/parent`, { parentThreadId });
            setThreads(prev => prev.map(t => t.id === threadId ? { ...t, parentThreadId: parentThreadId ?? null } : t));
            setMovingThreadId(null);
        } catch {
            setError('Failed to move thread.');
        } finally {
            setSavingMove(false);
        }
    };

    // ------ VISIBILITY ------------------------
    // event handler for global or private toggles
    const handleSetVisibility = async (threadId: number, visibility: 'public' | 'global' | 'private') => {
        setSettingVisibilityId(threadId);
        try {
            const res = await api.patch(`/api/threads/${threadId}/visibility`, { visibility });
            setThreads(prev =>
                prev.map(t => t.id === threadId ? { ...t, visibility: res.data.visibility } : t)
            );
            if (visibility !== 'private' && expandedMembersId === threadId) setExpandedMembersId(null);
            if (visibility !== 'public' && expandedFollowersId === threadId) setExpandedFollowersId(null);
        } catch {
            setError('Failed to update thread visibility.');
        } finally {
            setSettingVisibilityId(null);
        }
    };

    // ------ DELETE --------------------------
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

    const filtered = threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const globalCount = threads.filter(t => t.visibility === 'global').length;
    const privateCount = threads.filter(t => t.visibility === 'private').length;

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-blue-700 tracking-tight">Thread Manager</h1>
                    {user && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
                        >
                            + New Thread
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <div>
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
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Thread</span>
                        <span className="w-52 text-center">Visibility</span>
                        <span className="w-24 text-center">Members</span>
                        <span className="w-14 text-center">Move</span>
                        <span className="w-16 text-center">Delete</span>
                    </div>

                    {filtered.map(thread => {
                        const pathSegments = getThreadPathSegments(thread, threads);
                        const descendants = movingThreadId === thread.id ? getDescendantIds(thread.id, threads) : new Set<number>();
                        const isExpanded = expandedMembersId === thread.id || expandedFollowersId === thread.id || movingThreadId === thread.id;

                        return (
                            <div key={thread.id} className="flex flex-col">
                                {/* Main row */}
                                <div className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${
                                    thread.visibility === 'private' ? 'border-amber-200 bg-amber-50/30'
                                    : thread.visibility === 'global' ? 'border-blue-200 bg-blue-50/40'
                                    : 'border-gray-100'
                                } ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}>

                                    {/* Title + path + meta */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                to={`/forum/thread/${thread.id}`}
                                                className="font-medium text-gray-800 hover:text-blue-600 truncate text-sm"
                                            >
                                                {thread.title}
                                            </Link>
                                            {thread.visibility === 'global' && (
                                                <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full shrink-0">Global</span>
                                            )}
                                            {thread.visibility === 'private' && (
                                                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full shrink-0">Private</span>
                                            )}
                                            {thread.parentThreadId && (
                                                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full shrink-0">Sub-thread</span>
                                            )}
                                        </div>
                                        {/* Path breadcrumb */}
                                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                            <span className="text-xs text-purple-400">📍</span>
                                            {pathSegments.map((seg, i) => (
                                                <span key={i} className="flex items-center gap-1">
                                                    {i > 0 && <span className="text-xs text-purple-300">›</span>}
                                                    {seg.id === null ? (
                                                        <Link to="/forum" className="text-xs text-purple-400 hover:text-purple-600 font-medium transition-colors">
                                                            {seg.title}
                                                        </Link>
                                                    ) : (
                                                        <Link to={`/forum/thread/${seg.id}`} className="text-xs text-purple-400 hover:text-purple-600 font-medium transition-colors">
                                                            {seg.title}
                                                        </Link>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            by {thread.author?.name ?? 'unknown'} &middot; {new Date(thread.createdAt).toLocaleDateString()}
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

                                    {/* Members / Followers button */}
                                    <div className="w-24 flex justify-center">
                                        {thread.visibility === 'private' ? (
                                            <button
                                                onClick={() => handleOpenMembers(thread.id)}
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                                    expandedMembersId === thread.id
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                }`}
                                            >
                                                {expandedMembersId === thread.id ? 'Close' : '👥 Members'}
                                            </button>
                                        ) : thread.visibility === 'public' ? (
                                            <button
                                                onClick={() => handleOpenFollowers(thread.id)}
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                                    expandedFollowersId === thread.id
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            >
                                                {expandedFollowersId === thread.id ? 'Close' : '👁 Followers'}
                                            </button>
                                        ) : (
                                            <p className="text-xs text-gray-500 font-medium" title="Visible to everyone">All</p>
                                        )}
                                    </div>

                                    {/* Move button */}
                                    <div className="w-14 flex justify-center">
                                        <button
                                            onClick={() => handleOpenMove(thread)}
                                            title="Move thread"
                                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                                                movingThreadId === thread.id
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'
                                            }`}
                                        >
                                            ↕ Move
                                        </button>
                                    </div>

                                    {/* Delete */}
                                    <div className="w-16 flex justify-center">
                                        {confirmDeleteId === thread.id ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDelete(thread.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-semibold">Yes</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md">No</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDeleteId(thread.id)} title="Delete thread" className="text-gray-300 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Private members panel */}
                                {expandedMembersId === thread.id && thread.visibility === 'private' && (
                                    <div className="border border-t-0 border-amber-200 bg-amber-50/60 rounded-b-xl px-4 py-4">
                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Private Thread Members</p>
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
                                                        <button onClick={() => handleRemoveMember(thread.id, user.id)} disabled={removingUserId === user.id} className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
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
                                            {(memberSearchResults.length > 0 || memberSearchLoading) && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg overflow-hidden">
                                                    {memberSearchLoading ? (
                                                        <p className="text-xs text-gray-400 px-3 py-2">Searching…</p>
                                                    ) : (
                                                        memberSearchResults.map(user => {
                                                            const alreadyMember = (membersByThread[thread.id] || []).some(m => m.id === user.id);
                                                            return (
                                                                <button key={user.id} onClick={() => !alreadyMember && handleAddMember(thread.id, user)} disabled={alreadyMember || addingUserId === user.id}
                                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-amber-50 transition-colors text-left ${alreadyMember ? 'opacity-50 cursor-default' : ''}`}>
                                                                    <div>
                                                                        <span className="font-medium text-gray-800">{user.userName}</span>
                                                                        <span className="text-xs text-gray-400 ml-2">{user.firstName} {user.lastName}</span>
                                                                    </div>
                                                                    {alreadyMember ? <span className="text-xs text-gray-400">Already added</span>
                                                                        : addingUserId === user.id ? <span className="text-xs text-amber-600">Adding…</span>
                                                                        : <span className="text-xs text-amber-600 font-semibold">+ Add</span>}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Public followers panel */}
                                {expandedFollowersId === thread.id && thread.visibility === 'public' && (
                                    <div className="border border-t-0 border-green-200 bg-green-50/60 rounded-b-xl px-4 py-4">
                                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Public Thread Followers</p>
                                        <div className="flex flex-col gap-1.5">
                                            {!followersByThread[thread.id] ? (
                                                <p className="text-xs text-gray-400 italic">Loading…</p>
                                            ) : followersByThread[thread.id].length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No followers yet.</p>
                                            ) : (
                                                followersByThread[thread.id].map(user => (
                                                    <div key={user.id} className="flex items-center justify-between bg-white border border-green-100 rounded-lg px-3 py-1.5">
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-800">{user.userName}</span>
                                                            <span className="text-xs text-gray-400 ml-2">{user.firstName} {user.lastName}</span>
                                                        </div>
                                                        <button onClick={() => handleRemoveFollower(thread.id, user.id)} disabled={removingFollowerId === user.id} title="Remove follower" className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Move / reparent panel */}
                                {movingThreadId === thread.id && (
                                    <div className="border border-t-0 border-indigo-200 bg-indigo-50/60 rounded-b-xl px-4 py-4">
                                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Move Thread</p>
                                        <p className="text-xs text-indigo-500 mb-3">Current location: <span className="font-medium">{pathSegments.map(s => s.title).join(' › ')}</span></p>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={selectedParentId === null ? 'root' : selectedParentId}
                                                onChange={(e) => setSelectedParentId(e.target.value === 'root' ? 'root' : parseInt(e.target.value))}
                                                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            >
                                                <option value="root">📁 Root (no parent)</option>
                                                {threads
                                                    .filter(t => t.id !== thread.id && !descendants.has(t.id))
                                                    .map(t => (
                                                        <option key={t.id} value={t.id}>
                                                            {getThreadPath(t, threads) === 'Root' ? '' : getThreadPath(t, threads) + ' › '}{t.title}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            <button
                                                onClick={() => handleSaveMove(thread.id)}
                                                disabled={savingMove}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                {savingMove ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setMovingThreadId(null)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <NewThreadModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleThreadCreated}
                defaultParentId={null}
            />
        </div>
    );
}

export default ThreadManager;