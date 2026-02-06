import { useEffect, useState } from 'react';
import { api } from './lib/api';

// Define what a Post looks like (matching your server query)
interface Post {
  id: number;
  content: string;
  authorName: string | null;
  createdAt: string;
}

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1); // Track current page
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch posts whenever the 'page' variable changes
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        // Calls /api/posts?page=1, etc.
        const data = await api.get<Post[]>(`/posts?page=${page}`);
        setPosts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]); // 👈 This [page] dependency is the magic. It runs every time page changes.

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎸 Student Posts</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {loading ? (
        <p>Loading posts...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {posts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>{post.content}</p>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  Posted by <strong>{post.authorName || 'Unknown'}</strong> on {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Previous
        </button>

        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          Page {page}
        </span>

        <button 
          onClick={() => setPage(p => p + 1)}
          // Disable "Next" if we got fewer than 20 results (means we hit the end)
          disabled={posts.length < 20 || loading}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;