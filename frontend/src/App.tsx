import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';

import type { Post, Location } from './types';
import { setupLeafletIcon } from './utils';
import { updateGeocodedAddresses } from './utils/geocoding';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import ReportForm from './components/ReportForm';
import MapView from './components/MapView';

setupLeafletIcon();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(13);
  const [formMode, setFormMode] = useState<'post' | 'report'>('post');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostIdForReport, setSelectedPostIdForReport] = useState<string | null>(null);

  const [postLocation, setPostLocation] = useState<Location | null>(null);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/posts`)
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Failed to fetch posts:", err));
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      updateGeocodedAddresses(posts).then(updatedPosts => {
        setPosts(updatedPosts);
      });
    }
  }, [posts]);

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

  const handlePostSubmit = (formData: FormData) => {
    fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(newPost => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    })
    .catch(err => console.error("Failed to submit post:", err));
  };

  const handleReportSubmit = (formData: FormData) => {
    if (!selectedPostId) return;

    fetch(`${API_URL}/api/posts/${selectedPostId}/reports`, {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(newReport => {
      const updatedPosts = posts.map(p => {
        if (p.id === selectedPostId) {
          const reports = p.reports ? [...p.reports, newReport] : [newReport];
          return { ...p, reports };
        }
        return p;
      });
      setPosts(updatedPosts);
      switchToPostMode();
    })
    .catch(err => console.error("Failed to submit report:", err));
  };

  const switchToReportMode = (postId: string) => {
    setFormMode('report');
    setSelectedPostId(postId);
    sidebarRef.current?.scrollTo(0, 0);
  };

  const switchToPostMode = () => {
    setFormMode('post');
    setSelectedPostId(null);
  }

  const selectedPostName = formMode === 'report' ? posts.find(p => p.id === selectedPostId)?.name : '';

  return (
    <>
      <div style={{ height: '100vh', width: '100%', display: 'flex' }}>
        <div className="sidebar" ref={sidebarRef} style={{ width: '30%', padding: '20px', overflowY: 'auto' }}>
          <h1>함께찾기</h1>
          
          {formMode === 'post' ? (
            <PostForm 
              onSubmit={handlePostSubmit} 
              handleAddressSearch={handleAddressSearch} 
              postLocation={postLocation} 
              setPostLocation={setPostLocation} 
            />
          ) : (
            <ReportForm 
              selectedPostName={selectedPostName || ''}
              onSubmit={handleReportSubmit}
              handleAddressSearch={handleAddressSearch} 
              onCancel={switchToPostMode}
              reportLocation={reportLocation}
              setReportLocation={setReportLocation}
            />
          )}

          <hr style={{ margin: '20px 0' }} />

          <h2>게시글 목록</h2>
          <PostList posts={posts} apiUrl={API_URL} onReportClick={switchToReportMode} />

        </div>

        <MapView 
          posts={posts}
          mapCenter={mapCenter}
          zoom={zoom}
          setZoom={setZoom}
          formMode={formMode}
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
    </>
  );
}

export default App;
