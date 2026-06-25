import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function EditorWYSIWYG({ initialContent = '' }: { initialContent?: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
  });

  return (
    <div className="editor-container" style={{ border: '1px solid #ccc', padding: '1rem', minHeight: '300px', background: 'white' }}>
      <EditorContent editor={editor} />
    </div>
  );
}