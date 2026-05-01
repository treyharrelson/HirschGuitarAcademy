import { Link } from 'react-router-dom';
import { type Post } from '../../types/post';
import { type Comment } from '../../types/comment';
import { type ReactionSummary } from '../../types/reaction';
import FileAttachment from '../FileAttachment';
import ReactionBar from './ReactionBar';
import { useState } from 'react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import UserBadge from '../UserBadge';

const EMPTY_REACTIONS: ReactionSummary = {
    counts: { like: 0, love: 0, laugh: 0, fire: 0, celebrate: 0 },
    userReaction: null
};

type Props = {
    post: Post;
    showThread?: boolean; // show thread title link (true on feed, false on thread detail)
    onFollowThread?: (threadId: number) => Promise<void>;
    onPostDeleted?: (postId: number) => void;
};

function PostCard({ post, showThread = false, onFollowThread, onPostDeleted }: Props) {
    const initials = post.author?.name?.slice(0, 2).toUpperCase() || '??';
    const [followed, setFollowed] = useState(false);
    const [following, setFollowing] = useState(false);
    const { user } = useAuth();
    const isModerator = user?.role === 'moderator' || user?.role === 'admin';

    // reaction states
    const [postReactions, setPostReactions] = useState<ReactionSummary>({
        counts: post.counts ?? EMPTY_REACTIONS.counts,
        userReaction: post.userReaction ?? null,
    });

    // reply states
    const [showReplies, setShowReplies] = useState(false);
    const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replyError, setReplyError] = useState('');

    const handleFollow = async () => {
        if (!onFollowThread || !post.announcedThread || followed) return;
        setFollowing(true);
        await onFollowThread(post.announcedThread.id);
        setFollowing(false);
        setFollowed(true);
    };

    const loadComments = async () => {
        try {
            const res = await api.get(`/api/posts/${post.id}/comments`);
            setComments(res.data);
            setCommentsLoaded(true);
        } catch {
            console.error('Error loading comments');
        }
    };

    const handleToggleReplies = () => {
        if (!showReplies && !commentsLoaded) {
            loadComments();
        }
        setShowReplies(prev => !prev);
    };

    const handleSubmitReply = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmittingReply(true);
        setReplyError('');
        try {
            const res = await api.post(`/api/posts/${post.id}/comments`, { content: replyContent });
            setComments(prev => [...prev, res.data]);
            setReplyContent('');
            if (!showReplies) setShowReplies(true);
        } catch {
            setReplyError('Failed to post reply.');
        } finally {
            setSubmittingReply(false);
        }
    }
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const threadId = post.thread?.id || post.announcedThread?.id || 'global';
            await api.delete(`/api/posts/${threadId}/posts/${post.id}`);
            if (onPostDeleted) onPostDeleted(post.id);
        } catch (error: any) {
            console.error('Error deleting post:', error);
            alert(`Failed to delete post: ${error.response?.data?.message || error.message}.`);
        }
    };

    const handleBan = async () => {
        if (!confirm(`Are you sure you want to ban ${post.author?.name} (${post.author?.id}) from this thread?`)) return;
        try {
            const threadId = post.thread?.id || post.announcedThread?.id;
            await api.post(`/api/threads/${threadId}/ban`, { userId: post.author?.id });
            alert('User banned successfully.');
        } catch (error: any) {
            console.error('Error banning user:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to ban user.';
            alert(msg);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">

            {/* Announcement banner */}
            {post.announcedThread && (
                <div className="flex items-center justify-between mb-3 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-0.5">New Thread</p>
                        <Link to={`/forum/thread/${post.announcedThread.id}`} className="text-sm font-bold text-blue-700 hover:underline">
                            {post.announcedThread.title}
                        </Link>
                    </div>
                    {onFollowThread && (
                        <button
                            onClick={handleFollow}
                            disabled={followed || following}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${followed
                                ? 'border-blue-400 text-blue-500 bg-white cursor-default'
                                : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent disabled:opacity-50'
                                }`}
                        >
                            {followed ? '✓ Following' : following ? 'Following...' : '+ Follow'}
                        </button>
                    )}
                </div>
            )}

            {/* Thread label */}
            {showThread && post.thread && !post.announcedThread && (
                <Link
                    to={`/forum/thread/${post.thread.id}`}
                    className="text-xs font-semibold text-blue-600 uppercase tracking-wide hover:underline"
                >
                    {post.thread.title}
                </Link>
            )}

            <div className="flex justify-between items-start mt-2 mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Link to={`/profile/${post.author?.id}`} className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                        {initials}
                    </Link>
                    <div>
                        <Link to={`/profile/${post.author?.id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline">
                            {post.author?.name || 'Unknown'}
                        </Link>
                        {/* THE BADGE DISPLAY */}
                        {post.author?.activeBadge && (
                            <UserBadge
                                badgeKey={post.author.activeBadge.imageUrl}
                                badgeName={post.author.activeBadge.name}
                                size="sm"
                            />
                        )}
                        <p className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                {isModerator && (
                    <div className="flex gap-2">
                        {post.author?.id !== user?.id && (post.thread?.id || post.announcedThread?.id) && (
                            <button onClick={handleBan} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 flex items-center justify-center gap-1 rounded border border-red-200">
                                <span>Ban User</span>
                            </button>
                        )}
                        <button onClick={handleDelete} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 flex items-center justify-center gap-1 rounded border border-red-200">
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                    {post.attachments.map((att, i) => (
                        <FileAttachment key={i} fileKey={att.fileKey} fileType={att.fileType} fileName={att.fileName} />
                    ))}
                </div>
            )}

            {/* Post reactions — lazy loaded on first hover/click */}
            <ReactionBar postId={post.id} initial={postReactions} />

            {/* Reply toggle */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={handleToggleReplies} className="text-xs text-gray-400 hover:text-blue-500 transition-colors font-medium">
                    💬 {showReplies ? 'Hide replies' : comments.length > 0 ? `${comments.length} replies` : 'Reply'}
                </button>
            </div>

            {/* Reply section */}
            {showReplies && (
                <div className="mt-3 flex flex-col gap-3">
                    {commentsLoaded && comments.length === 0 && (
                        <p className="text-xs text-gray-400 pl-2">No replies yet.</p>
                    )}

                    {comments.map(c => {
                        const cInitials = c.author?.name?.slice(0, 2).toUpperCase() || '??';
                        return (
                            <div key={c.id} className="pl-3 border-l-2 border-blue-100">
                                <div className="flex gap-2">
                                    <Link to={`/profile/${c.author?.id}`} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                                        {cInitials}
                                    </Link>
                                    <div className="flex items-center gap-2"> {/* Added flex container */}
                                        <Link to={`/profile/${c.author?.id}`} className="text-xs font-semibold text-gray-700 hover:text-blue-600 hover:underline">
                                            {c.author?.name || 'Unknown'}
                                        </Link>

                                        {/* THE BADGE DISPLAY FOR REPLIES */}
                                        {c.author?.activeBadge && (
                                            <UserBadge
                                                badgeKey={c.author.activeBadge.imageUrl}
                                                badgeName={c.author.activeBadge.name}
                                                size="sm"
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                                </div>
                            </div>
                        );
                    })}

                    {user && (
                        <form onSubmit={handleSubmitReply} className="flex gap-2 mt-1">
                            <input
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <button
                                type="submit"
                                disabled={submittingReply || !replyContent.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-xs font-semibold"
                            >
                                {submittingReply ? '...' : 'Reply'}
                            </button>
                        </form>
                    )}
                    {replyError && <p className="text-xs text-red-500">{replyError}</p>}
                </div>
            )}
        </div>
    );
}

export default PostCard;
