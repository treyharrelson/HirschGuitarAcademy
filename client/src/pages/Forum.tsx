import { useState, useEffect, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Thread } from '../types/thread';
import ThreadCard from '../components/generic/ThreadCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import SkeletonThreadCard from '../components/generic/SkeletonThreadCard';
import NewThreadModal from '../components/generic/NewThreadModal';
import Sidebar, { SidebarLink } from '../components/generic/Sidebar';

function Forum() {
    const LIMIT = 20;
    const [threads, setThreads] = useState<Thread[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState<string>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const loadThreads = async (currentOffset = 0, append = false) => {
        try {
            const response = await api.get('/api/threads', {
                params: { limit: LIMIT, offset: currentOffset }
            });
            const { threads: newThreads = [], hasMore: more = false } = response.data || {};
            setThreads(prev => append ? [...prev, ...newThreads] : newThreads);
            setHasMore(more);
        } catch (err) {
            setError('Error loading threads');
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCounts = async () => {
        try {
            const res = await api.get('/api/threads/unread-counts');
            setUnreadCounts(res.data);
        } catch {
            // silently skip
        }
    }

    // submit event for the load more button
    const handleLoadMore = async () => {
        setLoadingMore(true);
        const newOffset = offset + LIMIT;
        await loadThreads(newOffset, true);
        setOffset(newOffset);
        setLoadingMore(false);
    }

    const handleThreadCreated = () => {
        setOffset(0);
        loadThreads(0, false);
    };

    useEffect(() => {
        loadThreads(0, false);
        loadUnreadCounts();
    }, []);

    const filteredThreads = (threads || []).filter(thread =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/home"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4">
                    ← Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-blue-700 tracking-tight">Forum</h1>
                    {user && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
                        >
                            + New Thread
                        </button>
                    )}
                </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
                <input
                    type="text"
                    maxLength={256}
                    placeholder="Search threads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-200 rounded-full px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Thread list */}
            <div className="flex flex-col gap-3">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonThreadCard key={i} />)
                    : filteredThreads.map(thread => (
                        <ThreadCard
                            key={thread.id}
                            thread={thread}
                            unreadCount={unreadCounts[thread.id]}
                        />
                    ))
                }
            </div>

            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full mt-4 py-2 text-sm text-blue-600 font-semibold border border-blue-200 rounded-full hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                    {loadingMore ? 'Loading...' : 'Load More'}
                </button>
            )}

            <NewThreadModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleThreadCreated}
            />
        </div>
    );
}

export default Forum;