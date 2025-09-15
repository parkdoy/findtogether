import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';

import type { Post, Location } from './types';
import { setupLeafletIcon } from './utils';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import ReportForm from './components/ReportForm';
import MapView from './components/MapView';

setupLeafletIcon();

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(13);
  const [formMode, setFormMode] = useState<'post' | 'report'>('post');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPostIdForReport, setSelectedPostIdForReport] = useState<number | null>(null);

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
    const geocodeLocation = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        let address = '주소 정보 없음';
        if (data.address) {
          const { city, town, village, road, neighbourhood, country } = data.address;
          address = `${country || ''} ${city || town || village || ''} ${neighbourhood || ''} ${road || ''}`.trim();
          if (address === '') address = data.display_name;
        }
        return address;
      } catch (err) {
        console.error("Failed to reverse geocode:", err);
        return `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    };

    const updateGeocodedAddresses = async () => {
      const postsToUpdate = posts.filter(post => !post.geocodedAddress || post.reports.some(report => !report.geocodedAddress));

      if (postsToUpdate.length > 0) {
        const updatedPosts = await Promise.all(posts.map(async post => {
          const postAddress = !post.geocodedAddress
            ? await geocodeLocation(post.lastSeenLocation.lat, post.lastSeenLocation.lng)
            : post.geocodedAddress;

          const updatedReports = await Promise.all(post.reports.map(async report => {
            const reportAddress = !report.geocodedAddress
              ? await geocodeLocation(report.lat, report.lng)
              : report.geocodedAddress;
            return { ...report, geocodedAddress: reportAddress };
          }));

          return { ...post, geocodedAddress: postAddress, reports: updatedReports };
        }));

        setPosts(updatedPosts);
      }
    };

    if (posts.length > 0) {
      updateGeocodedAddresses();
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
      setZoom(16); // Zoom in on address search
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
      setPosts(prevPosts => [...prevPosts, newPost]);
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
          return { ...p, reports: [...p.reports, newReport] };
        }
        return p;
      });
      setPosts(updatedPosts);
      switchToPostMode();
    })
    .catch(err => console.error("Failed to submit report:", err));
  };

  const switchToReportMode = (postId: number) => {
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
          <PostList posts={posts} />

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
        />
      </div>
    </>
  );
}

export default App;
