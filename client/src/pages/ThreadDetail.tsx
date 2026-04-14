import { useState, useEffect, type SubmitEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Post, type Attachment } from '../types/post';
import { type Thread } from '../types/thread'
import FileUpload from '../components/FileUpload';
import FileAttachment from '../components/FileAttachment';
import PostCard from '../components/generic/PostCard';

function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const loadThread = async () => {
    try {
      const response = await api.get(`/api/threads/${threadId}`);
      setThread(response.data);
    } catch (err) {
      setError('Error loading thread');
    }
  }

  const loadSubscriptionStatus = async () => {
    try {
      const response = await api.get(`/api/threads/${threadId}/subscribe`);
      setIsSubscribed(response.data.subscribed);
    } catch (err) {
      console.error('Error loading subscription status');
    }
  };

  const handleSubscribeToggle = async () => {
    try {
      if (isSubscribed) {
        await api.delete(`/api/threads/${threadId}/subscribe`);
        setIsSubscribed(false);
      } else {
        await api.post(`/api/threads/${threadId}/subscribe`);
        setIsSubscribed(true);
      }
    } catch (err) {
      setError('Error updating subscription');
    }
  };

  const loadPosts = async () => {
    try {
      const response = await api.get(
        `/api/threads/${threadId}/posts`,
      );
      setPosts(response.data);
    } catch (err) {
      setError('Error loading posts');
    }
  };

  const markAsRead = async () => {
    try {
        await api.post(`/api/threads/${threadId}/read`);
    } catch {
        // non-critical
    }
  };

  useEffect(() => {
    markAsRead();
    loadSubscriptionStatus();
    loadPosts();
    loadThread();

    const es = new EventSource(`${api.defaults.baseURL}/api/threads/stream`, { withCredentials: true });

    es.onmessage = (e) => {
      const { type, threadId: incomingThreadId, post} = JSON.parse(e.data);
      if (type === 'new_post' && incomingThreadId === threadId) {
        // prevents the user who posted from seeing their post twice, since loadPosts() fetches it
        setPosts(prev => prev.some(p => p.id === post.id) ? prev : [...prev, post]);
      }
    };

    es.onerror = () => console.warn('SSE connection lost, browser will retry...');

    return () => es.close();
  }, [threadId]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    try {
      await api.post(
        `/api/threads/${threadId}/posts`,
        { content, attachments }
      );
      
      setContent('');
      setAttachments([]);
      loadPosts();
    } catch (err) {
      setError('Error creating post');
    }
  };

  return (
  <div>
    {/* Header */}
    <div className="mb-6">
      <Link
        to="/forum"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
      >
        ← Back to Forum
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-700 tracking-tight">
          {thread ? thread.title : 'Loading...'}
        </h1>
        <button
          onClick={handleSubscribeToggle}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
            isSubscribed
              ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
              : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
          }`}
        >
          {isSubscribed ? '✓ Following' : '+ Follow'}
        </button>
      </div>
    </div>

    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

    <div className="flex flex-col gap-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>

    {user && (
      <form onSubmit={handleSubmit} className="mt-6">
        <textarea
          placeholder="Write a reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          style={{ width: '100%' }}
        />

        <FileUpload onUploadComplete={(file) => setAttachments((prev) => [...prev, file])} />

        {attachments.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ fontSize: '0.85em', color: '#555' }}>Attached files:</p>
            {attachments.map((att, i) => (
              <div key={i} style={{ fontSize: '0.85em' }}>
                📎{att.fileName}
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  style={{ marginLeft: '8px', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
        >
          Post Reply
        </button>
      </form>
    )}
  </div>
);
}

export default ThreadDetail;