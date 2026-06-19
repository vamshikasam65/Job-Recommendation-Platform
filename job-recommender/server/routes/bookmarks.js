import express from 'express';
import Bookmark from '../models/Bookmark.js';
import Job from '../models/Job.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/bookmarks
// @desc    Bookmark a job for the authenticated user
// @access  Private (Requires authentication)
router.post('/bookmarks', auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    // Verify job exists
    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ error: 'Job not found in database.' });
    }

    // Check if duplicate bookmark already exists
    const existingBookmark = await Bookmark.findOne({ userId: req.user.id, jobId });
    if (existingBookmark) {
      return res.status(400).json({ error: 'Job is already bookmarked.' });
    }

    const bookmark = new Bookmark({
      userId: req.user.id,
      jobId
    });

    await bookmark.save();
    
    // Populate job details for return payload
    const populated = await bookmark.populate('jobId');

    res.status(201).json({
      message: 'Job bookmarked successfully.',
      bookmark: populated
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Job ID format.' });
    }
    res.status(500).json({ error: err.message || 'Server error saving bookmark.' });
  }
});

// @route   GET api/bookmarks/:userId
// @desc    Retrieve all bookmarks for a specific user
// @access  Private
router.get('/bookmarks/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is fetching their own bookmarks
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own bookmarks.' });
    }

    // Retrieve bookmarks and populate the full job object details
    const bookmarks = await Bookmark.find({ userId })
      .populate('jobId')
      .sort({ createdAt: -1 });

    // Clean outputs: extract list of jobs
    const bookmarkedJobs = bookmarks.map(b => b.jobId).filter(j => j !== null);

    res.json(bookmarkedJobs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error fetching bookmarks.' });
  }
});

// @route   DELETE api/bookmarks/:jobId
// @desc    Remove a bookmarked job
// @access  Private
router.delete('/bookmarks/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user.id,
      jobId
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found.' });
    }

    res.json({ message: 'Bookmark removed successfully.', jobId });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error removing bookmark.' });
  }
});

export default router;
