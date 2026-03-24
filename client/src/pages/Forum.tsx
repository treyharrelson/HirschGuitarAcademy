import { useState, useEffect, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Thread } from '../types/thread';

function Forum() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const { user } = useAuth();

    console.log('Current user in Forum:', user);
    const loadThreads = async () => {
        try {
            const response = await api.get('/api/threads');
            setThreads(response.data);
        } catch (err) {
            setError('Error loading threads');
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
            <h1>Forum</h1>
            <Link to="/student-dashboard">Back to Dashboard</Link>

            {user && (
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text"
                        placeholder="Thread title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <button type="submit">Create Thread</button>
                </form>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <ul>
                {threads.map(thread => (
                    <li key={thread.id}>
                        <Link to={`/forum/thread/${thread.id}`}>
                            {thread.title}
                        </Link>
                        {thread.author && ` — ${thread.author.userName}`}
                    </li>
                ))}
            </ul>

        </div>
    );
}

export default Forum;