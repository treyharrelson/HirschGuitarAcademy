import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { type Thread } from '../types/thread';

interface FollowEntry {
    id: number;
    threadId: number;
    createdAt: string;
    thread: Thread;
    unreadCount?: number;
}

function ThreadFollows() {
    const [follows, setFollows] = useState<FollowEntry[]>([]);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const res = await api.get('/api/threads/follows');
            setFollows(res.data);
        } catch {
            setError('Error loading follows');
        }
    };

    // Submit event for unfollow buttons
    const handleUnfollow = async (threadId: number) => {
        try { 
            await api.delete(`/api/threads/${threadId}/follow`);
            setFollows(prev => prev.filter(s => s.threadId !== threadId));
        } catch {
            setError('Error unfollowing');
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div>
            <div className="mb-6">
                <Link to="/home" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-blue-700 tracking-tight">My Followed Threads</h1>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {follows.length === 0 ? (
                <p className="text-gray-500">
                    No follows yet.{' '}
                    <Link to="/forum" className="text-blue-600 hover:underline">Browse the forum</Link> to follow threads.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {follows.map(follow => (
                        <div
                            key={follow.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-all"
                        >
                            <Link to={`/forum/thread/${follow.threadId}`} className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-blue-700 truncate">{follow.thread.title}</h3>
                                    {follow.unreadCount !== undefined && follow.unreadCount > 0 && (
                                        <span className="flex-shrink-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                            {follow.unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {follow.thread.author && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        by {follow.thread.author.userName} · followed {new Date(follow.createdAt).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                            <button
                                onClick={() => handleUnfollow(follow.threadId)}
                                className="ml-4 flex-shrink-0 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-full transition-all"
                            >
                                Unfollow
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ThreadFollows;