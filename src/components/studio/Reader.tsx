import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Code from '@tiptap/extension-code';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlockComponent from './CodeBlockComponent';
import { TwitterEmbed } from './embeds/TwitterExtension';
import { SpotifyEmbed } from './embeds/SpotifyExtension';
import { BookmarkEmbed } from './embeds/BookmarkExtension';
import { CustomImage } from './embeds/CustomImageExtension';

const lowlight = createLowlight(common);

export default function Reader({ content }: { content: string }) {
  const editor = useEditor({
    editable: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Heading.configure({ levels: [2, 3] }),
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      Code,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        }
      }).configure({ lowlight }),
      HorizontalRule,
      TwitterEmbed,
      SpotifyEmbed,
      BookmarkEmbed,
      CustomImage,
      Link.configure({ openOnClick: true }),
      Youtube.configure({
        controls: false,
        nocookie: true,
      }),
    ],
    content: content ? JSON.parse(content) : '',
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="reader-wrapper">
      <EditorContent editor={editor} className="tiptap-editor prose max-w-none" />
      <style>{`
        /* Syntax Highlighting para lowlight (Tema Claro) - Igual al editor */
        .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-keyword, .hljs-selector-tag { color: #d73a49; }
        .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta .hljs-string { color: #032f62; }
        .hljs-title, .hljs-section, .hljs-name { color: #6f42c1; }
        .hljs-variable, .hljs-template-variable { color: #e36209; }
        .hljs-number, .hljs-built_in, .hljs-literal, .hljs-type, .hljs-params { color: #005cc5; }
        .hljs-attr { color: #22863a; }

        /* Estilos base de TipTap que pueden faltar en prose */
        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }
        .tiptap-editor .ProseMirror pre {
          background: transparent !important; /* overrides prose */
          padding: 0 !important;
        }
        .tiptap-editor .ProseMirror code {
          background: transparent !important;
          color: inherit !important;
        }
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
          color: #94a3b8;
          letter-spacing: 1em;
          margin-left: 1em;
          line-height: 1;
          position: relative;
          top: -1.5rem;
        }
      `}</style>
    </div>
  );
}
