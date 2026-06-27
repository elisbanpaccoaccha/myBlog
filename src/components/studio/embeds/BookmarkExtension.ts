import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BookmarkEmbedComponent from './BookmarkEmbedComponent';

export const BookmarkEmbed = Node.create({
  name: 'bookmarkEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      domain: { default: null },
      isLoaded: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-bookmark-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-bookmark-embed': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkEmbedComponent);
  },

  addCommands() {
    return {
      setBookmarkEmbed: (options: { url: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: 'bookmarkEmbed',
          attrs: options,
        });
      },
    };
  },
});
