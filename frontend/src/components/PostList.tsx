import type { Post } from '../types';
import SignedImage from './SignedImage';
import './PostList.css';
import { type UserProfile } from './LoginForm';
import { mockPosts } from './mock/mock';

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  apiUrl: string;
  onReportClick: (postId: string) => void;
  currentUser: UserProfile | null;
  onDeletePost: (postId: string) => void;
}


const PostList = ({ posts, isLoading, apiUrl, onReportClick, currentUser, onDeletePost }: PostListProps) => {

  const containerClassName = `post-list ${isLoading ? 'loading' : ''}`;
  // Use mock data in development, otherwise use props

  const postsToRender = import.meta.env.DEV ? mockPosts : posts;

  return (
    <div className={containerClassName}>
      {!isLoading && postsToRender.map(post => (
        <div key={post.id} className="post-item">
          <h3>{post.name}</h3>
          {post.authorName && <p><strong>작성자:</strong> {post.authorName}</p>}
          <p>특징: {post.features}</p>
          <p>마지막 목격 시간: {new Date(post.lastSeenTime).toLocaleString()}</p>
          <p>마지막 목격 장소: {post.geocodedAddress || '불러오는 중...'}</p>
          {post.imageUrl && (
            <SignedImage
              className="post-image"
              gcsObjectName={post.imageUrl}
              alt={post.name}
              apiUrl={apiUrl}
            />
          )}
          <button onClick={() => onReportClick(post.id)}>제보하기</button>
          {currentUser && currentUser.uid === post.authorId && (
            <button onClick={() => onDeletePost(post.id)} className="delete-button">삭제</button>
          )}
          <div className="reports-list">
            <h4>제보 목록:</h4>
            {post.reports && post.reports.length > 0 ? (
              post.reports.map((report, index) => (
                <div key={index} className="report-item">
                  {report.authorName && <p><strong>제보자:</strong> {report.authorName}</p>}
                  <p>날짜 : {new Date(report.time).toLocaleString()}</p>
                  <p>장소 : {report.geocodedAddress || '불러오는 중...'}</p>
                  <p>설명 : {report.description}</p>
                  {report.imageUrl && (
                     <SignedImage
                       className="report-image"
                       gcsObjectName={report.imageUrl}
                       alt="Report image"
                       apiUrl={apiUrl}
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