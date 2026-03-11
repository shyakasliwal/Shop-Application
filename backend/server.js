const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'OTP Auth API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

// If you get querySrv ECONNREFUSED: your network/DNS blocks SRV lookups.
// In Atlas: Connect → "Connect using MongoDB Compass" → copy the standard URI
// (starts with mongodb://, not mongodb+srv://) and use it as MONGODB_URI.
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
};

mongoose
  .connect(mongoUri, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err.message || err);
    if (
      String(err.code || err.message || '').includes('ECONNREFUSED') ||
      String(err.message || '').includes('querySrv')
    ) {
      console.error('\n--- If your URI is correct, the SRV DNS lookup may be blocked. ---');
      console.error('Fix: In MongoDB Atlas use Connect → "Connect using MongoDB Compass"');
      console.error('     and copy the standard URI (mongodb://... not mongodb+srv://...).');
      console.error('     Set that as MONGODB_URI in your .env file.\n');
    }
    process.exit(1);
  });

