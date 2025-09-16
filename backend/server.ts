import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import { Storage } from '@google-cloud/storage';

const app = express();
const port = process.env.PORT || 3001;

// --- Google Cloud Storage Setup ---
const storageClient = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'findtogetherbucket';
const bucket = storageClient.bucket(bucketName);

// --- File Upload Setup ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Data Structures ---
interface Report {
  id: number;
  lat: number;
  lng: number;
  time: string;
  description: string;
  imageUrl?: string; // Now stores GCS object name
}

interface Post {
  id: number;
  name: string;
  features: string;
  lastSeenTime: string;
  lastSeenLocation: { lat: number; lng: number };
  reports: Report[];
  imageUrl?: string; // Now stores GCS object name
}

// --- In-Memory Database ---
let posts: Post[] = [];
let reports: Report[] = [];
let nextPostId = 1;
let nextReportId = 1;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
        'User-Agent': 'FindTogetherApp/1.0 (my@email.com)'
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
// Now returns the object name instead of a public URL
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
      // Return the object name, not a public URL
      resolve(blob.name);
    });
    blobStream.end(file.buffer);
  });
};

// NEW: Endpoint to generate a signed URL for a GCS object
app.get('/api/signed-url', async (req, res) => {
  const { filename } = req.query;

  // 1. [DEBUG] Log the received filename
  console.log('1. [DEBUG] API call received for filename:', filename);
  
  if (!filename || typeof filename !== 'string') {
    console.error('2. [DEBUG] Error: Filename is missing or not a string');
    return res.status(400).json({ message: 'Filename is required' });
  }

  // Debugging the bucket and storage client
  const storageClient = new Storage();
  const bucketName = process.env.GCS_BUCKET_NAME || 'findtogetherbucket';
  const bucket = storageClient.bucket(bucketName);
  
  console.log('3. [DEBUG] Using bucket name:', bucketName);
  console.log('4. [DEBUG] Bucket object:', bucket);

  try {
    const options = {
      version: 'v4' as 'v4', // Specify v4 signed URL
      action: 'read' as 'read',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    const [url] = await bucket.file(filename).getSignedUrl(options);
    
    // 5. [DEBUG] Log the generated URL on success
    console.log('5. [DEBUG] Signed URL generated successfully:', url);
    
    res.json({ signedUrl: url });
  } catch (error) {
    // 6. [DEBUG] Log the full error object on failure
    console.error('6. [DEBUG] Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
});

// Endpoint to create a new standalone report
app.post('/api/report', upload.single('image'), async (req, res) => {
  const { description, lat, lng } = req.body;
  let imageUrl: string | undefined; // This will now store the GCS object name

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

app.post('/api/posts', upload.single('image'), async (req, res) => {
  const { name, features, lastSeenTime, lastSeenLocation } = req.body;
  let imageUrl: string | undefined; // This will now store the GCS object name

  if (req.file) {
    try {
      imageUrl = await uploadFileToGCS(req.file);
    } catch (error) {
      console.error('Error uploading image to GCS:', error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }

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

app.post('/api/posts/:postId/reports', upload.single('image'), async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const { time, description, location } = req.body;
  let imageUrl: string | undefined; // This will now store the GCS object name

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
