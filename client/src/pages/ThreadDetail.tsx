import { useState, useEffect, type SubmitEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Post, type Attachment } from '../types/post';
import FileUpload from '../components/FileUpload';
import FileAttachment from '../components/FileAttachment';

function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

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

  useEffect(() => {
    loadPosts();

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
      <h1>Thread</h1>
      <Link to="/forum">Back to Forum</Link>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        {posts.map(post => (
          <div key={post.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <p><strong>{post.author?.userName || 'Unknown'}</strong></p>
            <p>{post.content}</p>

            {post.attachments?.map((att, i) => (
              <FileAttachment 
                key={i}
                fileKey={att.fileKey}
                fileType={att.fileType}
                fileName={att.fileName}
              />
            ))}

            <p style={{ fontSize: '0.8em', color: '#666' }}>
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmit}>
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

          <button type="submit">Post Reply</button>
        </form>
      )}
    </div>
  );
}

export default ThreadDetail;