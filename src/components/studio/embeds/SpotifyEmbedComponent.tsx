import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default function SpotifyEmbedComponent({ node }: any) {
  return (
    <NodeViewWrapper className="spotify-embed my-6 w-full" contentEditable={false}>
      <iframe 
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
