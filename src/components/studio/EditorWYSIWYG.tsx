import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface Props {
  initialContent?: string;
  onContentChange?: (json: string) => void;
}

export default function EditorWYSIWYG({ initialContent = '', onContentChange }: Props) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Empieza a escribir tu artículo...' }),
    ],
    content: initialContent ? JSON.parse(initialContent) : {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    onUpdate({ editor: e }) {
      const json = JSON.stringify(e.getJSON());
      if (hiddenInputRef.current) hiddenInputRef.current.value = json;
      onContentChange?.(json);
    },
  });

  // ─── Drag & Drop de imágenes → upload → incrustar URL ───────────────────
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(event.dataTransfer.files).filter(f =>
        f.type.startsWith('image/'),
      );
      if (!files.length || !editor) return;

      event.preventDefault();
      event.stopPropagation();

      for (const file of files) {
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
      }
    },
    [editor],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      {/* ─── Barra de herramientas ─────────────────────────────────────────── */}
      <div className="editor-toolbar" role="toolbar" aria-label="Editor de texto">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Negrita"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Cursiva"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          title="Encabezado 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          title="Encabezado 3"
        >
          H3
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Lista"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Lista numerada"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          title="Código"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Cita"
        >
          “”
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="toolbar-btn"
          title="Deshacer"
          disabled={!editor.can().undo()}
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="toolbar-btn"
          title="Rehacer"
          disabled={!editor.can().redo()}
        >
          ↪
        </button>
      </div>

      {/* ─── Área de edición ──────────────────────────────────────────────── */}
      <div
        className="editor-content-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      <p className="editor-hint">
        💡 Arrastra imágenes directamente al editor para subirlas automáticamente.
      </p>

      {/* Campo oculto con el JSON de TipTap para el formulario de Astro */}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name="content"
        defaultValue={initialContent || JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })}
      />

      <style>{`
        .editor-wrapper {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
        }
        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          flex-wrap: wrap;
        }
        .toolbar-btn {
          padding: 0.3rem 0.55rem;
          border: 1px solid transparent;
          border-radius: 5px;
          background: transparent;
          font-size: 0.85rem;
          font-family: inherit;
          cursor: pointer;
          color: #374151;
          transition: background 0.12s, border-color 0.12s;
          line-height: 1;
        }
        .toolbar-btn:hover { background: #e5e7eb; }
        .toolbar-btn.is-active { background: #e5e7eb; border-color: #d1d5db; color: #111827; }
        .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .toolbar-divider { width: 1px; height: 20px; background: #e5e7eb; margin: 0 4px; }
        .editor-content-area {
          padding: 1.5rem 2rem;
          min-height: 380px;
          cursor: text;
        }
        .tiptap-editor:focus { outline: none; }
        .tiptap-editor .ProseMirror {
          outline: none;
          font-size: 1.05rem;
          line-height: 1.75;
          color: #1a1a1a;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
          letter-spacing: -0.02em;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }
        .tiptap-editor .ProseMirror p { margin-bottom: 1rem; }
        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .tiptap-editor .ProseMirror li { margin-bottom: 0.25rem; }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
          margin: 1.25rem 0;
        }
        .tiptap-editor .ProseMirror code {
          background: #f3f4f6;
          padding: 0.1em 0.3em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .tiptap-editor .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1rem 0;
          font-size: 0.9rem;
        }
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .editor-hint {
          font-size: 0.78rem;
          color: #9ca3af;
          padding: 0.5rem 1.5rem 0.75rem;
          border-top: 1px solid #f3f4f6;
        }
      `}</style>
    </div>
  );
}