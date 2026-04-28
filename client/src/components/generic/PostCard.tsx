import { Link } from 'react-router-dom';
import { type Post } from '../../types/post';
import FileAttachment from '../FileAttachment';
import { useState } from 'react';

type Props = {
    post: Post;
    showThread?: boolean; // show thread title link (true on feed, false on thread detail)
    onFollowThread?: (threadId: number) => Promise<void>;
};

function PostCard({ post, showThread = false, onFollowThread }: Props) {
    const initials = post.author?.userName?.slice(0,2).toUpperCase() || '??';
    const [followed, setFollowed] = useState(false);
    const [following, setFollowing] = useState(false);

    const handleFollow = async () => {
        if (!onFollowThread || !post.announcedThread || followed) return;
        setFollowing(true);
        await onFollowThread(post.announcedThread.id);
        setFollowing(false);
        setFollowed(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">

            {/* Announcement banner — shown when this post announces a new thread */}
            {post.announcedThread && (
                <div className="flex items-center justify-between mb-3 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-0.5">New Thread</p>
                        <Link
                            to={`/forum/thread/${post.announcedThread.id}`}
                            className="text-sm font-bold text-blue-700 hover:underline"
                        >
                            {post.announcedThread.title}
                        </Link>
                    </div>
                    {onFollowThread && (
                        <button
                            onClick={handleFollow}
                            disabled={followed || following}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                                followed
                                    ? 'border-blue-400 text-blue-500 bg-white cursor-default'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent disabled:opacity-50'
                            }`}
                        >
                            {followed ? '✓ Following' : following ? 'Following...' : '+ Follow'}
                        </button>
                    )}
                </div>
            )}

            {/* Thread label for feed view (non-announcement posts) */}
            {showThread && post.thread && !post.announcedThread && (
                <Link
                    to={`/forum/thread/${post.threadId}`}
                    className="text-xs font-semibold text-blue-600 uppercase tracking-wide hover:underline"
                >
                    {post.thread.title}
                </Link>
            )}

            <div className="flex items-center gap-3 mt-2 mb-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        {post.author?.userName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>

            {post.attachments && post.attachments.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                    {post.attachments.map((att, i) => (
                        <FileAttachment
                            key={i}
                            fileKey={att.fileKey}
                            fileType={att.fileType}
                            fileName={att.fileName}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostCard;
