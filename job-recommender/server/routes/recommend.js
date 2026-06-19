import express from 'express';
import axios from 'axios';
import SearchHistory from '../models/SearchHistory.js';
import Job from '../models/Job.js';


const router = express.Router();

// @route   POST api/recommend
// @desc    Get job recommendations and save history to MongoDB
router.post('/recommend', async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !skills.trim()) {
      return res.status(400).json({ error: 'Skills field cannot be empty. Please enter your skills.' });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5005/predict';

    // Forward request to Flask microservice
    const mlResponse = await axios.post(mlServiceUrl, { skills });
    const recommendedJobs = mlResponse.data.recommendations;

    // Resolve MongoDB Job _id for each recommendation to support Bookmarks linking
    const populatedRecommendations = await Promise.all(
      recommendedJobs.map(async (rec) => {
        const dbJob = await Job.findOne({ title: rec.title });
        return {
          ...rec,
          _id: dbJob ? dbJob._id : null
        };
      })
    );

    // Prevent duplicate entries by updating the timestamp of an existing query
    const cleanedQuery = skills.trim();
    const existingHistory = await SearchHistory.findOne({
      skills: { $regex: new RegExp(`^${cleanedQuery}$`, 'i') }
    });

    if (existingHistory) {
      existingHistory.createdAt = Date.now();
      existingHistory.recommended_jobs = populatedRecommendations;
      await existingHistory.save();
    } else {
      const historyItem = new SearchHistory({
        skills: cleanedQuery,
        recommended_jobs: populatedRecommendations
      });
      await historyItem.save();
    }

    res.json({
      query: skills,
      recommendations: populatedRecommendations,
      warning: mlResponse.data.warning || ''
    });
  } catch (error) {
    console.error('Error in recommend route:', error.message);
    
    // Check if error is from the Axios call to the ML service
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error || 'AI Microservice returned an error.'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(502).json({ error: 'AI Microservice is currently offline or unreachable. Please try again later.' });
    }
    res.status(500).json({ error: error.message || 'An error occurred while processing recommendations.' });
  }
});

// @route   GET api/history
// @desc    Get recent search history from MongoDB
router.get('/history', async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve search history.' });
  }
});

// @route   DELETE api/history
// @desc    Clear search history from MongoDB
router.delete('/history', async (req, res) => {
  try {
    await SearchHistory.deleteMany({});
    res.json({ message: 'Search history cleared successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear search history.' });
  }
});

export default router;
