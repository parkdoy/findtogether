import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// --- Interfaces --- //
interface Report {
  id: number;
  lat: number;
  lng: number;
  time: string;
  description: string;
  imageUrl?: string; // Optional image URL
  geocodedAddress?: string; // Added for geocoded address
}

interface Post {
  id: number;
  name: string;
  features: string;
  lastSeenTime: string;
  lastSeenLocation: { lat: number; lng: number };
  reports: Report[];
  imageUrl?: string; // Optional image URL
  geocodedAddress?: string; // Added for geocoded address
}

interface Location {
  lat: number;
  lng: number;
}

// --- Leaflet Icon Fix --- //
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Map Components --- //

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapClickHandler = ({ setLocation, setMapCenter, formMode, setReportLocation }: { setLocation: (location: Location) => void, setMapCenter: (center: [number, number]) => void, formMode: 'post' | 'report', setReportLocation: (location: Location) => void }) => {
  useMapEvents({
    click(e) {
      if (formMode === 'report') {
        setReportLocation(e.latlng);
      } else {
        setLocation(e.latlng);
        setMapCenter([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

const LocationMarker = ({ location }: { location: Location | null }) => {
  return location === null ? null : (
    <Marker position={location}></Marker>
  );
};

// --- Main App Component --- //

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]);
  const [formMode, setFormMode] = useState<'post' | 'report'>('post');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPostIdForReport, setSelectedPostIdForReport] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [features, setFeatures] = useState('');
  const [lastSeenTime, setLastSeenTime] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [postLocation, setPostLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState('');

  const [reportDescription, setReportDescription] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportLocation, setReportLocation] = useState<Location | null>(null);
  const [reportAddress, setReportAddress] = useState('');

  const popupRef = useRef<L.Popup>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/posts')
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      formMode === 'post' ? setFile(event.target.files[0]) : setReportFile(event.target.files[0]);
    }
  };

  const handleAddressSearch = async (addressString: string, locationSetter: (location: Location) => void) => {
    if (!addressString) {
      alert('주소를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/geocode?address=${encodeURIComponent(addressString)}`);
      if (!res.ok) {
        throw new Error('주소를 찾을 수 없습니다.');
      }
      const data = await res.json();
      setMapCenter([data.lat, data.lng]);
      locationSetter(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : '주소 검색에 실패했습니다.');
    }
  };

  const clearPostForm = () => {
    setName('');
    setFeatures('');
    setLastSeenTime('');
    setFile(null);
    setPostLocation(null);
    setAddress('');
    const postForm = document.getElementById('post-form') as HTMLFormElement;
    if(postForm) postForm.reset();
  }

  const clearReportForm = () => {
    setReportDescription('');
    setReportTime('');
    setReportFile(null);
    setReportLocation(null);
    setReportAddress('');
    const reportForm = document.getElementById('report-form') as HTMLFormElement;
    if(reportForm) reportForm.reset();
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !lastSeenTime || !postLocation || !file) {
      alert('이미지, 이름, 장소, 시간을 모두 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('features', features);
    formData.append('lastSeenTime', lastSeenTime);
    formData.append('lastSeenLocation', JSON.stringify(postLocation));
    formData.append('image', file);

    fetch('http://localhost:3001/api/posts', {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(newPost => {
      setPosts(prevPosts => [...prevPosts, newPost]);
      clearPostForm();
    })
    .catch(err => console.error("Failed to submit post:", err));
  };

  const handleReportSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportTime || !reportLocation) {
      alert('시간과 장소를 모두 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('time', reportTime);
    formData.append('description', reportDescription);
    formData.append('location', JSON.stringify(reportLocation));
    if (reportFile) {
      formData.append('image', reportFile);
    }

    fetch(`http://localhost:3001/api/posts/${selectedPostId}/reports`, {
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
    clearPostForm();
    clearReportForm();
    popupRef.current?.close();
    sidebarRef.current?.scrollTo(0, 0);
  };

  const switchToPostMode = () => {
    setFormMode('post');
    setSelectedPostId(null);
    clearPostForm();
    clearReportForm();
  }

  const selectedPostName = formMode === 'report' ? posts.find(p => p.id === selectedPostId)?.name : '';

  return (
    <>
      <div style={{ height: '100vh', width: '100%', display: 'flex' }}>
        <div className="sidebar" ref={sidebarRef} style={{ width: '30%', padding: '20px', overflowY: 'auto' }}>
          <h1>함께찾기</h1>
          
          {formMode === 'post' ? (
            <h2>게시글 등록</h2>
          ) : (
            <h2>'제보' 등록: {selectedPostName}</h2>
          )}

          {formMode === 'post' ? (
            <form id="post-form" onSubmit={handleSubmit} className="form-container">
                <label htmlFor="image">이미지</label>
                <input type="file" id="image" name="image" accept="image/*" onChange={handleFileChange} required />

                <label htmlFor="name">이름</label>
                <input type="text" id="name" name="name" placeholder="이름" value={name} onChange={e => setName(e.target.value)} required />

                <label>장소</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="주소로 검색" style={{ flex: 1 }}/>
                  <button type="button" onClick={() => handleAddressSearch(address, setPostLocation)}>검색</button>
                </div>
                <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>또는 지도에서 마지막 목격 장소를 클릭하세요.</p>
                {postLocation && <p style={{ margin: 0 }}>선택된 위치: {postLocation.lat.toFixed(4)}, {postLocation.lng.toFixed(4)}</p>}

                <label htmlFor="lastSeenTime">시간</label>
                <input type="datetime-local" id="lastSeenTime" name="lastSeenTime" value={lastSeenTime} onChange={e => setLastSeenTime(e.target.value)} required />

                <label htmlFor="features">상황설명</label>
                <textarea id="features" name="features" placeholder="특징" value={features} onChange={e => setFeatures(e.target.value)} />

                <button type="submit" style={{ marginTop: '10px' }}>등록</button>
            </form>
          ) : (
            <form id="report-form" onSubmit={handleReportSubmit} className="form-container">
              <label htmlFor="report-image">이미지 (선택)</label>
              <input id="report-image" type="file" accept="image/*" onChange={handleFileChange} />

              <label>장소</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="text" value={reportAddress} onChange={e => setReportAddress(e.target.value)} placeholder="주소로 검색" style={{ flex: 1 }}/>
                <button type="button" onClick={() => handleAddressSearch(reportAddress, setReportLocation)}>검색</button>
              </div>
              <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>또는 지도에서 제보 장소를 클릭하세요.</p>
              {reportLocation && <p>선택된 위치: {reportLocation.lat.toFixed(4)}, {reportLocation.lng.toFixed(4)}</p>}

              <label htmlFor="report-time">시간</label>
              <input id="report-time" type="datetime-local" value={reportTime} onChange={e => setReportTime(e.target.value)} required />

              <label htmlFor="report-description">상황설명</label>
              <textarea id="report-description" value={reportDescription} onChange={e => setReportDescription(e.target.value)} />

              <div className="modal-buttons">
                <button type="submit">제출</button>
                <button type="button" onClick={switchToPostMode}>취소</button>
              </div>
            </form>
          )}

          <hr style={{ margin: '20px 0' }} />

          <h2>게시글 목록</h2>
          <div className="post-list">
            {posts.map(post => (
              <div key={post.id} className="post-item">
                <h3>{post.name}</h3>
                <p>마지막 목격: {new Date(post.lastSeenTime).toLocaleString()}</p>
                {post.imageUrl && <img src={`http://localhost:3001${post.imageUrl}`} alt={post.name} style={{ maxWidth: '100px' }} />}
              </div>
            ))}
          </div>

        </div>

        <div className="map-container" style={{ flex: 1 }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={mapCenter} zoom={13} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler setLocation={setPostLocation} setMapCenter={setMapCenter} formMode={formMode} setReportLocation={setReportLocation} />
            <LocationMarker location={postLocation} />
            <LocationMarker location={reportLocation} />
            {posts.map(post => (
              <div key={post.id}>
                <Marker 
                  key={`post-marker-${post.id}`} 
                  position={post.lastSeenLocation}
                  eventHandlers={{
                    click: () => {
                      setSelectedPostIdForReport(post.id);
                    },
                  }}
                >
                  <Popup ref={popupRef}>
                    {post.imageUrl && <img src={`http://localhost:3001${post.imageUrl}`} alt={post.name} style={{ maxWidth: '150px', maxHeight: '150px', display: 'block', marginBottom: '5px' }} />}
                    <b>이름</b>: {post.name}<br/>
                    <b>장소</b>: {post.geocodedAddress || '불러오는 중...'}<br/>
                    <b>날짜</b>: {new Date(post.lastSeenTime).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '.').replace(/ /g, '').slice(0, -3)}<br/>
                    <b>설명</b>: {post.features}<br/>
                    <button onClick={() => switchToReportMode(post.id)}>제보하기</button>
                  </Popup>
                </Marker>

                {selectedPostIdForReport === post.id && post.reports && post.reports.length > 0 && (
                  <>
                    {post.reports
                      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                      .map(report => (
                        <Marker key={report.id} position={{ lat: report.lat, lng: report.lng }}>
                          <Popup>
                            {report.imageUrl && <img src={`http://localhost:3001${report.imageUrl}`} alt={report.description} style={{ maxWidth: '150px', maxHeight: '150px', display: 'block', marginBottom: '5px' }} />}
                            <b>제보 시간</b>: {new Date(report.time).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '.').replace(/ /g, '').slice(0, -3)}<br/>
                            <b>제보 장소</b>: {report.geocodedAddress || '불러오는 중...'}<br/>
                            <b>설명</b>: {report.description}
                          </Popup>
                        </Marker>
                      ))}
                    <Polyline
                      key={`polyline-${post.id}`}
                      positions={[
                        post.lastSeenLocation,
                        ...post.reports.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map(report => ({ lat: report.lat, lng: report.lng }))
                      ]}
                      color="blue"
                    />
                  </>
                )}
              </div>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default App;
