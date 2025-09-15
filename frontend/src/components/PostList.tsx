import type { Post } from '../types';
import SignedImage from './SignedImage'; // New import

interface PostListProps {
  posts: Post[];
  apiUrl: string; // Added
}

const PostList = ({ posts, apiUrl }: PostListProps) => { // Added apiUrl
  return (
    <div className="post-list">
      {posts.map(post => (
        <div key={post.id} className="post-item">
          <h3>{post.name}</h3>
          <p>마지막 목격: {new Date(post.lastSeenTime).toLocaleString()}</p>
          {post.imageUrl && (
            <SignedImage
              gcsObjectName={post.imageUrl}
              alt={post.name}
              apiUrl={apiUrl}
              style={{ maxWidth: '100px' }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList;