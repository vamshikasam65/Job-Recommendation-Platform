import React, { useEffect, useState } from 'react';

export default function JobCard({ job, index, isLoggedIn, isBookmarked, onToggleBookmark }) {
  const [barWidth, setBarWidth] = useState('0%');

  // Trigger smooth progress bar fill animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidth(`${job.score}%`);
    }, 100);
    return () => clearTimeout(timer);
  }, [job.score]);

  return (
    <article 
      className="job-card glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col gap-4 transition-all duration-300 transform hover:-translate-y-1 relative"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 pr-6">
          <h3 className="font-head font-bold text-xl text-gray-100 mb-1">{job.title}</h3>
          <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Recommendation Match</p>
        </div>

        {/* Bookmark Trigger Button */}
        <button
          onClick={() => onToggleBookmark(job)}
          className={`absolute top-6 right-6 p-2.5 rounded-xl border transition-all ${
            isBookmarked 
              ? 'bg-amber-500/15 border-amber-500/35 text-amber-400' 
              : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-200 hover:border-white/10'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this job'}
        >
          <i className={`${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark text-sm`}></i>
        </button>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed font-body">{job.description}</p>

      {/* Match Score Indicator */}
      <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl w-fit">
        <span className="font-head font-extrabold text-lg bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          {job.score}%
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Match Score</span>
        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: barWidth }}
          />
        </div>
      </div>

      {/* Skills Comparison Lists */}
      <div className="pt-4 border-t border-gray-800/50 flex flex-col gap-3">
        {job.matched_skills && job.matched_skills.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 w-24 flex items-center gap-1.5 flex-shrink-0">
              <i className="fa-solid fa-check-circle text-emerald-500"></i> Matched:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.matched_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.missing_skills && job.missing_skills.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 w-24 flex items-center gap-1.5 flex-shrink-0">
              <i className="fa-solid fa-circle-info text-gray-500"></i> Missing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.missing_skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-800/40 border border-gray-700/30 text-gray-500"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Learning Paths Section */}
      {job.learning_paths && job.learning_paths.length > 0 && (
        <div className="pt-4 border-t border-gray-800/50 flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <i className="fa-solid fa-graduation-cap text-indigo-400"></i> Suggested Learning Paths:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {job.learning_paths.map((path, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/8 hover:border-indigo-500/20 hover:bg-indigo-500/[0.05] transition-all group"
              >
                <i className="fa-solid fa-circle-play text-indigo-400 text-xs group-hover:text-indigo-300 transition-colors"></i>
                <span className="text-xs font-medium text-gray-300 group-hover:text-gray-100 transition-colors">
                  {path}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
