import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  skills: { type: String, required: true },
  recommended_jobs: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
