import React from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function AuthModal({ isOpen, onClose, title = "Únete a la conversación" }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        
        <div className="p-8 text-center pt-10">
          <h2 className="text-[26px] font-bold text-slate-900 mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{title}</h2>
          <p className="text-slate-600 mb-8 text-[15px] leading-relaxed px-4">
            Crea una cuenta para aplaudir, guardar historias y compartir tus ideas.
          </p>
          
          <div className="space-y-3">
            <a 
              href="/register"
              className="flex items-center justify-center w-full py-3 px-4 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-slate-700 font-medium text-[15px]"
            >
              <svg className="w-5 h-5 mr-2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Registrarse con correo electrónico
            </a>
            
            <p className="text-[14px] text-slate-500 mt-6 pt-6">
              ¿Ya tienes una cuenta? <a href="/login" className="text-emerald-700 font-semibold hover:underline">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
