import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from './ImageNodeView';

export const CustomImage = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: '' },
      width: { default: null },
      align: { default: 'center' },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

