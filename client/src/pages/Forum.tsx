import { useState, useEffect, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Thread } from '../types/thread';
import ThreadCard from '../components/generic/ThreadCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import SkeletonThreadCard from '../components/generic/SkeletonThreadCard';

function Forum() {
    const LIMIT = 20;
    const [threads, setThreads] = useState<Thread[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    const loadThreads = async (currentOffset = 0, append = false) => {
        try {
            const response = await api.get('/api/threads', {
                params: { limit: LIMIT, offset: currentOffset }
            });
            const {threads: newThreads, hasMore: more } = response.data;
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

    useEffect(() => {
        loadThreads(0, false);
        loadUnreadCounts();
    }, []);

    // submit event for creating a new thread
    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        
        try {
            await api.post('/api/threads',
                { title }
            );

            setTitle('');
            setOffset(0);
            loadThreads(0, false); // reset to top after creating
        } catch (err: any) {
            console.error('Error creating thread: ', err);
            setError(err.response?.data?.message || 'Error creating thread');
        }
    };

    const filteredThreads = threads.filter(thread =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
    <div>
        {/* Header */}
        <div className="mb-6">
        <Link
            to="/student-dashboard"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
            ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-blue-700 tracking-tight">Forum</h1>
        </div>

        {/* Create thread form */}
        {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
                type="text"
                placeholder="Start a new thread..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
                >
                + Create Thread
            </button>
        </form>
        )}

        {/* Search bar*/}
        <div className="relative mb-4">
            <input
                type="text"
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
            ? Array.from({ length: 3 }).map((_, i) => (
                <SkeletonThreadCard key={i} />
              ))
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
    </div>
    );
}

export default Forum;