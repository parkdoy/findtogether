import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Post, Location } from '../types';
import SignedImage from './SignedImage';
import { type PanelType } from './SlidingPanel'; // Import PanelType

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapEvents = ({ setZoom }: { setZoom: (zoom: number) => void }) => {
  const map = useMap();
  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });
  return null;
};

const MapClickHandler = ({ setLocation, setMapCenter, formMode, setReportLocation }: { setLocation: (location: Location) => void, setMapCenter: (center: [number, number]) => void, formMode: PanelType | null, setReportLocation: (location: Location) => void }) => {
  useMapEvents({
    click(e) {
      if (formMode === 'report') {
        setReportLocation(e.latlng);
      } else if (formMode === 'post') {
        setLocation(e.latlng);
        setMapCenter([e.latlng.lat, e.latlng.lng]);
      }
      // Do nothing on click if formMode is 'list' or null
    },
  });
  return null;
};

const LocationMarker = ({ location }: { location: Location | null }) => {
  return location === null ? null : (
    <Marker position={location}></Marker>
  );
};

interface MapViewProps {
  posts: Post[];
  mapCenter: [number, number];
  zoom: number;
  setZoom: (zoom: number) => void;
  formMode: PanelType | null; // Updated type
  postLocation: Location | null;
  reportLocation: Location | null;
  selectedPostIdForReport: string | null;
  setPostLocation: (location: Location) => void;
  setReportLocation: (location: Location) => void;
  setMapCenter: (center: [number, number]) => void;
  setSelectedPostIdForReport: (id: string | null) => void;
  switchToReportMode: (id: string) => void;
  apiUrl: string;
}

const MapView = ({ 
  posts, 
  mapCenter, 
  zoom,
  setZoom,
  formMode, 
  postLocation, 
  reportLocation, 
  selectedPostIdForReport, 
  setPostLocation, 
  setReportLocation, 
  setMapCenter, 
  setSelectedPostIdForReport, 
  switchToReportMode,
  apiUrl
}: MapViewProps) => {
  const popupRef = useRef<L.Popup>(null);

  const isValidLatLng = (lat: any, lng: any) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  };

  return (
    <div className="map-container" style={{ flex: 1 }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={mapCenter} zoom={zoom} />
        <MapEvents setZoom={setZoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler setLocation={setPostLocation} setMapCenter={setMapCenter} formMode={formMode} setReportLocation={setReportLocation} />
        <LocationMarker location={postLocation} />
        <LocationMarker location={reportLocation} />
        {posts.map(post => {
          const postLatLng = post.lastSeenLocation;
          const isPostLocationValid = isValidLatLng(postLatLng?.lat, postLatLng?.lng);

          return (
            <div key={post.id}>
              {isPostLocationValid && (
                <Marker
                  key={`post-marker-${post.id}`}
                  position={postLatLng}
                  eventHandlers={{
                    click: () => {
                      if (selectedPostIdForReport === post.id) {
                        setSelectedPostIdForReport(null);
                      } else {
                        setSelectedPostIdForReport(post.id);
                        setMapCenter([postLatLng.lat, postLatLng.lng]);
                        setZoom(16);
                      }
                    },
                  }}
                >
                  <Popup ref={popupRef}>
                    {post.imageUrl && (
                      <SignedImage
                        gcsObjectName={post.imageUrl}
                        alt={post.name}
                        apiUrl={apiUrl}
                        style={{ maxWidth: '150px', maxHeight: '150px', display: 'block', marginBottom: '5px' }}
                      />
                    )}
                    <b>이름</b>: {post.name}<br />
                    {post.authorName && <><b>작성자</b>: {post.authorName}<br /></>}
                    <b>장소</b>: {post.geocodedAddress || '불러오는 중...'}<br />
                    <b>날짜</b>: {new Date(post.lastSeenTime).toLocaleString()}<br />
                    <b>설명</b>: {post.features}<br />
                    <button onClick={() => switchToReportMode(post.id)}>제보하기</button>
                  </Popup>
                </Marker>
              )}

              {selectedPostIdForReport === post.id && post.reports && post.reports.length > 0 && (
                <>
                  {post.reports
                    .filter(report => isValidLatLng(report.lat, report.lng)) // Filter out invalid reports
                    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                    .map((report, index) => (
                      <Marker key={index} position={{ lat: report.lat, lng: report.lng }}>
                        <Popup>
                          {report.imageUrl && (
                            <SignedImage
                              gcsObjectName={report.imageUrl}
                              alt={report.description}
                              apiUrl={apiUrl}
                              style={{ maxWidth: '150px', maxHeight: '150px', display: 'block', marginBottom: '5px' }}
                            />
                          )}
                          {report.authorName && <><b>제보자</b>: {report.authorName}<br /></>}
                          <b>제보 시간</b>: {new Date(report.time).toLocaleString()}<br />
                          <b>제보 장소</b>: {report.geocodedAddress || '불러오는 중...'}<br />
                          <b>설명</b>: {report.description}
                        </Popup>
                      </Marker>
                    ))}
                  {isPostLocationValid && post.reports.some(report => isValidLatLng(report.lat, report.lng)) && (
                    <Polyline
                      key={`polyline-${post.id}`}
                      positions={[
                        postLatLng,
                        ...post.reports.filter(report => isValidLatLng(report.lat, report.lng)).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map(report => ({ lat: report.lat, lng: report.lng }))
                      ]}
                      color="blue"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;