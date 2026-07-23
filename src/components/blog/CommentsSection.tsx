import React, { useState, useEffect } from 'react';
import { actions } from 'astro:actions';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  } | null;
  isDeleted?: number;
  likeCount: number;
  userLikeCount: number;
}

interface CommentsSectionProps {
  postId: string;
  commentCount: number;
  currentUserId?: string | null;
}

export default function CommentsSection({ postId, commentCount: initialCount, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(initialCount);

  // States for the top-level form
  const [mainComment, setMainComment] = useState('');
  const [mainSubmitting, setMainSubmitting] = useState(false);

  // States for the inline reply form
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    const { data, error } = await actions.getComments({ postId });
    if (!error && data) {
      setComments(data as any);
      setCount(data.length);
    }
    setLoading(false);
  };

  const submitComment = async (content: string, parentId: string | null) => {
    if (!content.trim()) return;

    const { data, error } = await actions.addComment({ postId, content, parentId });
    
    if (error) {
      if (error.code === 'UNAUTHORIZED') {
        alert('Debes iniciar sesión para comentar.');
      } else {
        alert('Error al enviar el comentario.');
      }
      return false;
    } else if (data) {
      setComments([{ ...(data as any), likeCount: 0, userLikeCount: 0 }, ...comments]);
      setCount(c => c + 1);
      return true;
    }
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMainSubmitting(true);
    const success = await submitComment(mainComment, null);
    if (success) {
      setMainComment('');
    }
    setMainSubmitting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    setReplySubmitting(true);
    const success = await submitComment(replyContent, parentId);
    if (success) {
      setReplyContent('');
      setReplyingToId(null);
    }
    setReplySubmitting(false);
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId && c.userLikeCount < 50) {
        return { ...c, likeCount: c.likeCount + 1, userLikeCount: c.userLikeCount + 1 };
      }
      return c;
    }));

    const { data, error } = await actions.addCommentLike({ commentId });
    if (error) {
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, likeCount: Math.max(0, c.likeCount - 1), userLikeCount: Math.max(0, c.userLikeCount - 1) };
        }
        return c;
      }));
      if (error.code === 'UNAUTHORIZED') {
        alert('Debes iniciar sesión para dar like.');
      }
    } else if (data) {
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, userLikeCount: data.count };
        }
        return c;
      }));
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;
    const commentId = commentToDelete;
    setCommentToDelete(null);
    
    const hasChildren = comments.some(c => c.parentId === commentId);
    if (hasChildren) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isDeleted: 1 } : c));
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCount(c => c - 1);
    }
    
    await actions.deleteComment({ commentId });
  };

  const openReplyForm = (comment: Comment) => {
    setReplyingToId(comment.id);
    const username = comment.user?.username || 'usuario';
    setReplyContent(`@${username} `);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const rootComments = comments.filter(c => !c.parentId);
  const visibleRootComments = showAll ? rootComments : rootComments.slice(0, 3);

  const getAllDescendants = (parentId: string): Comment[] => {
    let all: Comment[] = [];
    const directChildren = comments.filter(c => c.parentId === parentId);
    for (const child of directChildren) {
      all.push(child);
      all = all.concat(getAllDescendants(child.id));
    }
    return all;
  };

  const renderCommentNode = (comment: Comment, isReply: boolean = false) => {
    return (
      <div key={comment.id} className={`${!isReply ? 'py-5 border-b border-gray-100 last:border-0' : 'mt-4'}`}>
        <div className="flex items-center gap-3 mb-2">
          {comment.isDeleted ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center font-medium shrink-0 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          ) : comment.user?.avatarUrl ? (
            <img src={comment.user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium shrink-0 text-sm">
              {comment.user?.displayName?.charAt(0).toUpperCase() || comment.user?.username.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex flex-col justify-center">
            <span className="font-medium text-[14.5px] text-slate-900 leading-snug">
              {comment.isDeleted ? <span className="text-gray-500 italic">[Usuario eliminado]</span> : (comment.user?.displayName || comment.user?.username)}
            </span>
            <span className="text-[13px] text-gray-500 leading-snug">{formatDate(comment.createdAt)}</span>
          </div>
          <div className="ml-auto relative">
            {!comment.isDeleted && (
              <>
                <div 
                  className="text-gray-400 hover:text-slate-800 cursor-pointer p-1"
                  onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                </div>
                
                {openMenuId === comment.id && (
                  <div className="absolute right-0 top-full mt-1 w-max min-w-[140px] bg-white rounded-lg shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-gray-50 z-10">
                    {/* Flechita (caret) apuntando hacia arriba */}
                    <div className="absolute -top-1.5 right-2.5 w-3 h-3 bg-white border-t border-l border-gray-50 transform rotate-45 rounded-tl-[1px]"></div>
                    
                    <div className="relative bg-white rounded-lg overflow-hidden py-1">
                      {currentUserId === comment.user?.id ? (
                        <button 
                          onClick={() => handleDeleteClick(comment.id)}
                          className="w-full text-center px-4 py-2 text-[14.5px] text-[#e02424] hover:bg-gray-50 transition-colors"
                        >
                          Eliminar respuesta
                        </button>
                      ) : (
                        <button 
                          onClick={() => { showToast('Reporte enviado a moderación.'); setOpenMenuId(null); }}
                          className="w-full text-center px-4 py-2 text-[14.5px] text-[#e02424] hover:bg-gray-50 transition-colors"
                        >
                          Reportar respuesta
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="mb-2 text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap pl-1">
          {comment.isDeleted ? (
            <span className="text-gray-500 italic bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-md inline-block">
              [Este comentario fue eliminado por el autor]
            </span>
          ) : (
            comment.content
          )}
        </div>

        {!comment.isDeleted && (
          <div className="flex items-center gap-5 text-gray-500 pl-1">
            <button 
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors group"
            >
              <svg 
                className={`transition-colors ${comment.userLikeCount > 0 ? 'text-slate-900 fill-slate-900' : 'text-[#6b6b6b] fill-transparent group-hover:text-[#1a1a1a]'}`}
                width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={comment.userLikeCount > 0 ? "0" : "1.5"}
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              {comment.likeCount > 0 && <span className={`text-[13px] font-medium ${comment.userLikeCount > 0 ? 'text-slate-900' : 'text-[#6b6b6b] group-hover:text-[#1a1a1a]'}`}>{comment.likeCount}</span>}
            </button>
            <button 
              onClick={() => replyingToId === comment.id ? setReplyingToId(null) : openReplyForm(comment)}
              className="text-[13.5px] hover:text-slate-900 transition-colors font-medium"
            >
              Responder
            </button>
          </div>
        )}

        {/* Inline Reply Form */}
        {replyingToId === comment.id && (
          <div className={`mt-4 ${!isReply ? 'ml-3 pl-3 border-l-2' : 'mt-4'} border-gray-100 animate-in slide-in-from-top-2 duration-200`}>
            <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="relative">
              <div className="bg-[#f9f9f9] rounded-lg border border-gray-200 shadow-sm overflow-hidden focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-colors">
                <textarea 
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full resize-none outline-none text-[15px] bg-transparent text-slate-800 p-4 min-h-[80px] placeholder-gray-400"
                ></textarea>
                <div className="flex items-center justify-end gap-2 p-3 bg-gray-50/50 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => { setReplyingToId(null); setReplyContent(''); }}
                    className="px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-slate-900 transition-colors rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={replySubmitting || !replyContent.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors shadow-sm"
                  >
                    {replySubmitting ? 'Enviando...' : 'Responder'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    );
  };

  return (
    <section id="comments" className="mt-12 pt-8 border-t border-gray-100 w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold text-slate-900">Respuestas ({count})</h2>
        <div className="text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
      </div>

      <div>
        <div className="mb-10">
          <form onSubmit={handleMainSubmit} className="relative">
              <div className={`rounded-xl transition-all shadow-sm ${mainComment.trim() ? 'bg-white border border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
                <textarea 
                  value={mainComment}
                  onChange={(e) => setMainComment(e.target.value)}
                  placeholder="¿Qué piensas?"
                  className="w-full resize-none outline-none text-[15px] bg-transparent text-slate-800 p-4 min-h-[60px] placeholder-gray-400 rounded-xl"
                  style={{ paddingBottom: mainComment.trim() ? '56px' : '16px' }}
                ></textarea>
                {mainComment.trim() && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setMainComment('')}
                      className="px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={mainSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-[13px] font-medium transition-colors shadow-sm"
                    >
                      {mainSubmitting ? 'Enviando...' : 'Responder'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              Aún no hay respuestas. ¡Sé el primero en comentar!
            </div>
          ) : (
            <div className="space-y-0">
              {visibleRootComments.map(rootComment => {
                const allReplies = getAllDescendants(rootComment.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                return (
                  <div key={rootComment.id}>
                    {renderCommentNode(rootComment, false)}
                    
                    {allReplies.length > 0 && (
                      <div className="mb-5 ml-3 pl-3 border-l-2 border-gray-100/60">
                        {(expandedThreads[rootComment.id] ? allReplies : allReplies.slice(0, 2)).map(reply => (
                          <div key={reply.id}>
                            {renderCommentNode(reply, true)}
                          </div>
                        ))}
                        
                        {!expandedThreads[rootComment.id] && allReplies.length > 2 && (
                          <button 
                            onClick={() => setExpandedThreads(prev => ({ ...prev, [rootComment.id]: true }))}
                            className="mt-4 py-1.5 px-4 rounded-full bg-gray-50 hover:bg-gray-100 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors inline-block"
                          >
                            Mostrar {allReplies.length - 2} respuestas más
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {!showAll && rootComments.length > 3 && (
                <div className="pt-8 pb-4">
                  <button 
                    onClick={() => setShowAll(true)}
                    className="px-5 py-2 rounded-full border border-gray-300 text-[14px] font-medium text-slate-800 hover:bg-gray-50 transition-colors"
                  >
                    Ver todas las respuestas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Custom Modal para Eliminar */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-7">
            <h3 className="text-[18px] font-bold text-slate-900 mb-3">Eliminar respuesta</h3>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              ¿Estás seguro de que quieres eliminar esta respuesta? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-5">
              <button 
                onClick={() => setCommentToDelete(null)}
                className="text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-6 py-2.5 text-[15px] font-medium text-white bg-[#e02424] hover:bg-red-700 rounded-full transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-[14.5px] font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            {toastMessage}
          </div>
        </div>
      )}
    </section>
  );
}
