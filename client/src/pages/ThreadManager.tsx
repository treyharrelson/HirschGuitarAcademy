import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { type Thread } from '../types/thread';

// TODO: add role guard here once roles are finalized
// e.g. if (user.role !== 'moderator' || user.role !== 'admin') return <AccessDenied />

function ThreadManager() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

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

    // event handler for globalthread toggle being pressed on a thread
    const handleToggleGlobal = async (threadId: number) => {
        setTogglingId(threadId);
        try {
            // call api to update isGlobalFeed for the thread
            const res = await api.patch(`/api/threads/${threadId}/global`);
            // update React state with the updated thread
            setThreads(prev =>
                prev.map(t => t.id === threadId 
                    ? {...t, isGlobalFeed: res.data.isGlobalFeed} 
                    : t
                )
            )
        } catch {
            setError('Failed to update thread.');
        } finally {
            setTogglingId(null);
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

    const globalCount = threads.filter(t => t.isGlobalFeed).length;

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
                            {threads.length} total threads &middot; {globalCount} in global feed
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
                //if loading show skeletong cards
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                // if not loading but search query has no results
                <p className="text-center text-gray-400 py-12">No threads found.</p>
            ) : (
                // if not loading and not empty, show threads
                <div className="flex flex-col gap-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Thread</span>
                        <span className="w-28 text-center">Global Feed</span>
                        <span className="w-16 text-center">Delete</span>
                    </div>

                    {filtered.map(thread => (
                        <div
                            key={thread.id}
                            className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${
                                thread.isGlobalFeed ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'
                            }`}
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
                                    {thread.isGlobalFeed && (
                                        <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                            Global
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

                            {/* Toggle global feed */}
                            <div className="w-28 flex justify-center">
                                <button
                                    onClick={() => handleToggleGlobal(thread.id)}
                                    disabled={togglingId === thread.id}
                                    title={thread.isGlobalFeed ? 'Remove from global feed' : 'Add to global feed'}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                        thread.isGlobalFeed ? 'bg-blue-500' : 'bg-gray-200'
                                    } ${togglingId === thread.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        thread.isGlobalFeed ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default ThreadManager;