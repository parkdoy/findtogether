import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';

import Header from './components/Header';
import MyPage from './components/MyPage'; // Import MyPage
import type { Post, Location, Report } from './types';
import { setupLeafletIcon } from './utils';
import { updateGeocodedAddresses, geocodeLocation } from './utils/geocoding';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import ReportForm from './components/ReportForm';
import MapView from './components/MapView';
import SlidingPanel, { type PanelType } from './components/SlidingPanel';
import AuthForm from './components/AuthForm';
import { type UserProfile } from './components/LoginForm';
import { auth } from './firebase';

setupLeafletIcon();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(13);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostIdForReport, setSelectedPostIdForReport] = useState<string | null>(null);

  const [postLocation, setPostLocation] = useState<Location | null>(null);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);

  const [activePanel, setActivePanel] = useState<PanelType | null>('list');
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [postLoginPanel, setPostLoginPanel] = useState<PanelType>('list');

  useEffect(() => {
    setIsLoadingPosts(true);
    fetch(`${API_URL}/api/posts`)
      .then(res => res.json())
      .then(initialPosts => {
        updateGeocodedAddresses(initialPosts).then(geocodedPosts => {
          setPosts(geocodedPosts);
          setIsLoadingPosts(false);
        });
      })
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setIsLoadingPosts(false);
      });
  }, []);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setIsLoggedIn(true);
    setCurrentUser(userProfile);
    setActivePanel(postLoginPanel);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActivePanel('list');
    }).catch((error) => {
      console.error("Logout failed:", error);
    });
  };

  const handleTabClick = (panel: PanelType | null) => {
    const targetPanel = activePanel === panel ? null : panel;

    if (targetPanel === 'post' || targetPanel === 'report') {
      setPostLoginPanel(targetPanel);
    }

    setActivePanel(targetPanel);
  };

  const handleLoginClick = () => {
    handleTabClick('post');
  };

  const handleMyPageClick = () => {
    setActivePanel('my-page');
  };

  const handleUpdateNickname = async (newNickname: string) => {
    if (!currentUser || !auth.currentUser) {
      alert('You must be logged in to update your nickname.');
      return;
    }
    const token = await auth.currentUser.getIdToken();
    try {
      const response = await fetch(`${API_URL}/api/user/nickname`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: newNickname }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update nickname');
      }

      const updatedUserProfile = await response.json();

      // Update the local state with the new profile from the server
      setCurrentUser(updatedUserProfile);

      alert('닉네임이 성공적으로 변경되었습니다!');
    } catch (err) {
      console.error('Failed to update nickname:', err);
      alert(err instanceof Error ? err.message : '닉네임 변경 중 오류가 발생했습니다.');
    }
  };

  const handleAddressSearch = async (addressString: string, locationSetter: (location: Location) => void) => {
    if (!addressString) {
      alert('주소를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/geocode?address=${encodeURIComponent(addressString)}`);
      if (!res.ok) {
        throw new Error('주소를 찾을 수 없습니다.');
      }
      const data = await res.json();
      setMapCenter([data.lat, data.lng]);
      setZoom(16);
      locationSetter(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '주소 검색에 실패했습니다.');
    }
  };

  const handlePostSubmit = async (formData: FormData) => {
    if (!currentUser || !auth.currentUser) {
      alert('You must be logged in to post.');
      return;
    }
    const token = await auth.currentUser.getIdToken();

    fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    .then(res => res.json())
    .then(async (newPost: Post) => {
      const [geocodedPost] = await updateGeocodedAddresses([newPost]);
      setPosts(prevPosts => [geocodedPost, ...prevPosts]);
      if (geocodedPost.lastSeenLocation) {
        setMapCenter([geocodedPost.lastSeenLocation.lat, geocodedPost.lastSeenLocation.lng]);
      }
      setActivePanel('list');
    })
    .catch(err => console.error("Failed to submit post:", err));
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !auth.currentUser) {
      alert('You must be logged in to delete posts.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const token = await auth.currentUser.getIdToken();

    fetch(`${API_URL}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(res => {
      if (res.ok) {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      } else {
        res.json().then(err => alert(`Failed to delete post: ${err.message}`)).catch(() => alert('Failed to delete post.'));
      }
    })
    .catch(err => console.error("Failed to delete post:", err));
  };

  const handleReportSubmit = (formData: FormData) => {
    if (!selectedPostId || !currentUser) return;

    formData.append('authorName', currentUser.name);

    fetch(`${API_URL}/api/posts/${selectedPostId}/reports`, {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(async (newReport: Report) => {
      const geocodedAddress = await geocodeLocation(newReport.lat, newReport.lng);
      const newReportWithAddress = { ...newReport, geocodedAddress, authorName: currentUser.name };

      const updatedPosts = posts.map(p => {
        if (p.id === selectedPostId) {
          const reports = p.reports ? [...p.reports, newReportWithAddress] : [newReportWithAddress];
          return { ...p, reports };
        }
        return p;
      });
      setPosts(updatedPosts);
      setActivePanel('list');
    })
    .catch(err => console.error("Failed to submit report:", err));
  };

  const switchToReportMode = (postId: string) => {
    setSelectedPostId(postId);
    setPostLoginPanel('report');
    setActivePanel('report');
  };

  const handlePostSelect = (post: Post) => {
    if (post.lastSeenLocation) {
      setMapCenter([post.lastSeenLocation.lat, post.lastSeenLocation.lng]);
    }
  };

  const selectedPostForReportData = posts.find(p => p.id === selectedPostId);

  return (
    <div className="app-container">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={handleLoginClick}
        onMyPageClick={handleMyPageClick} // Pass the new handler
      />
      <div className="main-content">
        <SlidingPanel 
          activePanel={activePanel} 
          setActivePanel={handleTabClick}
          myPageComponent={ // Add the MyPage component
            currentUser ? (
              <MyPage 
                currentUser={currentUser}
                posts={posts}
                onUpdateNickname={handleUpdateNickname}
              />
            ) : (
              <AuthForm onLoginSuccess={handleLoginSuccess} />
            )
          }
          postFormComponent={
            isLoggedIn ? (
              <PostForm 
                onSubmit={handlePostSubmit} 
                handleAddressSearch={handleAddressSearch} 
                postLocation={postLocation} 
                setPostLocation={setPostLocation} 
              />
            ) : (
              <AuthForm onLoginSuccess={handleLoginSuccess} />
            )
          }
          reportFormComponent={
            isLoggedIn ? (
              <ReportForm 
                selectedPostName={selectedPostForReportData?.name || ''}
                onSubmit={handleReportSubmit}
                handleAddressSearch={handleAddressSearch} 
                onCancel={() => setActivePanel('list')} // Go back to list
                reportLocation={reportLocation}
                setReportLocation={setReportLocation}
              />
            ) : (
              <AuthForm onLoginSuccess={handleLoginSuccess} />
            )
          }
          postListComponent={
            <PostList 
              posts={posts} 
              isLoading={isLoadingPosts} 
              apiUrl={API_URL} 
              onReportClick={switchToReportMode} 
              currentUser={currentUser}
              onDeletePost={handleDeletePost}
              onPostSelect={handlePostSelect}
            />
          }
        />
        
        <div className="map-container">
          <MapView 
            posts={posts}
            mapCenter={mapCenter}
            zoom={zoom}
            setZoom={setZoom}
            formMode={activePanel}
            postLocation={postLocation}
            reportLocation={reportLocation}
            selectedPostIdForReport={selectedPostIdForReport}
            setPostLocation={setPostLocation}
            setReportLocation={setReportLocation}
            setMapCenter={setMapCenter}
            setSelectedPostIdForReport={setSelectedPostIdForReport}
            switchToReportMode={switchToReportMode}
            apiUrl={API_URL}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
