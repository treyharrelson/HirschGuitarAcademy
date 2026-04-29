import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import api from '../api/axiosInstance';
import { type Post } from '../types/post';
import PostCard from '../components/generic/PostCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import PostComposer from '../components/generic/PostComposer';
import Sidebar, { SidebarLink } from '../components/generic/Sidebar';
import { DashButton } from '../components/generic/Buttons';

type RoleLink = {
    label: string;
    path: string;
    icon?: React.ReactNode;
    button?: React.ElementType;
}

const Icons = {
    CreateAccount: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
    Forum: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
    Follows: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    Courses: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    Enrollments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
    Metronome: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
    Timer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Instructor: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Admin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const NAV_LINKS: Record<string, RoleLink[]> = {
    guest: [
        { label: 'Create Account', path: '/', icon: Icons.CreateAccount }
    ],
    student: [
        { label: 'Forum', path: '/forum', icon: Icons.Forum },
        { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
        { label: 'View Available Courses', path: '/all-courses', icon: Icons.Courses },
        { label: 'My Enrollments', path: '/my-enrollments', icon: Icons.Enrollments },
        { label: 'Metronome', path: '/metronome', icon: Icons.Metronome },
        { label: 'Timer', path: '/timer', icon: Icons.Timer },
    ],
    instructor: [
        { label: 'Instructor View', path: '/instructor', icon: Icons.Instructor },
    ],
    moderator: [
        { label: 'Forum', path: '/forum', icon: Icons.Forum },
        { label: 'Followed Threads', path: '/follows', icon: Icons.Follows },
    ],
    admin: [
        { label: 'Forum', path: '/forum', button: DashButton },
        { label: 'Manage Threads', path: '/manage/threads', button: DashButton },
        { label: 'Instructor View', path: '/instructor', icon: Icons.Instructor },
        { label: 'Course Management', path: '/instructor/add-course', icon: Icons.Admin },
    ]
};


function Dashboard() {
    const LIMIT = 20;
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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
    }, []);

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

                <Sidebar>
                    {user?.role && (NAV_LINKS[user.role] || NAV_LINKS['guest']).map((link, index) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <SidebarLink
                                key={index}
                                icon={link.icon}
                                label={link.label}
                                isActive={isActive}
                                onClick={() => navigate(link.path)}
                            />
                        );
                    })}
                </Sidebar>

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
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )} 
                            {feedHasMore && !feedLoading && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="w-full mt-8 py-3 text-sm text-blue-600 font-semibold border-2 border-blue-100 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
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