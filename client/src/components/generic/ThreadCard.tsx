import { useNavigate } from 'react-router-dom';
import { type Thread } from '../../types/thread';

type Props = {
    thread: Thread;
    unreadCount?: number;
};

function ThreadCard({ thread, unreadCount }: Props) {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/forum/thread/${thread.id}`)}
            className="block cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
        >
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-700 hover:underline">{thread.title}</h3>
                {unreadCount !== undefined && unreadCount > 0 && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {unreadCount} new
                    </span>
                )}
            </div>
            {thread.author && (
                <p className="text-sm text-gray-400 mt-1">
                    Started by <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${thread.author.id}`); }} 
                        className="hover:underline hover:text-blue-600 font-medium"
                    >
                        {thread.author.userName}
                    </button> · {new Date(thread.createdAt).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}

export default ThreadCard;