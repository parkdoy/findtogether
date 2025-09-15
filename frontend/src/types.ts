// --- Interfaces --- //
export interface Report {
  id: number;
  lat: number;
  lng: number;
  time: string;
  description: string;
  imageUrl?: string; // Optional GCS object name
  geocodedAddress?: string; // Added for geocoded address
}

export interface Post {
  id: number;
  name: string;
  features: string;
  lastSeenTime: string;
  lastSeenLocation: { lat: number; lng: number };
  reports: Report[];
  imageUrl?: string; // Optional GCS object name
  geocodedAddress?: string; // Added for geocoded address
}

export interface Location {
  lat: number;
  lng: number;
}