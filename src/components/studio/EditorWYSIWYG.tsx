import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import {
  Link as LinkIcon,
  Image as ImageIcon,
  Play as YoutubeIcon,
  Code,
  Braces,
  MoreHorizontal,
  Plus
} from 'lucide-react';

interface Props {
  initialContent?: string;
  onContentChange?: (json: string) => void;
}

export default function EditorWYSIWYG({ initialContent = '', onContentChange }: Props) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
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
      if (hiddenInputRef.current) hiddenInputRef.current.value = json;
      onContentChange?.(json);
      // Cerramos el menú flotante al escribir
      setIsFloatingMenuOpen(false);
    },
    onSelectionUpdate() {
      setIsFloatingMenuOpen(false);
    }
  });

  // ─── Subida de imagen (Drag & Drop y Botón) ───────────────────────────
  const uploadImage = async (file: File) => {
    if (!editor) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload fallido');
      const { url } = (await res.json()) as { url: string };
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
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

  const addYoutubeVideo = () => {
    const url = prompt('Introduce la URL del video de YouTube:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: Math.max(320, parseInt('640', 10)) || 640,
        height: Math.max(180, parseInt('480', 10)) || 480,
      });
    }
  };

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) return; // cancelled

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

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

      {/* ─── Bubble Menu (Menú de formato estilo Medium) ────────────── */}
      {editor && (
        <BubbleMenu editor={editor} className="bubble-menu">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Negrita"
          >
            <b style={{ fontFamily: 'serif', fontSize: '1.1rem' }}>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Cursiva"
          >
            <i style={{ fontFamily: 'serif', fontSize: '1.1rem' }}>i</i>
          </button>
          <button
            type="button"
            onClick={setLink}
            className={editor.isActive('link') ? 'is-active' : ''}
            title="Enlace"
          >
            <LinkIcon size={16} />
          </button>
          <div className="bubble-divider" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            title="Título 1"
          >
            <span style={{ fontFamily: 'serif', fontSize: '1.15rem' }}>T</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            title="Título 2"
          >
            <span style={{ fontFamily: 'serif', fontSize: '0.9rem' }}>T</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Cita"
          >
            <span style={{ fontFamily: 'serif', fontSize: '1.2rem', lineHeight: 1 }}>”</span>
          </button>
        </BubbleMenu>
      )}

      {/* ─── Floating Menu (Menú expansible tipo Medium en líneas vacías) ───────────── */}
      {editor && (
        <FloatingMenu editor={editor} className="floating-menu">
          <div className="floating-menu-container">
            <button
              type="button"
              className={`floating-btn toggle-btn ${isFloatingMenuOpen ? 'open' : ''}`}
              onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
              title="Añadir bloque"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {isFloatingMenuOpen && (
              <div className="floating-actions">
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
                  onClick={() => { addYoutubeVideo(); setIsFloatingMenuOpen(false); }}
                  title="Añadir YouTube"
                >
                  <YoutubeIcon size={18} strokeWidth={1.5} />
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
                  title="Otras opciones"
                >
                  <Braces size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="floating-btn action-btn"
                  title="Más"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
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
        ref={hiddenInputRef}
        type="hidden"
        name="content"
        defaultValue={initialContent || JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })}
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
          background: #f9fafb;
          color: #111827;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 2rem 0;
          font-size: 0.95rem;
          border: 1px solid #e5e7eb;
        }
        .tiptap-editor .ProseMirror pre code {
          background: transparent;
          color: inherit;
          padding: 0;
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
        
        /* Placeholder styling */
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #d1d5db;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}