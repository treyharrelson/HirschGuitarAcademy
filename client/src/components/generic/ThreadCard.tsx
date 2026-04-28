import { Link } from 'react-router-dom';
import { type Thread } from '../../types/thread';

type Props = {
    thread: Thread;
    unreadCount?: number;
};

function ThreadCard({ thread, unreadCount }: Props) {
    return (
        <Link to={`/forum/thread/${thread.id}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-700">{thread.title}</h3>
                {thread.visibility === 'global' && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                        Global
                    </span>
                )}
                {thread.visibility === 'private' && (
                    <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        🔒Private
                    </span>
                )}
                {unreadCount !== undefined && unreadCount > 0 && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {unreadCount} new
                    </span>
                )}
            </div>
            {thread.author && (
                <p className="text-sm text-gray-400 mt-1">
                    Started by {thread.author.userName} · {new Date(thread.createdAt).toLocaleDateString()}
                </p>
            )}
        </Link>
    );
}

export default ThreadCard;