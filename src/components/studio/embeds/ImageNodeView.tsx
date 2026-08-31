import React, { useRef, useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

export default function ImageNodeView({ node, updateAttributes, selected, editor }: any) {
  const containerRef = useRef<HTMLElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(node.attrs.width || '100%');
  const isEditable = editor?.isEditable ?? false;

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing || !isEditable) return;

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
  }, [isResizing, currentWidth, updateAttributes, isEditable]);

  let alignClass = 'items-center justify-center';
  if (node.attrs.align === 'left') alignClass = 'items-start justify-start';
  if (node.attrs.align === 'right') alignClass = 'items-end justify-end';
  if (node.attrs.align === 'full') alignClass = 'items-center justify-center w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]';

  const isFull = node.attrs.align === 'full';

  return (
    <NodeViewWrapper className={`my-8 flex flex-col custom-image-node group relative ${alignClass}`}>
      {isEditable && (
        <div contentEditable={false} data-drag-handle className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-1 z-10">
          <GripVertical size={20} />
        </div>
      )}
      <figure 
        ref={containerRef}
        className="relative group"
        style={{ width: currentWidth !== '100%' && !isFull ? currentWidth : (isFull ? '100%' : 'auto'), maxWidth: '100%' }}
      >
        <img 
          src={node.attrs.src} 
          alt={node.attrs.alt || ''} 
          draggable={false}
          className={`rounded-lg max-w-full block transition-shadow duration-200 ${selected && isEditable ? 'ring-2 ring-emerald-500' : ''}`}
          style={{ width: '100%', height: 'auto' }}
        />
        
        {/* Resize Handle (only show when selected, not full width, AND in editable editor mode) */}
        {selected && !isFull && isEditable && (
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-nwse-resize shadow"
            onMouseDown={onMouseDown}
          />
        )}
        
        {isEditable ? (
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
        ) : (
          node.attrs.caption ? (
            <figcaption className="mt-2 text-center text-slate-500 text-sm italic">
              {node.attrs.caption}
            </figcaption>
          ) : null
        )}
      </figure>
    </NodeViewWrapper>
  );
}
