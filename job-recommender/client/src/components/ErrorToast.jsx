import React from 'react';

export default function ErrorToast({ message, onClose }) {
  if (!message) return null;
  
  return (
    <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl mb-6 shadow-lg animate-slide-down">
      <i className="fa-solid fa-triangle-exclamation text-lg flex-shrink-0"></i>
      <span className="text-sm font-medium flex-1 leading-relaxed">{message}</span>
      <button 
        onClick={onClose} 
        className="text-rose-300 hover:text-white font-bold text-xl leading-none px-1"
      >
        &times;
      </button>
    </div>
  );
}
