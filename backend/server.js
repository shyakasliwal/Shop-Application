const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://shop-application-phi.vercel.app',
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'OTP Auth API running' });
});

// Return 503 when MongoDB is not connected so the frontend gets a clear message
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Set MONGODB_URI in backend/.env and ensure MongoDB is running.' });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// Start server first so it runs even when MongoDB is unavailable (e.g. local dev without DB)
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

if (!mongoUri) {
  console.warn('Missing MONGODB_URI in backend/.env — set it to use login and products. Server is running.');
} else {
  const mongooseOptions = { serverSelectionTimeoutMS: 10000 };
  mongoose.connect(mongoUri, mongooseOptions).then(() => {
    console.log('Connected to MongoDB');
  }).catch((err) => {
    console.error('MongoDB connection error:', err.message || err);
    if (String(err.code || err.message || '').includes('ECONNREFUSED') || String(err.message || '').includes('querySrv')) {
      console.error('Tip: Use MongoDB Atlas URI in backend/.env or start MongoDB locally (mongodb://localhost:27017/productiolo).');
    }
  });
}

