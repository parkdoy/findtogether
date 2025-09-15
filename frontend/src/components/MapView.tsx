import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Post, Location } from '../types';
import SignedImage from './SignedImage'; // New import

// --- Map Components --- //

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapEvents = ({ setZoom }: { setZoom: (zoom: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });
  return null;
};

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

interface MapViewProps {
  posts: Post[];
  mapCenter: [number, number];
  zoom: number;
  setZoom: (zoom: number) => void;
  formMode: 'post' | 'report';
  postLocation: Location | null;
  reportLocation: Location | null;
  selectedPostIdForReport: number | null;
  setPostLocation: (location: Location) => void;
  setReportLocation: (location: Location) => void;
  setMapCenter: (center: [number, number]) => void;
  setSelectedPostIdForReport: (id: number | null) => void;
  switchToReportMode: (id: number) => void;
  apiUrl: string; // Added
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
  apiUrl // Added
}: MapViewProps) => {
  const popupRef = useRef<L.Popup>(null);

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
        {posts.map(post => (
          <div key={post.id}>
            <Marker
              key={`post-marker-${post.id}`}
              position={post.lastSeenLocation}
              eventHandlers={{
                click: () => {
                  setSelectedPostIdForReport(post.id);
                  setMapCenter([post.lastSeenLocation.lat, post.lastSeenLocation.lng]);
                  setZoom(16);
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
                <b>장소</b>: {post.geocodedAddress || '불러오는 중...'}<br />
                <b>날짜</b>: {new Date(post.lastSeenTime).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '.').replace(/ /g, '').slice(0, -3)}<br />
                <b>설명</b>: {post.features}<br />
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
                        {report.imageUrl && (
                          <SignedImage
                            gcsObjectName={report.imageUrl}
                            alt={report.description}
                            apiUrl={apiUrl}
                            style={{ maxWidth: '150px', maxHeight: '150px', display: 'block', marginBottom: '5px' }}
                          />
                        )}
                        <b>제보 시간</b>: {new Date(report.time).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '.').replace(/ /g, '').slice(0, -3)}<br />
                        <b>제보 장소</b>: {report.geocodedAddress || '불러오는 중...'}<br />
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
  );
}

export default MapView;