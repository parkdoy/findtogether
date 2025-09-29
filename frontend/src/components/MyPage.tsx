import React, { useState } from 'react';
import { type Post } from '../types';
import { type UserProfile } from './LoginForm';
import './MyPage.css';

interface MyPageProps {
  currentUser: UserProfile;
  posts: Post[];
  onUpdateNickname: (newNickname: string) => void;
}

const MyPage: React.FC<MyPageProps> = ({ currentUser, posts, onUpdateNickname }) => {
  const [newNickname, setNewNickname] = useState(currentUser.name || '');

  const myPosts = posts.filter(post => post.authorId === currentUser.uid);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNickname.trim() && newNickname !== currentUser.name) {
      onUpdateNickname(newNickname.trim());
    }
  };

  return (
    <div className="my-page-container">
      <h2>마이페이지</h2>

      <section className="nickname-section">
        <h3>닉네임 수정</h3>
        <form onSubmit={handleNicknameSubmit} className="nickname-form">
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="새 닉네임을 입력하세요"
          />
          <button type="submit">저장</button>
        </form>
      </section>

      <section className="my-posts-section">
        <h3>내 게시글 ({myPosts.length})</h3>
        <div className="my-posts-list">
          {myPosts.length > 0 ? (
            myPosts.map(post => (
              <div key={post.id} className="my-post-item">
                <h4>{post.name}</h4>
                <p>마지막 목격: {new Date(post.lastSeenTime).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p>아직 작성한 게시글이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyPage;