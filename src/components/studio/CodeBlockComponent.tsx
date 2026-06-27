import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export default function CodeBlockComponent({ node, updateAttributes, extension }: any) {
  return (
    <NodeViewWrapper className="relative group my-8">
      <select
        className="absolute top-2 right-2 bg-slate-800 text-slate-300 text-xs border border-slate-700 rounded-md px-2 py-1 outline-none opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer z-10"
        contentEditable={false}
        defaultValue={node.attrs.language || 'javascript'}
        onChange={event => updateAttributes({ language: event.target.value })}
      >
        <option value="null">auto</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="python">Python</option>
        <option value="bash">Bash</option>
        <option value="json">JSON</option>
        <option value="sql">SQL</option>
      </select>
      <pre className="!mt-0 !mb-0 bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-800">
        <NodeViewContent as="code" className="font-mono text-sm text-slate-50" />
      </pre>
    </NodeViewWrapper>
  );
}
