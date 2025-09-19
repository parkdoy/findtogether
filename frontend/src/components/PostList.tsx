import type { Post } from '../types';
import SignedImage from './SignedImage';
import './PostList.css';
import { Timestamp } from 'firebase/firestore';

interface PostListProps {
  posts: Post[];
  isLoading: boolean; // Add isLoading prop
  apiUrl: string;
  onReportClick: (postId: string) => void;
}



const PostList = ({ posts, isLoading, apiUrl, onReportClick }: PostListProps) => {
  // Conditionally apply the 'loading' class
  const containerClassName = `post-list ${isLoading ? 'loading' : ''}`;
  // Use mock data in development, otherwise use props
  
  const mockPosts: Post[] = [
    {
      id: '1',
      name: '목업 데이터 1',
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
