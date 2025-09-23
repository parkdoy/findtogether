import type { Post } from '../types';
import SignedImage from './SignedImage';
import './PostList.css';
import { Timestamp } from 'firebase/firestore';
import { type UserProfile } from './LoginForm';

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
  

  
  const mockPosts: Post[] = [
    {
      id: '1',
      name: '목업 데이터 1',
      authorId: 'mockuser1',
      authorName: '테스트유저1',
      features: '흰색, 매우 활발함',
      lastSeenTime: new Date().toISOString(),
      imageUrl: '',
      reports: [],
      lastSeenLocation: { lat: 65.123, lng: -23.456 },
      createdAt: Timestamp.now(),
    },
    {
      id: '2',
      name: '목업 데이터 2',
      authorId: 'mockuser2',
      authorName: '테스트유저2',
      features: '검은색, 조용함',
      lastSeenTime: new Date().toISOString(),
      imageUrl: '',
      reports: [],
      lastSeenLocation: { lat: 65.123, lng: -23.456 },
      createdAt: Timestamp.now(),
    },
    {
      id: '3',
      name: '목업 데이터 3',
      authorId: 'mockuser3',
      authorName: '테스트유저3',
      features: '얼룩무늬, 경계심 많음',
      lastSeenTime: new Date().toISOString(),
      imageUrl: '',
      reports: [],
      lastSeenLocation: { lat: 65.123, lng: -23.456 },
      createdAt: Timestamp.now()
    }
  ];
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
