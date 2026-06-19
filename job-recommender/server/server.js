import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import recommendRoutes from './routes/recommend.js';
import authRoutes from './routes/auth.js';
import bookmarksRoutes from './routes/bookmarks.js';
import Job from './models/Job.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', recommendRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', bookmarksRoutes);


// Seeding logic helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedJobsDatabase = async () => {
  try {
    const count = await Job.countDocuments();
    if (count === 0) {
      console.log('Mongoose seeding check: Jobs collection is empty. Seeding starting...');
      
      const jobsPath = path.join(__dirname, '../ml-service/jobs.json');
      const rawData = await fs.readFile(jobsPath, 'utf8');
      const jobsList = JSON.parse(rawData);
      
      await Job.insertMany(jobsList);
      console.log(`Successfully seeded ${jobsList.length} jobs into the MongoDB jobs collection.`);
    } else {
      console.log(`Mongoose seeding check: Database already has ${count} jobs. Seeding skipped.`);
    }
  } catch (error) {
    console.error('Failed to seed jobs collection in MongoDB:', error.message);
  }
};

// Database Connection & Server Boot
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-recommender';

mongoose.connect(dbUri)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    // Run self-seeding
    await seedJobsDatabase();
    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB database connection failure:', err.message);
    process.exit(1);
  });
export default app;
