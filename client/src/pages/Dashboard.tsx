import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { DashButton } from '../components/generic/Buttons';
import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import {type Post } from '../types/post';
import PostCard from '../components/generic/PostCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';

type RoleLink = {
    label: string;
    path: string;
    button: React.ElementType;
}

const NAV_LINKS: Record<string, RoleLink[]> = {
    // need to populate appropriately
    guest: [
        { label: 'Create Account', path: '/', button: DashButton }
    ],
    student: [
        { label: 'Forum', path: '/forum', button: DashButton },
        { label: 'Followed Threads', path: '/follows', button: DashButton },
        { label: 'View Available Courses', path: '/all-courses', button: DashButton },
        { label: 'My Courses', path: '/courses', button: DashButton },
        { label: 'Metronome', path: '/metronome', button: DashButton },
        { label: 'Timer', path: '/timer', button: DashButton },
        { label: 'LMS Redirect', path: '/home', button: DashButton }
    ],
    instructor: [
        { label: 'Instructor View', path: '/instructor', button: DashButton },
        { label: 'Add Course', path: '/instructor/add-course', button: DashButton },
    ],
    admin: [
        //dunno yet
    ]
};


function Dashboard() {
    const LIMIT = 20;
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [feedOffset, setFeedOffset] = useState(0);
    const [feedHasMore, setFeedHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [feedPosts, setFeedPosts] = useState<Post[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);

    const loadFeed = async (currentOffset = 0, append = false) => {
        try {
            const response = await api.get('/api/threads/feed/posts', {
                params: { limit: LIMIT, offset: currentOffset }
            });
            const { posts, hasMore } = response.data;
            setFeedPosts(prev => append ? [...prev, ...posts] : posts);
            setFeedHasMore(hasMore);
        } catch (err) {
            console.error('Error loading feed');
        } finally {
            setFeedLoading(false);
        }
    };

    // Follow a thread from an announcement post card
    const handleFollowFromPost = async (threadId: number) => {
        try {
            await api.post(`/api/threads/${threadId}/subscribe`);
        } catch { console.error('Error following thread'); }
    };

    // submit event for the load more button
    const handleLoadMore = async () => {
        setLoadingMore(true);
        const newOffset = feedOffset + LIMIT;
        await loadFeed(newOffset, true);
        setFeedOffset(newOffset);
        setLoadingMore(false);
    }

    useEffect(() => {
        loadFeed(0, false);

        const es = new EventSource(`${api.defaults.baseURL}/api/threads/stream`, { withCredentials: true });

        es.onmessage = (e) => {
            const { type, post } = JSON.parse(e.data);

            // thread post from a subscribed thread
            if (type === 'new_post') {
                setFeedPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
            }

            // global announcement post (new thread created, or manual global post)
            if (type === 'new_global_post') {
                setFeedPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
            }
        };

        es.onerror = () => console.warn('SSE connection lost, browser will retry...');

        return () => es.close();
    }, []);

    const links = user?.role ? NAV_LINKS[user.role] : NAV_LINKS['guest'];

    const RenderLinks = () => (
        <>
            {links.map((link, index) => (
                <link.button onClick={() => navigate(link.path)}>
                    {link.label}
                </link.button>
            ))}
        </>
    );

    // show loading while checking auth
    if (loading) {
        return <div>Loading...</div>;
    }
    // if not logged in after loading, redirect to login
    if (!user) {
        navigate('/');
        return null;
    }

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>

            <div className='mt-10 flex gap-8'>

                {/* Sidebar */}
                <div className='w-48 flex-shrink-0'>
                    <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
                    <ul className="flex flex-col gap-2">
                        <RenderLinks />
                    </ul>
                </div>

                {/* Feed */}
                <div className='flex-1'>
                    <h2 className="mb-4 text-xl font-semibold">My Feed</h2>

                    {feedPosts.length === 0 ? (
                        <p>No posts yet. Subscribe to some threads in the forum to see them here.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {feedPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    showThread
                                    onFollowThread={post.announcedThread ? handleFollowFromPost : undefined}
                                />
                            ))}
                        </div>
                    )}

                    {feedHasMore && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="w-full mt-4 py-2 text-sm text-blue-600 font-semibold border border-blue-200 rounded-full hover:bg-blue-50 transition-all disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    )}
                </div>

            {/* Feed */}
            <div className='flex-1'>
                <h2 className="mb-4 text-xl font-semibold">My Feed</h2>
                {feedLoading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)
                    : feedPosts.length === 0
                        ? <p>No posts yet. Subscribe to some threads in the forum to see them here.</p>
                        : <div className="flex flex-col gap-4">
                            {feedPosts.map(post => <PostCard key={post.id} post={post} showThread />)}
                        </div>
                }
            </div>
        </div>
    );
}

export default Dashboard;