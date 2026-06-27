import React, { useRef, useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default function ImageNodeView({ node, updateAttributes, selected }: any) {
  const containerRef = useRef<HTMLFigureElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(node.attrs.width || '100%');

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calc new width based on mouse pos relative to the left edge of the image
        const newWidth = Math.max(100, e.clientX - rect.left);
        setCurrentWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      updateAttributes({ width: currentWidth });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, currentWidth, updateAttributes]);

  let alignClass = 'items-center justify-center';
  if (node.attrs.align === 'left') alignClass = 'items-start justify-start';
  if (node.attrs.align === 'right') alignClass = 'items-end justify-end';
  if (node.attrs.align === 'full') alignClass = 'items-center justify-center w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]';

  const isFull = node.attrs.align === 'full';

  return (
    <NodeViewWrapper className={`my-8 flex flex-col custom-image-node ${alignClass}`}>
      <figure 
        ref={containerRef}
        className="relative group"
        style={{ width: currentWidth !== '100%' && !isFull ? currentWidth : (isFull ? '100%' : 'auto'), maxWidth: '100%' }}
      >
        <img 
          src={node.attrs.src} 
          alt={node.attrs.alt || ''} 
          className={`rounded-lg max-w-full block transition-shadow duration-200 ${selected ? 'ring-2 ring-emerald-500' : ''}`}
          style={{ width: '100%', height: 'auto' }}
        />
        
        {/* Resize Handle (only show when selected and not full width) */}
        {selected && !isFull && (
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nwse-resize shadow"
            onMouseDown={onMouseDown}
          />
        )}
        
        <figcaption className="mt-2 text-center text-slate-500 text-sm">
          <input
            type="text"
            className="bg-transparent border-none outline-none text-center w-full placeholder:text-slate-300"
            placeholder="Escribe una leyenda (opcional)..."
            value={node.attrs.caption || ''}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging the node
          />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
}
