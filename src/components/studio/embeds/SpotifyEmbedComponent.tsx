import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

export default function SpotifyEmbedComponent({ node, editor }: any) {
  const isEditable = editor?.isEditable ?? false;
  return (
    <NodeViewWrapper className="spotify-embed my-6 w-full relative group" contentEditable={false}>
      {isEditable && (
        <div data-drag-handle className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-1 z-10">
          <GripVertical size={20} />
        </div>
      )}
      <iframe 
        draggable={false}
        style={{ borderRadius: '12px' }} 
        src={node.attrs.src} 
        width="100%" 
        height="352" 
        frameBorder="0" 
        allowFullScreen 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      ></iframe>
    </NodeViewWrapper>
  );
}
