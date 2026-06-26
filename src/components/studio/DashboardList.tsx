import React from 'react';
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
    return 'Reciente';
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Reciente';
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
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

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;

  return (
    <>
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

      {/* Content Management Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        {/* Panel Header */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 gap-4">
          <h2 className="text-lg font-bold text-gray-900">Content Management Panel</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar" className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm w-full sm:w-48 outline-none focus:border-gray-900" />
            </div>
            <select className="py-1.5 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900 bg-white">
              <option>Estados</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
            <div className="flex items-center text-sm border border-gray-300 rounded-md overflow-hidden">
              <span className="px-3 py-1.5 bg-gray-50 border-r border-gray-300 text-gray-600">Sort by</span>
              <button className="px-3 py-1.5 bg-gray-100 font-medium text-gray-900 border-r border-gray-300">Date</button>
              <button className="px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-50">Title</button>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 p-4">
          <div className="col-span-5">Título del Post</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-2">Última Modificación</div>
          <div className="col-span-2">Estadísticas</div>
          <div className="col-span-2">Acciones</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {error && <div className="p-8 text-center text-red-500">Error al cargar los artículos.</div>}
          {posts.length === 0 && !error && (
            <div className="p-12 text-center text-gray-500">
              <p>Aún no has escrito ningún artículo.</p>
              <a href="/studio/escribir" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">Escribe el primero</a>
            </div>
          )}
          
          {posts.map(post => {
            const isDraft = post.status === 'DRAFT';
            return (
              <div key={post.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 items-center p-4 hover:bg-gray-50 transition-colors">
                
                {/* Título */}
                <div className="col-span-5 pr-4 overflow-hidden">
                  <a href={`/blog/${post.slug}`} className="block font-semibold text-[15px] text-gray-900 hover:underline truncate" target="_blank" rel="noopener noreferrer">
                    {post.title}
                  </a>
                  {/* <p className="text-[13px] text-gray-500 truncate mt-0.5">
                    {post.status === 'DRAFT' ? `Borrador ${post.readingTime} min` : `Publicado ${post.readingTime} min`} — Última mod: {formatPostDate(post.updatedAt || post.createdAt)}
                  </p> */}
                </div>

                {/* Estado */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium leading-none ${isDraft ? 'bg-gray-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {isDraft ? 'Draft' : 'Published'}
                  </span>
                </div>

                {/* Última Modificación */}
                <div className="col-span-2 text-[14px] text-gray-700">
                  {formatPostDateTime(post.updatedAt || post.createdAt)}
                </div>

                {/* Estadísticas */}
                <div className="col-span-2 flex items-center gap-4 text-gray-600">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[13px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> 0</div>
                    <span className="text-[11px] text-gray-400">Views: 0</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[13px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> 0</div>
                    <span className="text-[11px] text-gray-400">Reads: 0</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                </div>

                {/* Acciones */}
                <div className="col-span-2 flex items-center gap-4 text-gray-600 text-sm">
                  <a href={`/blog/${post.slug}`} className="flex flex-col items-center gap-1 hover:text-gray-900 transition-colors group" target="_blank" rel="noopener noreferrer">
                    <div className="p-1.5 rounded-md group-hover:bg-gray-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
                    <span className="text-[11px]">Ver</span>
                  </a>
                  <a href={`/studio/escribir?id=${post.id}`} className="flex flex-col items-center gap-1 hover:text-gray-900 transition-colors group">
                    <div className="p-1.5 rounded-md group-hover:bg-gray-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
                    <span className="text-[11px]">Editar</span>
                  </a>
                  <button type="button" className="flex flex-col items-center gap-1 hover:text-gray-900 transition-colors group">
                    <div className="p-1.5 rounded-md group-hover:bg-gray-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>
                    <span className="text-[11px]">Duplicar</span>
                  </button>
                  <button type="button" onClick={() => handleDelete(post.id, post.title)} className="flex flex-col items-center gap-1 hover:text-red-600 transition-colors group">
                    <div className="p-1.5 rounded-md group-hover:bg-red-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></div>
                    <span className="text-[11px]">Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
