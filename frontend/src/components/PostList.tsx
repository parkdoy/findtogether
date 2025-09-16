import type { Post } from '../types';
import SignedImage from './SignedImage';

interface PostListProps {
  posts: Post[];
  apiUrl: string;
  onReportClick: (postId: string) => void;
}

const PostList = ({ posts, apiUrl, onReportClick }: PostListProps) => {
  return (
    <div className="post-list">
      {posts.map(post => (
        <div key={post.id} className="post-item">
          <h3>{post.name}</h3>
          <p>특징: {post.features}</p>
          <p>마지막 목격: {new Date(post.lastSeenTime).toLocaleString()}</p>
          {post.imageUrl && (
            <SignedImage
              gcsObjectName={post.imageUrl}
              alt={post.name}
              apiUrl={apiUrl}
              style={{ maxWidth: '100px' }}
            />
          )}
          <button onClick={() => onReportClick(post.id)}>제보하기</button>
          <div className="reports-list">
            <h4>제보 목록:</h4>
            {post.reports && post.reports.length > 0 ? (
              post.reports.map((report, index) => (
                <div key={index} className="report-item">
                  <p>{new Date(report.time).toLocaleString()}: {report.description}</p>
                  {report.imageUrl && (
                     <SignedImage
                       gcsObjectName={report.imageUrl}
                       alt="Report image"
                       apiUrl={apiUrl}
                       style={{ maxWidth: '80px' }}
                     />
                  )}
                </div>
              ))
            ) : (
              <p>아직 제보가 없습니다.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;
