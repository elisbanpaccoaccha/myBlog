import React, { useState, useRef, useEffect } from 'react';

export default function UserProfileDropdown({ displayName = 'Administrador', avatarUrl = '' }: { displayName?: string; avatarUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'A';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative ml-2 pl-6 border-l border-gray-200 flex items-center" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
        aria-label="Menú de usuario"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
        ) : (
          initial
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {displayName}
          </div>
          <a href="/studio/perfil" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            Ajustes
          </a>
          <hr className="my-1 border-slate-200" />
          <form method="POST" action="/api/auth/logout" className="m-0">
            <button type="submit" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none">
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
