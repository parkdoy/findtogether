import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';

import type { Post, Location, Report } from './types';
import { setupLeafletIcon } from './utils';
import { updateGeocodedAddresses, geocodeLocation } from './utils/geocoding';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import ReportForm from './components/ReportForm';
import MapView from './components/MapView';
import SlidingPanel, { type PanelType } from './components/SlidingPanel';

setupLeafletIcon();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(13);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostIdForReport, setSelectedPostIdForReport] = useState<string | null>(null);

  const [postLocation, setPostLocation] = useState<Location | null>(null);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);

  const [activePanel, setActivePanel] = useState<PanelType | null>('list');
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true); // New loading state

  useEffect(() => {
    setIsLoadingPosts(true); // Set loading to true before fetch
    fetch(`${API_URL}/api/posts`)
      .then(res => res.json())
      .then(initialPosts => {
        updateGeocodedAddresses(initialPosts).then(geocodedPosts => {
          setPosts(geocodedPosts);
          setIsLoadingPosts(false); // Set loading to false after posts are set
        });
      })
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setIsLoadingPosts(false); // Set loading to false even if there's an error
      });
  }, []);

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
    .then(async (newPost: Post) => {
      const [geocodedPost] = await updateGeocodedAddresses([newPost]);
      setPosts(prevPosts => [geocodedPost, ...prevPosts]);
      setActivePanel('list'); // Switch to list view after posting
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
    .then(async (newReport: Report) => {
      const geocodedAddress = await geocodeLocation(newReport.lat, newReport.lng);
      const newReportWithAddress = { ...newReport, geocodedAddress };

      const updatedPosts = posts.map(p => {
        if (p.id === selectedPostId) {
          const reports = p.reports ? [...p.reports, newReportWithAddress] : [newReportWithAddress];
          return { ...p, reports };
        }
        return p;
      });
      setPosts(updatedPosts);
      setActivePanel('list'); // Switch to list view after reporting
    })
    .catch(err => console.error("Failed to submit report:", err));
  };

  const switchToReportMode = (postId: string) => {
    setSelectedPostId(postId);
    setActivePanel('report');
  };

  const selectedPostName = activePanel === 'report' && selectedPostId ? posts.find(p => p.id === selectedPostId)?.name : '';

  return (
    <div className="app-container">
      <SlidingPanel 
        activePanel={activePanel} 
        setActivePanel={setActivePanel}
        postFormComponent={
          <PostForm 
            onSubmit={handlePostSubmit} 
            handleAddressSearch={handleAddressSearch} 
            postLocation={postLocation} 
            setPostLocation={setPostLocation} 
          />
        }
        reportFormComponent={
          <ReportForm 
            selectedPostName={selectedPostName || ''}
            onSubmit={handleReportSubmit}
            handleAddressSearch={handleAddressSearch} 
            onCancel={() => setActivePanel('list')} // Go back to list
            reportLocation={reportLocation}
            setReportLocation={setReportLocation}
          />
        }
        postListComponent={
          <PostList posts={posts} isLoading={isLoadingPosts} apiUrl={API_URL} onReportClick={switchToReportMode} />
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
  );
}

export default App;