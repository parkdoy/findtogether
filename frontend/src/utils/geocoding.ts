import type { Post, Report } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const geocodeLocation = async (lat: number, lng: number): Promise<string> => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates provided for reverse geocoding:', lat, lng);
    return '유효하지 않은 좌표';
  }

  try {
    const res = await fetch(`${API_URL}/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) {
      throw new Error(`Reverse geocoding failed with status: ${res.status}`);
    }
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

export const updateGeocodedAddresses = async (posts: Post[]): Promise<Post[]> => {
  const postsToUpdate = posts.filter(post => !post.geocodedAddress || (post.reports && post.reports.some(report => !report.geocodedAddress)));

  if (postsToUpdate.length === 0) {
    return posts;
  }

  const updatedPosts = await Promise.all(posts.map(async post => {
    const postAddress = !post.geocodedAddress
      ? await geocodeLocation(post.lastSeenLocation.lat, post.lastSeenLocation.lng)
      : post.geocodedAddress;

    const updatedReports = post.reports ? await Promise.all(post.reports.map(async (report: Report) => {
      const reportAddress = !report.geocodedAddress
        ? await geocodeLocation(report.lat, report.lng)
        : report.geocodedAddress;
      return { ...report, geocodedAddress: reportAddress };
    })) : [];

    return { ...post, geocodedAddress: postAddress, reports: updatedReports };
  }));

  return updatedPosts;
};
