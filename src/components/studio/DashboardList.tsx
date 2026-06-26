import React from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import { actions } from 'astro:actions';

interface Post {
  id: string;
  title: string;
  slug: string;
  readingTime: number;
  published: boolean;
  status: string;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// const formatPostDate = (dateStr: string | null) => {
//   if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
//     return 'Reciente';
//   }
//   const d = new Date(dateStr);
//   if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Reciente';
//   return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric'});
// };

const formatPostDateTime = (dateStr: string | null) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
    return { date: 'Reciente', time: '' };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return { date: 'Reciente', time: '' };
  
  const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '');
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

// Fetcher usando Astro Actions
const fetchPosts = async () => {
  const { data, error } = await actions.getPosts();
  if (error) throw new Error(error.message);
  console.log("CLIENT fetchPosts data:", data);
  return data as Post[];
};

interface DashboardProps {
  initialPosts: Post[];
}

export default function DashboardList({ initialPosts }: DashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [openMenu, setOpenMenu] = React.useState<{ id: string, top?: number, bottom?: number, right: number } | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    
    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpenMenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // SWR aplica Client-side Caching, Cache-First Strategy y Deduplication por defecto
  // Usamos fallbackData para SSR instantáneo y revalidación en background
  const { data: posts = initialPosts, error, mutate } = useSWR<Post[]>('getPosts', fetchPosts, {
    fallbackData: initialPosts,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${title}"?`)) return;

    // Optimistic UI update (borrar visualmente antes de que termine el backend)
    mutate(posts.filter(p => p.id !== id), false);

    const { error } = await actions.deletePost({ id });
    if (error) {
      alert('Error al eliminar el post');
      mutate(); // Revertir en caso de error
    } else {
      mutate(); // Confirmar cambios
    }
  };

  const handleDuplicate = async (id: string) => {
    setOpenMenu(null);
    const { error } = await actions.duplicatePost({ id });
    if (error) {
      alert(`Error al duplicar el post: ${error.message}`);
    } else {
      mutate(); // Refrescar la lista de posts
    }
  };

  const handleShare = async (slug: string) => {
    setOpenMenu(null);
    try {
      const url = `${window.location.origin}/blog/${slug}`;
      await navigator.clipboard.writeText(url);
      setToastMessage('Enlace copiado al portapapeles');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      alert('Error al copiar al portapapeles');
    }
  };

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;

  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    if (statusFilter !== 'ALL') {
      result = result.filter(post => post.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => post.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [posts, searchQuery, statusFilter]);

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg text-sm font-medium z-50 shadow-lg transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[15px] font-medium text-gray-800">Total Posts</span>
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-4xl font-bold text-gray-900">{posts.length}</span>
            <svg width="60" height="30" viewBox="0 0 100 40" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M5 30 L25 30 L40 20 L55 35 L70 10 L95 10"/></svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[15px] font-medium text-gray-800">Publicados</span>
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <span className="text-4xl font-bold text-green-600">{publishedCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[15px] font-medium text-gray-800">Borradores</span>
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <span className="text-4xl font-bold text-gray-600">{draftCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[15px] font-medium text-gray-800">Vistas Totales</span>
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <span className="text-4xl font-bold text-gray-900">0</span>
        </div>
      </div>

      {/* Barra superior de herramientas y filtros */}
      <div className="flex items-center justify-between w-full mb-6">
        {/* Lado Izquierdo: Título */}
        <h1 className="text-2xl font-bold text-slate-900">Artículos</h1>

        {/* Lado Derecho: Filtros y CTA */}
        <div className="flex items-center gap-4">
          {/* Buscar */}
          <div className="relative w-64 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Buscar" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-shadow" 
            />
          </div>
          
          {/* Select de Estados */}
          <div className="relative w-40 shrink-0">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 h-10 border border-gray-300 rounded-lg text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white cursor-pointer transition-shadow w-full"
            >
              <option value="ALL">Estados</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="DRAFT">Borradores</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          {/* CTA Botón Principal */}
          <a href="/studio/escribir" className="bg-slate-900 hover:bg-slate-800 text-white px-4 h-10 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Artículo
          </a>
        </div>
      </div>

      {/* Content Management Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 relative z-10">
        {/* Contenedor Elástico de la Tabla */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <th className="p-4 w-full">Título</th>
                <th className="p-4 text-center whitespace-nowrap">Estado</th>
                <th className="p-4 leading-tight whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>Última</span>
                    <span>Modificación</span>
                  </div>
                </th>
                <th className="p-4 text-center whitespace-nowrap">Métricas</th>
                <th className="p-4 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {error && <tr><td colSpan={5} className="p-8 text-center text-red-500">Error al cargar los artículos.</td></tr>}
              {filteredPosts.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    {posts.length === 0 ? (
                      <>
                        <p>Aún no has escrito ningún artículo.</p>
                        <a href="/studio/escribir" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">Escribe el primero</a>
                      </>
                    ) : (
                      <p>No se encontraron resultados para los filtros actuales.</p>
                    )}
                  </td>
                </tr>
              )}
              
              {filteredPosts.map(post => {
                const isDraft = post.status === 'DRAFT';
                return (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors h-[72px]">
                    
                    {/* Título */}
                    <td className="p-4 w-full align-middle">
                      <div className="max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                        <a href={`/studio/escribir?id=${post.id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2" title={post.title}>
                          {post.title}
                        </a>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-4 text-center whitespace-nowrap align-middle">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium leading-none ${isDraft ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {isDraft ? 'Borrador' : 'Publicado'}
                      </span>
                    </td>

                    {/* Última Modificación */}
                    <td className="p-4 whitespace-nowrap align-middle">
                      {(() => {
                        const { date, time } = formatPostDateTime(post.updatedAt || post.createdAt);
                        return (
                          <div className="flex flex-col">
                            <span className="text-[13.5px] font-medium text-slate-700">{date}</span>
                            {time && <span className="text-[12.5px] text-slate-500">{time}</span>}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Métricas */}
                    <td className="p-4 text-center text-sm text-slate-500 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center gap-4 font-medium">
                        <div className="flex items-center gap-1.5" title="Vistas">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Lecturas">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                          <span>0</span>
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="p-4 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenu?.id === post.id) {
                              setOpenMenu(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popoverHeight = 220; // Estimación segura de altura
                            const spaceBelow = window.innerHeight - rect.bottom;
                            
                            const position = spaceBelow > popoverHeight
                              ? { top: rect.bottom + 4 }
                              : { bottom: window.innerHeight - rect.top + 4 };

                            setOpenMenu({
                              id: post.id,
                              right: window.innerWidth - rect.right,
                              ...position
                            });
                          }} 
                          className={`p-1.5 rounded-md transition-colors ${openMenu?.id === post.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                        
                        {mounted && openMenu?.id === post.id && createPortal(
                          <div 
                            ref={menuRef}
                            className="fixed w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 z-[9999]"
                            style={{ top: openMenu.top, bottom: openMenu.bottom, right: openMenu.right }}
                          >
                            {!isDraft && (
                              <>
                                <button onClick={() => handleShare(post.slug)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                  <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                                  Compartir
                                </button>
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                  <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  Ver en el blog
                                </a>
                                <div className="border-b border-gray-100 my-1.5"></div>
                              </>
                            )}
                            <a href={`/studio/escribir?id=${post.id}`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                              <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Editar
                            </a>
                            <button onClick={() => handleDuplicate(post.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                              <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              Duplicar
                            </button>
                            <div className="border-b border-gray-100 my-1.5"></div>
                            <button onClick={() => { setOpenMenu(null); handleDelete(post.id, post.title); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                              <svg className="text-red-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              Eliminar
                            </button>
                          </div>,
                          document.body
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
