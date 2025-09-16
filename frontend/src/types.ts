// --- Interfaces for Firestore Data Model --- //

import { Timestamp } from "firebase/firestore";

// Note: When fetching from Firestore, GeoPoint and Timestamp objects
// will be handled. The client-side model reflects the data structure.

export interface Report {
  id: string; // Firestore document ID
  lat: number;
  lng: number;
  time: string; // ISO 8601 date string
  description: string;
  imageUrl?: string;
  createdAt: Timestamp;
  geocodedAddress?: string;
}

export interface Post {
  id: string; // Firestore document ID
  name: string;
  features: string;
  lastSeenTime: string; // ISO 8601 date string
  // In Firestore, this would ideally be a GeoPoint.
  lastSeenLocation: { lat: number; lng: number };
  // In a more complex model, reports could be a subcollection in Firestore.
  reports: Report[];
  imageUrl?: string;
  createdAt: Timestamp;
  geocodedAddress?: string;
}

export interface Location {
  lat: number;
  lng: number;
}
