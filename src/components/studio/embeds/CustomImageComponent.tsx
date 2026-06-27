import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { AlignCenter, Maximize2 } from 'lucide-react';

export default function CustomImageComponent({ node, updateAttributes, selected }: any) {
  const [showAltInput, setShowAltInput] = useState(false);

  return (
    <NodeViewWrapper className={`custom-image-node my-8 relative flex flex-col items-center group`}>
      {/* Bubble Menu para la Imagen */}
      {selected && (
        <div 
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-[#262625] text-white rounded-md flex items-center shadow-lg z-50 p-1 gap-1"
          contentEditable={false}
        >
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${node.attrs.align === 'center' ? 'text-emerald-500' : 'text-neutral-300'}`}
            onClick={() => updateAttributes({ align: 'center' })}
            title="Centrar"
          >
            <AlignCenter size={16} />
          </button>
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={`p-1.5 rounded hover:bg-neutral-700 transition-colors ${node.attrs.align === 'full' ? 'text-emerald-500' : 'text-neutral-300'}`}
            onClick={() => updateAttributes({ align: 'full' })}
            title="Ancho completo"
          >
            <Maximize2 size={16} />
          </button>
          
          <div className="w-px h-4 bg-neutral-600 mx-1"></div>
          
          {showAltInput ? (
            <input 
              type="text" 
              autoFocus
              className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white w-48 outline-none focus:border-emerald-500"
              placeholder="Escribe el texto alt..."
              value={node.attrs.alt || ''}
              onChange={(e) => updateAttributes({ alt: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault();
                  setShowAltInput(false);
                }
              }}
            />
          ) : (
            <button 
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="px-3 py-1.5 rounded hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-colors"
              onClick={() => setShowAltInput(true)}
            >
              Alt text
            </button>
          )}
        </div>
      )}

      <div className={`transition-all duration-300 ease-in-out ${node.attrs.align === 'full' ? 'w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]' : 'w-full max-w-4xl'}`}>
        <img 
          src={node.attrs.src} 
          alt={node.attrs.alt || ''} 
          className={`w-full h-auto rounded-lg transition-all duration-200 cursor-default ${selected ? 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-white' : ''}`} 
          contentEditable={false}
        />
      </div>
      
      <NodeViewContent 
        as="figcaption" 
        className={`mt-3 text-center text-[0.95rem] text-slate-500 focus:outline-none w-full ${node.attrs.align === 'full' ? 'max-w-4xl' : ''}`} 
        data-placeholder="Escribe una leyenda para la imagen (opcional)..."
      />
    </NodeViewWrapper>
  );
}
