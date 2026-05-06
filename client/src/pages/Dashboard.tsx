import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { type Post } from '../types/post';
import PostCard from '../components/generic/PostCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import PostComposer from '../components/generic/PostComposer';

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
        if (!user) return;
        try {
            const response = await api.get('/api/threads/feed/posts', {
                params: { limit: LIMIT, offset: currentOffset }
            });
            const { posts = [], hasMore = false } = response.data || {};
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
            await api.post(`/api/threads/${threadId}/follow`);
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
        if (loading || !user) return;
        loadFeed(0, false);

        const es = new EventSource(`${api.defaults.baseURL}/api/threads/stream`, { withCredentials: true });

        es.onmessage = (e) => {
            const { type, post } = JSON.parse(e.data);

            // thread post from a followed thread
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
    }, [user, loading]);

    // show loading while checking auth
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center">
                <div className="text-gray-400">Loading dashboard...</div>
            </div>
        );
    }
    // if not logged in after loading, redirect to login
    if (!user) {
        navigate('/');
        return null;
    }

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Feed Column */}
                <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Activity Feed</h2>
                                <p className="text-sm text-gray-500 mt-1">Updates from your threads and courses</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Live
                            </span>
                        </div>

                        {/* Feed */}
                        <div className='flex-1'>
                            <h2 className="mb-4 text-xl font-semibold">My Feed</h2>

                            {/* Global post composer */}
                            <div className="mb-6">
                                <PostComposer
                                    onPosted={() => loadFeed(0, false)}
                                    placeholder="Share something with everyone..."
                                    submitLabel="Post"
                                />
                            </div>

                            {feedLoading
                                ? Array.from({ length: 3 }).map((_, i) => (
                                    <SkeletonPostCard key={i} />
                                ))
                                : feedPosts.length === 0
                                    ? <p>No posts yet. Follow some threads in the forum to see them here.</p>
                                    : (
                                        <div className="flex flex-col gap-4">
                                            {(feedPosts || []).map(post => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    showThread
                                                    onFollowThread={
                                                        post.announcedThread
                                                            ? handleFollowFromPost
                                                            : undefined
                                                    }/>
                                            ))}
                                        </div>
                                    )} 
                            {feedHasMore && !feedLoading && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full mt-8 py-3 text-sm text-blue-600 font-semibold border-2 border-blue-100 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group">
                                    {loadingMore ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Loading...
                                        </>
                                    ) : 'Load Older Posts'}
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>);
}
export default Dashboard;