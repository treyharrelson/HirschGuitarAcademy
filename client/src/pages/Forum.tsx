import { useState, useEffect, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Thread } from '../types/thread';
import ThreadCard from '../components/generic/ThreadCard';
import SkeletonThreadCard from '../components/generic/SkeletonThreadCard';
import NewThreadModal from '../components/generic/NewThreadModal';
import Sidebar, { SidebarLink } from '../components/generic/Sidebar';
import UserBadge from '../components/UserBadge';

interface BreadcrumbItem {
    id: number | null;
    title: string;
}

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
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, title: 'Forum' }]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const loadThreads = async () => {
        try {
            const response = await api.get('/api/threads', { params: { limit: 500, offset: 0 } });
            setThreads(response.data.threads);
        } catch {
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

    const handleThreadCreated = () => loadThreads();

    useEffect(() => {
        loadThreads();
        loadUnreadCounts();
    }, []);

    const hasChildren = (threadId: number) =>
        threads.some(t => t.parentThreadId === threadId);

    const currentThreads = threads.filter(t => {
        const matchesFolder = (t.parentThreadId ?? null) === currentFolderId;
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    });

    const enterFolder = (thread: Thread) => {
        setBreadcrumb(prev => [...prev, { id: thread.id, title: thread.title }]);
        setCurrentFolderId(thread.id);
        setSearchQuery('');
    };

    const navigateToBreadcrumb = (index: number) => {
        const crumb = breadcrumb[index];
        setBreadcrumb(prev => prev.slice(0, index + 1));
        setCurrentFolderId(crumb.id);
    };

    const currentFolder = threads.find(t => t.id === currentFolderId) ?? null;


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

            {/* Breadcrumb folder nav */}
            <div className="flex items-center gap-1 mb-4 flex-wrap">
                {breadcrumb.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-gray-400 text-sm">/</span>}
                        <button
                            onClick={() => navigateToBreadcrumb(i)}
                            className={`text-sm font-medium px-2 py-0.5 rounded-lg transition-colors ${i === breadcrumb.length - 1
                                    ? 'text-blue-700 bg-blue-50 cursor-default'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                                }`}
                            disabled={i === breadcrumb.length - 1}
                        >
                            {i === 0 ? '📁 ' : '📂 '}{crumb.title}
                        </button>
                    </span>
                ))}
            </div>

            {/* If inside a folder, show a link to open the thread itself */}
            {currentFolder && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-blue-700 font-medium">📌 {currentFolder.title}</p>
                    <Link
                        to={`/forum/thread/${currentFolder.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                        Open thread →
                    </Link>
                </div>
            )}

            {/* Search bar */}
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
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Thread/folder list */}
            <div className="flex flex-col gap-3">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonThreadCard key={i} />)
                    : currentThreads.length === 0
                        ? <p className="text-center text-gray-400 py-12">No threads here.</p>
                        : currentThreads.map(thread => {
                            const isFolder = hasChildren(thread.id);
                            const unread = unreadCounts[thread.id];

                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => {
                                        if (!isFolder) navigate(`/forum/thread/${thread.id}`);
                                        if (isFolder) enterFolder(thread);
                                    }}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all cursor-pointer hover:shadow-md hover:border-blue-200"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-xl shrink-0">{isFolder ? '📁' : '💬'}</span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-lg font-semibold text-blue-700 truncate">
                                                        {thread.title}
                                                    </span>
                                                    {thread.visibility === 'global' && (
                                                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                            Global
                                                        </span>
                                                    )}
                                                    {thread.visibility === 'private' && (
                                                        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                            🔒 Private
                                                        </span>
                                                    )}
                                                    {unread !== undefined && unread > 0 && (
                                                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">
                                                            {unread} new
                                                        </span>
                                                    )}
                                                </div>
                                                {thread.author && (
                                                    <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                        <span>Started by {thread.author.name}</span>

                                                        {/* NEW: THE BADGE DISPLAY */}
                                                        {thread.author.activeBadge && (
                                                            <UserBadge
                                                                badgeKey={thread.author.activeBadge.imageUrl}
                                                                badgeName={thread.author.activeBadge.name}
                                                                size="sm"
                                                            />
                                                        )}

                                                        <span>· {new Date(thread.createdAt).toLocaleDateString()}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Always show link to the thread itself */}
                                            <Link
                                                to={`/forum/thread/${thread.id}`}
                                                className="text-xs text-gray-400 hover:text-blue-600 font-medium border border-gray-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Open
                                            </Link>
                                            {/* If has children, show Enter button */}
                                            {isFolder && (
                                                <button
                                                    onClick={() => enterFolder(thread)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    Browse →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                }
            </div>

            <NewThreadModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleThreadCreated}
                defaultParentId={currentFolderId}
            />
        </div>
    );
}

export default Forum;