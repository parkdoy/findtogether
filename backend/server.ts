import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';

const app = express();
const port = process.env.PORT || 3001;

// --- Firebase/Firestore Setup ---
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (serviceAccountPath) {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// --- Google Cloud Storage Setup ---
const storageClient = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'findtogetherbucket';
const bucket = storageClient.bucket(bucketName);

// --- File Upload Setup ---
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Authentication Middleware ---
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token.' });
  }

  const idToken = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken; // Attach user info to request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid token.' });
  }
};


// --- API Endpoints ---

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Email, password, and username are required.' });
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });

    // Save additional user info (like username) in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      username: username,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'User created successfully', uid: userRecord.uid });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: `Failed to create user: ${error.message}` });
  }
});

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
app.get('/api/reports', async (req, res) => {
    try {
        const reportsSnapshot = await db.collection('reports').get();
        const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
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
      resolve(blob.name);
    });
    blobStream.end(file.buffer);
  });
};

// Endpoint to generate a signed URL for a GCS object
app.get('/api/signed-url', async (req, res) => {
  const { filename } = req.query;
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Filename is required' });
  }

  try {
    const options = {
      version: 'v4' as 'v4',
      action: 'read' as 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const [url] = await bucket.file(filename).getSignedUrl(options);
    res.json({ signedUrl: url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
});

// Endpoint to create a new standalone report
app.post('/api/report', upload.single('image'), async (req, res) => {
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

    try {
        const newReport = {
            description,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            time: new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            imageUrl,
        };
        const docRef = await db.collection('reports').add(newReport);
        res.status(201).json({ id: docRef.id, ...newReport });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Failed to create report' });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const postsSnapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        const posts = postsSnapshot.docs.map(doc => {
            const data = doc.data();
            let lastSeenLocation = data.lastSeenLocation;
            if (lastSeenLocation && typeof lastSeenLocation.latitude === 'number' && typeof lastSeenLocation.longitude === 'number') {
                lastSeenLocation = { lat: lastSeenLocation.latitude, lng: lastSeenLocation.longitude };
            } else {
                // Default to a safe value if lastSeenLocation is missing or invalid
                lastSeenLocation = { lat: 0, lng: 0 }; 
            }

            const reports = data.reports ? data.reports.map((report: any) => {
                let reportLat = report.lat;
                let reportLng = report.lng;
                if (typeof reportLat !== 'number' || typeof reportLng !== 'number') {
                    reportLat = 0; // Default to a safe value
                    reportLng = 0; // Default to a safe value
                }
                return { ...report, lat: reportLat, lng: reportLng };
            }) : [];

            return { id: doc.id, ...data, lastSeenLocation, reports };
        });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Failed to fetch posts' });
    }
});

app.post('/api/posts', authenticate, upload.single('image'), async (req, res) => {
    const { name, features, lastSeenTime, lastSeenLocation } = req.body;
    const user = (req as any).user;
    let imageUrl: string | undefined;

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

    try {
        const newPost = {
            name,
            features,
            lastSeenTime,
            lastSeenLocation: new admin.firestore.GeoPoint(parsedLocation.lat, parsedLocation.lng),
            imageUrl,
            reports: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            authorId: user.uid,
            authorName: user.name || user.email, // Use displayName or fallback to email
        };
        const docRef = await db.collection('posts').add(newPost);
        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Failed to create post' });
    }
});

app.delete('/api/posts/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    const user = (req as any).user;

    try {
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const postData = postDoc.data();
        if (postData?.authorId !== user.uid) {
            return res.status(403).json({ message: 'Forbidden: You are not the author of this post.' });
        }

        await postRef.delete();
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(`Error deleting post ${postId}:`, error);
        res.status(500).json({ message: 'Failed to delete post' });
    }
});

// Helper function to remove undefined properties from an object
const removeUndefined = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    } else if (obj[key] === null) {
      // Optionally, handle null values if Firestore also rejects them in certain contexts
      // For now, we'll just exclude undefined.
    }
  }
  return newObj;
};

app.post('/api/posts/:postId/reports', upload.single('image'), async (req, res) => {
    const { postId } = req.params;
    const { time, description, location, authorName } = req.body;
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

    try {
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newReport: any = {
            lat: parsedLocation.lat,
            lng: parsedLocation.lng, // 오타 수정: parsedLocation.lat -> parsedLocation.lng
            time,
            description,
            createdAt: new Date(),
            authorName,
        };

        if (imageUrl) {
            newReport.imageUrl = imageUrl;
        }

        const cleanedReport = removeUndefined(newReport); // undefined 속성 제거

        await postRef.update({
            reports: admin.firestore.FieldValue.arrayUnion(cleanedReport) // 정리된 객체 사용
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error(`Error adding report to post ${postId}:`, error);
        res.status(500).json({ message: 'Failed to add report to post' });
    }
});

// Endpoint for reverse geocoding
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'FindTogetherApp/1.0 (my@email.com)' // Use your actual app name and email
      }
    });

    if (response.data) {
      res.json(response.data);
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ message: 'Failed to reverse geocode coordinates' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});