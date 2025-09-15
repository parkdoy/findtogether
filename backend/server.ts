import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3001;   

// --- File Upload Setup ---
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

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

// Endpoint to create a new standalone report
app.post('/api/report', upload.single('image'), (req, res) => {
  const { description, lat, lng } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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

app.post('/api/posts', upload.single('image'), (req, res) => {
  const { name, features, lastSeenTime, lastSeenLocation } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

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

app.post('/api/posts/:postId/reports', upload.single('image'), (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const { time, description, location } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
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
