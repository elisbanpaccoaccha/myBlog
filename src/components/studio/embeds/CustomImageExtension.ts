import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CustomImageComponent from './CustomImageComponent';

export const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  content: 'inline*',
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
        getAttrs: (node: any) => {
          const img = node.querySelector('img');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
          };
        }
      },
      {
        tag: 'img[src]',
        getAttrs: (node: any) => ({
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt'),
        })
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { class: `custom-image align-${HTMLAttributes.align}` },
      ['img', mergeAttributes(HTMLAttributes, { contenteditable: false, draggable: false })],
      ['figcaption', 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageComponent);
  },

  addCommands() {
    return {
      setCustomImage: (options: { src: string; alt?: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: 'customImage',
          attrs: options,
          content: [], // Empieza con caption vacío
        });
      },
    };
  },
});
