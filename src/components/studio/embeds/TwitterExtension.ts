import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TwitterEmbedComponent from './TwitterEmbedComponent';

export const TwitterEmbed = Node.create({
  name: 'twitterEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      tweetId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-twitter-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-twitter-embed': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TwitterEmbedComponent);
  },

  addCommands() {
    return {
      setTwitterEmbed: (options: { tweetId: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: 'twitterEmbed',
          attrs: options,
        });
      },
    };
  },
});
