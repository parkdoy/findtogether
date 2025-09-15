import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // This will be removed
import axios from 'axios';
import { Storage } from '@google-cloud/storage'; // Added

const app = express();
const port = process.env.PORT || 3001;

// --- Google Cloud Storage Setup --- // Added
const storageClient = new Storage();
// IMPORTANT: Replace 'your-gcs-bucket-name' with your actual GCS bucket name.
// You can also set this via an environment variable (e.g., GCS_BUCKET_NAME)
const bucketName = process.env.GCS_BUCKET_NAME || 'findtogetherbucket'; // Placeholder bucket name
const bucket = storageClient.bucket(bucketName);

// --- File Upload Setup ---
// Removed local uploadsDir and fs.mkdirSync
// const uploadsDir = path.join(__dirname, 'uploads');
// fs.mkdirSync(uploadsDir, { recursive: true });

// Changed to memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

// Removed serving static files from the uploads directory
// app.use('/uploads', express.static(uploadsDir));

// --- Data Structures ---
interface Report {
  id: number;
  lat: number;
  lng: number;
  time: string;
  description: string;
  imageUrl?: string; // Optional image URL
}

interface Post {
  id: number;
  name: string;
  features: string;
  lastSeenTime: string;
  lastSeenLocation: { lat: number; lng: number };
  reports: Report[];
  imageUrl?: string; // Optional image URL
}

// --- In-Memory Database ---
let posts: Post[] = [];
let reports: Report[] = []; // New top-level reports array
let nextPostId = 1;
let nextReportId = 1;

app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// --- API Endpoints ---

// Geocoding endpoint
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ message: 'Address is required' });
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'FindTogetherApp/1.0 (my@email.com)' // Nominatim requires a User-Agent
      }
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      res.json({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Failed to geocode address' });
  }
});

// Endpoint to get all reports for the heatmap
app.get('/api/reports', (req, res) => {
  res.json(reports);
});

// Helper function to upload file to GCS
const uploadFileToGCS = async (file: Express.Multer.File): Promise<string> => {
  const uniqueFileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
  const blob = bucket.file(uniqueFileName);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => {
      // Make the file publicly accessible
      // This requires the bucket to have appropriate IAM permissions (e.g., allUsers:objectViewer)
      // Or you can generate signed URLs for private buckets
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });
    blobStream.end(file.buffer);
  });
};


// Endpoint to create a new standalone report
app.post('/api/report', upload.single('image'), async (req, res) => { // Made async
  const { description, lat, lng } = req.body;
  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadFileToGCS(req.file);
    } catch (error) {
      console.error('Error uploading image to GCS:', error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }

  if (!description || !lat || !lng) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newReport: Report = {
    id: nextReportId++,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    time: new Date().toISOString(),
    description,
    imageUrl,
  };

  reports.push(newReport);
  console.log('New report added:', newReport);
  res.status(201).json(newReport);
});

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', upload.single('image'), async (req, res) => { // Made async
  const { name, features, lastSeenTime, lastSeenLocation } = req.body;
  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadFileToGCS(req.file);
    } catch (error) {
      console.error('Error uploading image to GCS:', error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }

  // lastSeenLocation will be a JSON string, so we need to parse it
  const parsedLocation = JSON.parse(lastSeenLocation);

  if (!name || !lastSeenTime || !parsedLocation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newPost: Post = {
    id: nextPostId++,
    name,
    features,
    lastSeenTime,
    lastSeenLocation: parsedLocation,
    imageUrl,
    reports: [],
  };

  posts.push(newPost);
  console.log('New post added:', newPost);
  res.status(201).json(newPost);
});

app.post('/api/posts/:postId/reports', upload.single('image'), async (req, res) => { // Made async
  const postId = parseInt(req.params.postId, 10);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const { time, description, location } = req.body;
  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadFileToGCS(req.file);
    } catch (error) {
      console.error('Error uploading image to GCS:', error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }

  const parsedLocation = JSON.parse(location);

  if (!time || !parsedLocation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newReport: Report = {
    id: nextReportId++,
    lat: parsedLocation.lat,
    lng: parsedLocation.lng,
    time,
    description,
    imageUrl,
  };

  post.reports.push(newReport);
  console.log(`New report added to post ${postId}:`, newReport);
  res.status(201).json(newReport);
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});