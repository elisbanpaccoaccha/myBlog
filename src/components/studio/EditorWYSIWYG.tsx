import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { common, createLowlight } from 'lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlockComponent from './CodeBlockComponent';
import { TwitterEmbed } from './embeds/TwitterExtension';
import { SpotifyEmbed } from './embeds/SpotifyExtension';
import { BookmarkEmbed } from './embeds/BookmarkExtension';
import { CustomImage } from './embeds/CustomImageExtension';

const lowlight = createLowlight(common);
import {
  Link as LinkIcon,
  Image as ImageIcon,
  Play as YoutubeIcon,
  Code,
  Braces,
  MoreHorizontal,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface Props {
  initialContent?: string;
  onContentChange?: (json: string) => void;
  onSelectedTextChange?: (text: string) => void;
  onInlineAIRequest?: (prompt: string) => void;
  editorRef?: React.MutableRefObject<any>;
}

export default function EditorWYSIWYG({ initialContent = '', onContentChange, onSelectedTextChange, onInlineAIRequest, editorRef }: Props) {
  const [contentJson, setContentJson] = useState(() => {
    return initialContent || JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAltPopoverOpen, setIsAltPopoverOpen] = useState(false);
  const [altText, setAltText] = useState('');
  const [isEmbedPopoverOpen, setIsEmbedPopoverOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isAIPopoverOpen, setIsAIPopoverOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({ lowlight }),
      HorizontalRule,
      TwitterEmbed,
      SpotifyEmbed,
      BookmarkEmbed,
      CustomImage,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Cuenta tu historia...' }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
    ],
    content: initialContent ? JSON.parse(initialContent) : {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    onUpdate({ editor: e }) {
      const json = JSON.stringify(e.getJSON());
      setContentJson(json);
      onContentChange?.(json);
      // Cerramos el menú flotante al escribir
      setIsFloatingMenuOpen(false);
    },
    onSelectionUpdate({ editor: e }) {
      setIsFloatingMenuOpen(false);
      if (onSelectedTextChange) {
        const { from, to, empty } = e.state.selection;
        const text = empty ? '' : e.state.doc.textBetween(from, to, ' ');
        onSelectedTextChange(text);
      }
    }
  });

  // ─── Expose editor instance via ref for AI integration ──────────────────────
  React.useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // ─── Subida de imagen (Drag & Drop y Botón) ───────────────────────────
  const uploadImage = async (file: File) => {
    if (!editor) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload fallido');
      const { url } = (await res.json()) as { url: string };
      (editor.chain().focus() as any).setCustomImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('[EditorWYSIWYG] Upload error:', err);
    }
  };

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(event.dataTransfer.files).filter(f =>
        f.type.startsWith('image/'),
      );
      if (!files.length || !editor) return;

      event.preventDefault();
      event.stopPropagation();

      for (const file of files) {
        await uploadImage(file);
      }
    },
    [editor],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (let i = 0; i < files.length; i++) {
      await uploadImage(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const smartParseEmbed = (url: string) => {
    if (!editor) return;

    // 1. YouTube
    if (url.match(/youtube\.com\/watch|youtu\.be/)) {
      editor.commands.setYoutubeVideo({ src: url });
      return;
    }

    // 2. Twitter / X
    const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/);
    if (twitterMatch && twitterMatch[3]) {
      (editor.commands as any).setTwitterEmbed({ tweetId: twitterMatch[3] });
      return;
    }

    // 3. Spotify
    const spotifyMatch = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      const type = spotifyMatch[1];
      const id = spotifyMatch[2];
      const srcUrl = `https://open.spotify.com/embed/${type}/${id}`;
      (editor.commands as any).setSpotifyEmbed({ src: srcUrl });
      return;
    }

    // 4. Fallback (Bookmark Link Preview)
    (editor.commands as any).setBookmarkEmbed({ url });
  };

  const openLinkPopover = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileInput}
        multiple
      />

      {/* ─── General Bubble Menu ─────────────────────────────── */}
      {editor && (
        <BubbleMenu editor={editor} pluginKey="generalBubbleMenu" tippyOptions={{ duration: 100 }} className="bubble-menu flex items-center bg-[#262625] rounded-md shadow-lg p-1 overflow-hidden" shouldShow={({ editor, view, state, from, to }) => {
          if (editor.isActive('image')) return false;
          const { empty } = state.selection;
          const hasText = view.state.doc.textBetween(from, to, ' ').length > 0;
          return !empty && hasText;
        }}>
          {isLinkPopoverOpen ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <input
                type="url"
                placeholder="https://"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === 'Escape') {
                    setIsLinkPopoverOpen(false);
                    setLinkUrl('');
                  }
                }}
                className="bg-transparent text-white border-b border-gray-500 focus:border-emerald-500 outline-none text-sm px-1 py-0.5 w-48 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={applyLink}
                className="text-emerald-500 hover:text-emerald-400 font-bold"
                title="Aplicar enlace"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLinkPopoverOpen(false);
                  setLinkUrl('');
                }}
                className="text-gray-400 hover:text-gray-300 font-bold ml-1"
                title="Cancelar"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                title="Negrita"
              >
                <b style={{ fontFamily: 'serif', fontSize: '1.1rem' }}>B</b>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                title="Cursiva"
              >
                <i style={{ fontFamily: 'serif', fontSize: '1.1rem' }}>i</i>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={openLinkPopover}
                className={editor.isActive('link') ? 'is-active' : ''}
                title="Enlace"
              >
                <LinkIcon size={16} />
              </button>
              <div className="bubble-divider" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                title="Título 1"
              >
                <span style={{ fontFamily: 'serif', fontSize: '1.15rem' }}>T</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                title="Título 2"
              >
                <span style={{ fontFamily: 'serif', fontSize: '0.9rem' }}>T</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
                title="Cita"
              >
                <span style={{ fontFamily: 'serif', fontSize: '1.2rem', lineHeight: 1 }}>”</span>
              </button>
              <div className="bubble-divider" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
                className="ai-bubble-btn"
                title="Asistente IA"
              >
                <Sparkles size={15} />
              </button>
            </>
          )}
        </BubbleMenu>
      )}

      {/* ─── Image Bubble Menu (estilo Medium) ───────────────────────── */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          pluginKey="imageBubbleMenu"
          shouldShow={({ editor }) => editor.isActive('image')}
          className="bg-[#262625] text-white rounded-md flex items-center shadow-lg z-40 p-1 gap-1"
          tippyOptions={{ placement: 'top', duration: 100 }}
        >
          {isAltPopoverOpen ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <input
                type="text"
                placeholder="Texto alternativo (SEO)..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                     e.preventDefault();
                     editor.commands.updateAttributes('image', { alt: altText });
                     setIsAltPopoverOpen(false);
                  }
                  if (e.key === 'Escape') setIsAltPopoverOpen(false);
                }}
                className="bg-transparent text-white border-b border-emerald-500 focus:border-emerald-400 outline-none text-sm px-1 py-0.5 w-48"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => { editor.commands.updateAttributes('image', { alt: altText }); setIsAltPopoverOpen(false); }} 
                className="text-emerald-500 hover:text-emerald-400 font-bold px-1"
              >
                ✓
              </button>
            </div>
          ) : (
            <>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => editor.commands.updateAttributes('image', { align: 'left' })} 
                className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${editor.getAttributes('image').align === 'left' ? 'text-emerald-500' : 'text-neutral-300'}`}
                title="Alineación izquierda"
              >
                <AlignLeft size={16} />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => editor.commands.updateAttributes('image', { align: 'center' })} 
                className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${editor.getAttributes('image').align === 'center' ? 'text-emerald-500' : 'text-neutral-300'}`}
                title="Centrar"
              >
                <AlignCenter size={16} />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => editor.commands.updateAttributes('image', { align: 'right' })} 
                className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${editor.getAttributes('image').align === 'right' ? 'text-emerald-500' : 'text-neutral-300'}`}
                title="Alineación derecha"
              >
                <AlignRight size={16} />
              </button>
              <div className="w-px h-4 bg-neutral-600 mx-1" />
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => { setAltText(editor.getAttributes('image').alt || ''); setIsAltPopoverOpen(true); }} 
                className="px-3 py-1.5 rounded hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-colors"
              >
                Alt text
              </button>
            </>
          )}
        </BubbleMenu>
      )}

      {/* ─── Floating Menu (Menú expansible tipo Medium en líneas vacías) ───────────── */}
      {editor && (
        <FloatingMenu editor={editor} className="floating-menu">
          <div className="floating-menu-container">
            <button
              type="button"
              className={`floating-btn toggle-btn ${isFloatingMenuOpen ? 'open' : ''}`}
              onClick={() => {
                setIsFloatingMenuOpen(!isFloatingMenuOpen);
                if (isFloatingMenuOpen) {
                  setIsEmbedPopoverOpen(false);
                  setEmbedUrl('');
                  setIsAIPopoverOpen(false);
                  setAiPrompt('');
                }
              }}
              title="Añadir bloque"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {isFloatingMenuOpen && (
              <div className="floating-actions">
                {isAIPopoverOpen ? (
                  <div className="flex items-center w-[400px] bg-white px-2 py-1 shadow-lg border border-purple-200 rounded-md">
                    <input
                      type="text"
                      placeholder="Dile a la IA qué escribir..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (aiPrompt.trim() && onInlineAIRequest) {
                            onInlineAIRequest(aiPrompt);
                          }
                          setIsAIPopoverOpen(false);
                          setAiPrompt('');
                          setIsFloatingMenuOpen(false);
                        }
                        if (e.key === 'Escape') {
                          setIsAIPopoverOpen(false);
                          setAiPrompt('');
                        }
                      }}
                      className="w-full bg-transparent border-none focus:ring-0 text-purple-900 placeholder:text-purple-300 p-0 outline-none text-sm"
                      autoFocus
                    />
                  </div>
                ) : isEmbedPopoverOpen ? (
                  <div className="flex items-center w-[400px] bg-white px-2 py-1">
                    <input
                      type="url"
                      placeholder="Pega un enlace de YouTube, Twitter o Spotify y presiona Enter..."
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (embedUrl) {
                            smartParseEmbed(embedUrl);
                          }
                          setIsEmbedPopoverOpen(false);
                          setEmbedUrl('');
                          setIsFloatingMenuOpen(false);
                        }
                        if (e.key === 'Escape') {
                          setIsEmbedPopoverOpen(false);
                          setEmbedUrl('');
                        }
                      }}
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-500 italic p-0 outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="floating-btn action-btn text-violet-500 hover:text-violet-600"
                      onClick={() => setIsAIPopoverOpen(true)}
                      title="Generar con IA"
                    >
                      <Sparkles size={18} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="floating-btn action-btn"
                      onClick={() => { fileInputRef.current?.click(); setIsFloatingMenuOpen(false); }}
                      title="Añadir Imagen"
                    >
                      <ImageIcon size={18} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="floating-btn action-btn"
                      onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setIsFloatingMenuOpen(false); }}
                      title="Añadir Código"
                    >
                      <Code size={18} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="floating-btn action-btn"
                      onClick={() => setIsEmbedPopoverOpen(true)}
                      title="Añadir Embed Universal"
                    >
                      <Braces size={18} strokeWidth={1.5} />
                    </button>
                    <button
                  type="button"
                  className="floating-btn action-btn"
                  onClick={() => { editor.chain().focus().setHorizontalRule().run(); setIsFloatingMenuOpen(false); }}
                  title="Separador"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
                  </>
                )}
              </div>
            )}
          </div>
        </FloatingMenu>
      )}

      {/* ─── Área de edición ──────────────────────────────────────────────── */}
      <div
        className="editor-content-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      <input
        type="hidden"
        name="content"
        value={contentJson}
      />

      <style>{`
        /* ── Editor Container (Sin bordes tipo Medium) ── */
        .editor-wrapper {
          position: relative;
          background: transparent;
          margin-top: 1rem;
        }

        /* ── Bubble Menu ── */
        .bubble-menu {
          display: flex;
          background-color: #262625;
          padding: 6px 8px;
          border-radius: 8px;
          gap: 2px;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .bubble-menu button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #a3a3a3;
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bubble-menu button:hover {
          color: #ffffff;
        }
        .bubble-menu button.is-active {
          color: #10b981; /* Verde sutil para activo */
        }
        .bubble-divider {
          width: 1px;
          height: 18px;
          background-color: #525252;
          margin: 0 6px;
        }

        /* ── Floating Menu ── */
        .floating-menu {
          display: flex;
          transform: translateX(-48px); /* Posicionado a la izquierda del texto */
        }
        .floating-menu-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .floating-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .floating-btn.toggle-btn {
          border-color: #d1d5db;
          color: #9ca3af;
        }
        .floating-btn.toggle-btn:hover {
          border-color: #111827;
          color: #111827;
        }
        .floating-btn.toggle-btn.open {
          transform: rotate(45deg); /* Gira la X */
          border-color: #111827;
          color: #111827;
        }
        
        .floating-actions {
          display: flex;
          gap: 10px;
          animation: slideIn 0.2s ease forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .floating-btn.action-btn {
          border-color: #22c55e;
          color: #22c55e;
          background: #ffffff;
        }
        .floating-btn.action-btn:hover {
          background: #f0fdf4;
          transform: scale(1.1);
        }

        /* ── Contenido del Editor ── */
        .editor-content-area {
          padding: 0.5rem 0;
          min-height: 400px;
          cursor: text;
        }
        .tiptap-editor:focus { outline: none; }
        .tiptap-editor .ProseMirror {
          outline: none;
          font-size: 1.15rem;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.84);
          font-family: inherit;
        }
        
        /* Ocultamos el borde y sombra cuando se enfoca */
        .editor-wrapper:focus-within {
          border: none;
          box-shadow: none;
        }

        /* Tipografías dentro del editor */
        .tiptap-editor .ProseMirror h2 {
          font-size: 2rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: #111827;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.3;
          color: #111827;
        }
        .tiptap-editor .ProseMirror p { margin-bottom: 1.5rem; }
        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .tiptap-editor .ProseMirror li { margin-bottom: 0.5rem; }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #111827;
          padding-left: 1.2rem;
          color: rgba(0, 0, 0, 0.6);
          font-style: italic;
          margin: 2rem 0;
          font-size: 1.25rem;
        }
        .tiptap-editor .ProseMirror code {
          background: rgba(0, 0, 0, 0.05);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .tiptap-editor .ProseMirror pre {
          margin: 2rem 0;
        }
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          border-radius: 4px;
          margin: 2rem 0;
          display: block;
        }
        
        /* Video YouTube */
        .tiptap-editor .ProseMirror div[data-youtube-video] {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 */
          margin: 2rem 0;
          border-radius: 4px;
          overflow: hidden;
          background-color: #f3f4f6;
        }
        .tiptap-editor .ProseMirror div[data-youtube-video] iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        
        /* Separador de 3 puntos (Medium style) */
        .tiptap-editor .ProseMirror hr {
          border: none !important;
          border-top: none !important;
          background: transparent !important;
          text-align: center !important;
          margin: 3rem 0 !important;
          overflow: visible !important;
          height: 0 !important;
        }
        .tiptap-editor .ProseMirror hr::after {
          content: '...';
          display: inline-block;
          font-size: 2.2rem;
          color: #94a3b8; /* slate-400 */
          letter-spacing: 1em;
          margin-left: 1em; /* Compensate for tracking */
          line-height: 1;
          position: relative;
          top: -1.5rem;
        }

        /* Syntax Highlighting para lowlight (Tema Claro) */
        .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-keyword, .hljs-selector-tag { color: #d73a49; }
        .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta .hljs-string { color: #032f62; }
        .hljs-title, .hljs-section, .hljs-name { color: #6f42c1; }
        .hljs-variable, .hljs-template-variable { color: #e36209; }
        .hljs-number, .hljs-built_in, .hljs-literal, .hljs-type, .hljs-params { color: #005cc5; }
        .hljs-attr { color: #22863a; }

        /* Placeholder styling */
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #d1d5db;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* AI Bubble Button */
        .ai-bubble-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border: none;
          color: #ffffff;
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-bubble-btn:hover {
          background: linear-gradient(135deg, #6d28d9, #4338ca);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}