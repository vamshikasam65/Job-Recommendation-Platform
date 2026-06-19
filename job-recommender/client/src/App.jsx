import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobCard from './components/JobCard';
import SkeletonCard from './components/SkeletonCard';
import SearchHistorySidebar from './components/SearchHistorySidebar';
import ErrorToast from './components/ErrorToast';
import AuthModal from './components/AuthModal';

const API_BASE = 'http://localhost:5002/api';

export default function App() {
  const [skills, setSkills] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');


  // Authentication & Bookmark states
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [view, setView] = useState('search'); // 'search' or 'bookmarks'
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // Fetch search history on startup
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/history`);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to load search history:', err);
    }
  };

  // Fetch bookmarks from Express API using user token
  const fetchBookmarks = async (userId, userToken) => {
    if (!userId || !userToken) return;
    setBookmarksLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/bookmarks/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setBookmarks(response.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setBookmarksLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchBookmarks(user.id, token);
    } else {
      setBookmarks([]);
    }
  }, [user, token]);

  // Request recommendations matching skills
  const getRecommendations = async (searchQuery) => {
    const cleaned = searchQuery.trim();
    if (!cleaned) {
      setError('Please enter at least one skill to match.');
      return;
    }

    setError('');
    setWarning('');
    setLoading(true);
    setRecommendations([]);

    try {
      const response = await axios.post(`${API_BASE}/recommend`, { skills: cleaned });
      setRecommendations(response.data.recommendations);
      setWarning(response.data.warning || '');
      // Refresh history list
      fetchHistory();
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'An error occurred while matching job roles.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    getRecommendations(skills);
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API_BASE}/history`);
      setHistory([]);
    } catch (err) {
      setError('Failed to clear search history from database.');
    }
  };

  const handleSelectHistoryItem = (queryText) => {
    setSkills(queryText);
    setView('search');
    getRecommendations(queryText);
  };

  const handleSuggestionClick = (queryText) => {
    setSkills(queryText);
    setView('search');
    getRecommendations(queryText);
  };

  // Toggle bookmark logic
  const handleToggleBookmark = async (job) => {
    if (!token || !user) {
      setError('Please log in to save and bookmark jobs.');
      setAuthModalOpen(true);
      return;
    }

    const jobId = job._id;
    if (!jobId) {
      setError('Cannot bookmark this job. Job database ID is missing.');
      return;
    }

    const isAlreadyBookmarked = bookmarks.some(b => b._id === jobId);

    try {
      if (isAlreadyBookmarked) {
        // Delete bookmark
        await axios.delete(`${API_BASE}/bookmarks/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarks(prev => prev.filter(b => b._id !== jobId));
      } else {
        // Add bookmark
        await axios.post(`${API_BASE}/bookmarks`, { jobId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Create full job mapping
        setBookmarks(prev => [job, ...prev]);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to toggle bookmark.';
      setError(msg);
    }
  };

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setError('');
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setBookmarks([]);
    setView('search');
    setWarning('');
  };

  return (
    <div className="relative min-h-screen pb-12">
      {/* Background ambient glowing rings */}
      <div className="ambient-glow glow-1 fixed top-[-10%] left-[-10%] w-[600px] h-[600px] pointer-events-none"></div>
      <div className="ambient-glow glow-2 fixed bottom-[-5%] right-[-5%] w-[500px] h-[500px] pointer-events-none"></div>
      <div className="ambient-glow glow-3 fixed top-[40%] left-[45%] w-[400px] h-[400px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="glass-panel sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl border-x-0 border-t-0 bg-opacity-70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-indigo-400 text-2xl"></i>
          <span className="font-head font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            GrowthPath AI
          </span>
        </div>
        
        {/* Nav Tabs & User Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('search')}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              view === 'search' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/35' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Find Jobs
          </button>
          <button 
            onClick={() => {
              if (!user) {
                setError('Please log in to view saved jobs.');
                setAuthModalOpen(true);
              } else {
                setView('bookmarks');
              }
            }}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              view === 'bookmarks' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/35' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Saved Jobs ({bookmarks.length})
          </button>

          <div className="h-4 w-[1px] bg-gray-800 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-medium hidden md:inline max-w-[150px] truncate" title={user.email}>
                {user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/10 active:translate-y-[1px] transition-all"
            >
              Log In / Sign Up
            </button>
          )}
        </div>
      </nav>

      {/* Main Container Layout */}
      <div className="app-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        
        {/* Left Sidebar for Search History */}
        <SearchHistorySidebar 
          history={history} 
          onSelectQuery={handleSelectHistoryItem} 
          onClearAll={handleClearHistory} 
        />

        {/* Main Console Workspace */}
        <main className="flex flex-col gap-8">
          
          {/* SEARCH VIEW */}
          {view === 'search' && (
            <>
              {/* Header Title */}
              <header className="flex flex-col gap-2">
                <h1 className="font-head text-4xl sm:text-5xl font-extrabold tracking-tight">
                  AI-Powered <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Job Recommender</span>
                </h1>
                <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed font-body">
                  Instantly match your developer skills with our job database using advanced Natural Language Processing.
                </p>
              </header>

              {/* Form console panel */}
              <section className="glass-panel p-6 rounded-2xl">
                <form onSubmit={handleFormSubmit} className="w-full">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center bg-black/30 border border-white/10 rounded-xl p-2 gap-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                    <div className="flex items-center gap-3 pl-3 flex-1">
                      <i className="fa-solid fa-code text-indigo-400 text-lg"></i>
                      <input 
                        type="text" 
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="Enter your skills (e.g., Python, Flask, React, Docker, SQL)..." 
                        className="bg-transparent border-none outline-none text-gray-100 text-sm w-full py-2 placeholder-gray-500"
                        disabled={loading}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-head font-semibold text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:translate-y-[1px] disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <>
                          <span>Searching...</span>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                        </>
                      ) : (
                        <>
                          <span>Find Jobs</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Suggestion Tags */}
                <div className="flex flex-wrap items-center gap-2 mt-4 select-none">
                  <span className="text-xs font-semibold text-gray-400">Try these:</span>
                  {[
                    'Python, Flask, Docker',
                    'React, JavaScript, CSS',
                    'PyTorch, Machine Learning',
                    'AWS, Kubernetes, CI/CD'
                  ].map((queryText, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSuggestionClick(queryText)}
                      className="text-[11px] font-medium text-gray-400 bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/35 hover:text-white px-3 py-1.5 rounded-full transition-all"
                    >
                      {queryText}
                    </button>
                  ))}
                </div>
              </section>

              {/* Alert messages */}
              <ErrorToast message={error} onClose={() => setError('')} />

              {warning && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl mb-6 shadow-lg animate-slide-down">
                  <i className="fa-solid fa-triangle-exclamation text-lg flex-shrink-0"></i>
                  <span className="text-sm font-medium flex-1 leading-relaxed">{warning}</span>
                  <button 
                    onClick={() => setWarning('')} 
                    className="text-amber-300 hover:text-white font-bold text-xl leading-none px-1"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Results Area */}
              <section className="flex flex-col gap-6">
                {/* Loading skeletons */}
                {loading && (
                  <div className="flex flex-col gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                )}

                {/* Empty State */}
                {!loading && recommendations.length === 0 && (
                  <div className="flex flex-col items-center text-center py-20 px-4">
                    <div className="w-20 h-20 bg-indigo-500/5 border border-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                      <i className="fa-solid fa-briefcase text-3xl text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]"></i>
                    </div>
                    <h3 className="font-head font-semibold text-xl text-gray-200 mb-2">Ready to find your match?</h3>
                    <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-body">
                      Enter your skills above to get matching recommendations scored by our AI similarity engine.
                    </p>
                  </div>
                )}

                {/* Recommended Job List Grid */}
                {!loading && recommendations.length > 0 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="font-head font-bold text-2xl text-gray-100 flex items-center gap-2">
                      <i className="fa-solid fa-star text-indigo-400"></i> Top Recommended Jobs
                    </h2>
                    <div className="flex flex-col gap-6">
                      {recommendations.map((job, idx) => (
                        <JobCard 
                          key={idx} 
                          job={job} 
                          index={idx} 
                          isLoggedIn={!!user}
                          isBookmarked={bookmarks.some(b => b._id === job._id)}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* SAVED JOBS BOOKMARKS VIEW */}
          {view === 'bookmarks' && (
            <>
              {/* Header Title */}
              <header className="flex flex-col gap-2">
                <h1 className="font-head text-4xl sm:text-5xl font-extrabold tracking-tight">
                  Your Saved <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Bookmarks</span>
                </h1>
                <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed font-body">
                  Manage your bookmarked job listings, review skill requirements, and follow custom educational guides.
                </p>
              </header>

              {/* Alert messages */}
              <ErrorToast message={error} onClose={() => setError('')} />

              {/* Saved list */}
              <section className="flex flex-col gap-6">
                {bookmarksLoading && (
                  <div className="flex flex-col gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                )}

                {!bookmarksLoading && bookmarks.length === 0 && (
                  <div className="flex flex-col items-center text-center py-20 px-4">
                    <div className="w-20 h-20 bg-amber-500/5 border border-amber-500/10 rounded-full flex items-center justify-center mb-6">
                      <i className="fa-solid fa-bookmark text-3xl text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]"></i>
                    </div>
                    <h3 className="font-head font-semibold text-xl text-gray-200 mb-2">No bookmarks saved yet</h3>
                    <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-body">
                      Search for jobs using your skills and click the bookmark icon to save jobs here.
                    </p>
                  </div>
                )}

                {!bookmarksLoading && bookmarks.length > 0 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="font-head font-bold text-2xl text-gray-100 flex items-center gap-2">
                      <i className="fa-solid fa-bookmark text-amber-400"></i> Bookmarked Jobs
                    </h2>
                    <div className="flex flex-col gap-6">
                      {bookmarks.map((job, idx) => (
                        <JobCard 
                          key={job._id || idx} 
                          job={{...job, score: job.score || 100}} // default score to 100 on saved page
                          index={idx} 
                          isLoggedIn={true}
                          isBookmarked={true}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

        </main>
      </div>

      {/* Authentication Modal Popup */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
