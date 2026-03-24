import { Link } from 'react-router-dom';
import { type Post } from '../../types/post';
import FileAttachment from '../FileAttachment';

type Props = {
    post: Post;
    showThread?: boolean; // show thread title link (true on feed, false on thread detail)
};

function PostCard({ post, showThread = false }: Props) {
    const initials = post.author?.userName?.slice(0,2).toUpperCase() || '??';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">

            {showThread && post.thread && (
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