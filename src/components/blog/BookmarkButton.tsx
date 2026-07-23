import React, { useState } from 'react';
import { actions } from 'astro:actions';

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
}

export default function BookmarkButton({ postId, initialBookmarked = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggle = async () => {
    const previousState = isBookmarked;
    // Optimistic UI update
    setIsBookmarked(!previousState);
    
    // Trigger tiny bounce animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const { data, error } = await actions.toggleBookmark({ postId });
    if (error) {
      // Revert if backend fails (e.g., unauthorized)
      setIsBookmarked(previousState);
      if (error.code === 'UNAUTHORIZED') {
        alert('Por favor, inicia sesión para guardar artículos.');
      }
    } else if (data) {
      // Sync with truth just in case
      setIsBookmarked(data.bookmarked);
    }
  };

  return (
    <button
      onClick={toggle}
      type="button"
      className="action-btn group relative"
      aria-label={isBookmarked ? "Quitar de guardados" : "Guardar para después"}
      title={isBookmarked ? "Quitar de guardados" : "Guardar para después"}
    >
      <svg 
        className={`transition-all duration-300 ease-out ${isAnimating ? 'scale-125' : 'scale-100'} ${isBookmarked ? 'text-emerald-600 fill-emerald-600' : 'text-[#6b6b6b] fill-transparent group-hover:text-[#1a1a1a]'}`}
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={isBookmarked ? "0" : "1.8"}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
      </svg>
    </button>
  );
}
