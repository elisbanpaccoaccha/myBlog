import React, { useState, useEffect, useRef } from 'react';

interface ShareButtonProps {
  title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareOn = (platform: 'facebook' | 'linkedin' | 'x') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
    }
    
    const width = 600;
    const height = 400;
    // Calcular el centro de la pantalla actual (soporta configuraciones de múltiples monitores)
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(shareUrl, '_blank', `width=${width},height=${height},left=${left},top=${top}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="action-btn group text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors" 
        type="button" 
        aria-label="Compartir"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[240px] bg-white rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 py-2">
          {/* Arrow pointing up */}
          <div className="absolute -top-[6px] right-[10px] w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45 rounded-tl-[1px]"></div>
          
          <button 
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9] transition-colors text-left"
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            )}
            {copied ? 'Enlace copiado' : 'Copy link'}
          </button>

          <div className="h-[1px] w-full bg-[#f2f2f2] my-1"></div>

          <button 
            onClick={() => shareOn('facebook')}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9] transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Share on Facebook
          </button>

          <button 
            onClick={() => shareOn('linkedin')}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9] transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Share on LinkedIn
          </button>

          <button 
            onClick={() => shareOn('x')}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9] transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Share on X
          </button>
        </div>
      )}
    </div>
  );
}
