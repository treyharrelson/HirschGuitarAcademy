import { useState, useEffect, type SubmitEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Post, type Attachment } from '../types/post';
import { type Thread } from '../types/thread'
import PostCard from '../components/generic/PostCard';
import SkeletonPostCard from '../components/generic/SkeletonPostCard';
import PostComposer from '../components/generic/PostComposer';

function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
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

  const loadFollowStatus = async () => {
    try {
      const response = await api.get(`/api/threads/${threadId}/follow`);
      setIsFollowing(response.data.followed);
    } catch (err) {
      console.error('Error loading follow status');
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/api/threads/${threadId}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/api/threads/${threadId}/follow`);
        setIsFollowing(true);
      }
    } catch (err) {
      setError('Error updating follow status');
    }
  };

  const loadPosts = async () => {
    setPostsLoaded(false);
    try {
      const response = await api.get(
        `/api/threads/${threadId}/posts`,
      );
      setPosts(response.data);
      setPostsLoaded(true);
    } catch (err) {
      setError('Error loading posts');
      setPostsLoaded(true); // so errors don't block empty state
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

  // load follow status only once thread is loaded and only if its not global
  useEffect(() => {
    if (!thread) return;
    if (thread.visibility === 'global') return;
    loadFollowStatus();
  }, [thread]);

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
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-blue-700 tracking-tight">
            {thread ? thread.title : 'Loading...'}
          </h1>
          {thread?.visibility === 'global' && (
            <span className="text-sm bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
              Global
            </span>
          )}
        </div>
        {!thread || thread.visibility !== 'global' && (
          <button
            onClick={handleFollowToggle}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
              isFollowing
                ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
            }`}
          >
            {isFollowing? '✓ Following' : '+ Follow'}
          </button>
        )}
      </div>
    </div>

    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

    {/* Post list */}
    <div className="flex flex-col gap-4">
      {!postsLoaded
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)
          : postsLoaded && posts.length === 0
              ? (
                  <div className="text-center py-12 text-gray-400">
                      <p className="text-lg font-medium">No posts yet</p>
                      <p className="text-sm mt-1">Be the first to respond!</p>
                  </div>
              )
              : posts.map(post => <PostCard key={post.id} post={post} />)
      }
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

        <FileUpload 
          key={uploadKey} 
          folder="forum"
          onUploadComplete={(file) => setAttachments((prev) => [...prev, file])} />

        {attachments.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ fontSize: '0.85em', color: '#555' }}>Attached files:</p>
            {attachments.map((att, i) => (
              <div key={i} style={{ fontSize: '0.85em' }}>
                📎{att.fileName}
                <button
                  onClick={() => {
                    setAttachments((prev) => prev.filter((_, j) => j !== i));
                    setUploadKey(k => k + 1);
                  }}
                  
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