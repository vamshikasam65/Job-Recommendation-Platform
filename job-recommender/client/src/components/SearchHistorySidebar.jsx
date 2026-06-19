import React from 'react';

export default function SearchHistorySidebar({ history, onSelectQuery, onClearAll }) {
  return (
    <aside className="glass-panel p-6 rounded-2xl flex flex-col h-fit sticky top-10">
      <div className="flex justify-between items-center pb-3 border-b border-gray-800/80 mb-5">
        <h2 className="font-head font-semibold text-lg text-gray-100 flex items-center gap-2">
          <i className="fa-solid fa-history text-indigo-400"></i> Search History
        </h2>
        {history && history.length > 0 && (
          <button 
            onClick={onClearAll} 
            className="text-gray-400 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 p-2 rounded-lg transition-all"
            title="Clear search history"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        )}
      </div>

      {(!history || history.length === 0) ? (
        <p className="text-xs text-gray-500 text-center py-8 italic font-medium">No recent searches</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 select-none scrollbar-thin">
          {history.map((item, idx) => (
            <li 
              key={item._id || idx}
              onClick={() => onSelectQuery(item.skills)}
              className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
            >
              <span className="text-xs text-gray-300 font-medium truncate max-w-[170px]" title={item.skills}>
                {item.skills}
              </span>
              <i className="fa-solid fa-arrow-right-long text-[10px] text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"></i>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
