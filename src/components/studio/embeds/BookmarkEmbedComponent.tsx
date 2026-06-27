import React, { useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default function BookmarkEmbedComponent({ node, updateAttributes }: any) {
  const { url, title, description, image, domain, isLoaded } = node.attrs;
  const [loading, setLoading] = useState(!isLoaded);

  useEffect(() => {
    if (!isLoaded && url) {
      fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            updateAttributes({
              title: data.title,
              description: data.description,
              image: data.image,
              domain: data.domain,
              isLoaded: true
            });
          }
        })
        .catch(() => {
          updateAttributes({ isLoaded: true, title: url, domain: new URL(url).hostname });
        })
        .finally(() => setLoading(false));
    }
  }, [url, isLoaded, updateAttributes]);

  return (
    <NodeViewWrapper className="bookmark-embed my-6 w-full" contentEditable={false}>
      {loading ? (
        <div className="border border-slate-200 rounded-md p-4 animate-pulse bg-white">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block border border-slate-200 rounded-md overflow-hidden hover:bg-slate-50 transition-colors no-underline text-slate-900 flex flex-col sm:flex-row bg-white">
          <div className="p-4 flex flex-col justify-center flex-1">
            <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-1">{title || url}</h3>
            {description && <p className="text-sm text-slate-500 line-clamp-2 mb-2">{description}</p>}
            <span className="text-xs text-slate-400 font-medium">{domain}</span>
          </div>
          {image && (
            <div className="w-full sm:w-48 h-48 sm:h-auto border-l border-slate-100 flex-shrink-0">
              <img src={image} alt={title} className="w-full h-full object-cover m-0" />
            </div>
          )}
        </a>
      )}
    </NodeViewWrapper>
  );
}
