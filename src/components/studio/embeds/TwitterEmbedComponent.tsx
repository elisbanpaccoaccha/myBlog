import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Tweet } from 'react-tweet';

export default function TwitterEmbedComponent({ node }: any) {
  return (
    <NodeViewWrapper className="twitter-embed my-6 flex justify-center w-full" contentEditable={false}>
      <div className="w-full max-w-lg" data-theme="light">
        <Tweet id={node.attrs.tweetId} />
      </div>
    </NodeViewWrapper>
  );
}
