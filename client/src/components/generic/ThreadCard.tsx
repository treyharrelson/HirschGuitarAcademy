import { Link } from 'react-router-dom';
import { type Thread } from '../../types/thread';

type Props = {
    thread: Thread;
};

function ThreadCard({ thread }: Props) {
    return (
        <Link
            to={`/forum/thread/${thread.id}`}
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
        >
            <h3 className="text-lg font-semibold text-blue-700">{thread.title}</h3>
            {thread.author && (
                <p className="text-sm text-gray-400 mt-1">
                    Started by {thread.author.userName} · {new Date(thread.createdAt).toLocaleDateString()}
                </p>
            )}
        </Link>
    );
}

export default ThreadCard;