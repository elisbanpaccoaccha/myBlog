import React, { useState } from 'react';
import { actions } from 'astro:actions';
import AuthModal from './AuthModal';

interface LikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  initialUserLikeCount?: number;
}

export default function LikeButton({ postId, initialLikeCount = 0, initialUserLikeCount = 0 }: LikeButtonProps) {
  const [totalLikes, setTotalLikes] = useState(initialLikeCount);
  const [userLikes, setUserLikes] = useState(initialUserLikeCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const MAX_LIKES = 50;
  const isLiked = userLikes > 0;

  const handleLike = async () => {
    if (userLikes >= MAX_LIKES) return; // Ya llegó al límite

    // Optimistic update
    setTotalLikes(prev => prev + 1);
    setUserLikes(prev => prev + 1);
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const { data, error } = await actions.addLike({ postId });
    if (error) {
      // Revert if error
      setTotalLikes(prev => prev - 1);
      setUserLikes(prev => prev - 1);
      if (error.code === 'UNAUTHORIZED') {
        setShowAuthModal(true);
      }
    } else if (data) {
      // Sincronizar el user count local con lo que nos retorna la DB
      // Para evitar que el count total diverja si otro usuario dio like a la vez, 
      // lo ideal sería que el backend retorne el total, pero para este caso
      // mantener la actualización optimista para el total es suficiente.
      setUserLikes(data.count);
    }
  };

  return (
    <>
    <button
      onClick={handleLike}
      type="button"
      className={`action-btn flex items-center justify-center gap-1.5 group relative px-1 rounded-full transition-colors ${userLikes >= MAX_LIKES ? 'cursor-default' : ''}`}
      style={{ width: 'auto', minWidth: '36px' }}
      aria-label="Dar me gusta"
      title={userLikes >= MAX_LIKES ? "Límite de likes alcanzado" : "Dar me gusta"}
    >
      <svg 
        className={`transition-all duration-300 ease-out ${isAnimating ? 'scale-125' : 'scale-100'} ${isLiked ? 'text-slate-900 fill-slate-900' : 'text-[#6b6b6b] fill-transparent group-hover:text-[#1a1a1a]'}`}
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={isLiked ? "0" : "1.8"}
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
      {totalLikes > 0 && (
        <span className={`text-[13px] font-medium pr-1 ${isLiked ? 'text-slate-900' : 'text-[#6b6b6b] group-hover:text-[#1a1a1a]'}`}>
          {totalLikes}
        </span>
      )}
    </button>
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)} 
      title="Inicia sesión para dar Me gusta"
    />
    </>
  );
}
