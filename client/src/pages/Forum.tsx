import { useState, useEffect, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Thread } from '../types/thread';
import ThreadCard from '../components/generic/ThreadCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import SkeletonThreadCard from '../components/generic/SkeletonThreadCard';

function Forum() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    console.log('Current user in Forum:', user);
    const loadThreads = async () => {
        try {
            const response = await api.get('/api/threads');
            setThreads(response.data);
        } catch (err) {
            setError('Error loading threads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadThreads();
    }, []);

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        
        try {
            await api.post('/api/threads',
                { title }
            );

            setTitle('');
            loadThreads();
        } catch (err: any) {
            console.error('Error creating thread: ', err);
            setError(err.response?.data?.message || 'Error creating thread');
        }
    };

    return (
    <div>
        {/* Header */}
        <div className="mb-6">
        <Link
            to="/student-dashboard"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
            ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-blue-700 tracking-tight">Forum</h1>
        </div>

        {/* Create thread form */}
        {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
            type="text"
            placeholder="Start a new thread..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
            >
            + Create Thread
            </button>
        </form>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Thread list */}
        <div className="flex flex-col gap-3">
            {loading
                ? Array.from({ length: 3}).map((_, i) => <SkeletonThreadCard key={i} />)
                : threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)
            }
        </div>
    </div>
    );
}

export default Forum;