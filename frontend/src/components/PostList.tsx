import type { Post } from '../types';

interface PostListProps {
  posts: Post[];
}

const PostList = ({ posts }: PostListProps) => {
  return (
    <div className="post-list">
      {posts.map(post => (
        <div key={post.id} className="post-item">
          <h3>{post.name}</h3>
          <p>마지막 목격: {new Date(post.lastSeenTime).toLocaleString()}</p>
          {post.imageUrl && <img src={`http://localhost:3001${post.imageUrl}`} alt={post.name} style={{ maxWidth: '100px' }} />}
        </div>
      ))}
    </div>
  );
};

export default PostList;
