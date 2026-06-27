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
        <option value="bash">Bash</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="csharp">C#</option>
        <option value="css">CSS</option>
        <option value="diff">Diff</option>
        <option value="go">Go</option>
        <option value="graphql">GraphQL</option>
        <option value="ini">INI</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
        <option value="json">JSON</option>
        <option value="kotlin">Kotlin</option>
        <option value="less">Less</option>
        <option value="lua">Lua</option>
        <option value="makefile">Makefile</option>
        <option value="markdown">Markdown</option>
        <option value="objectivec">Objective-C</option>
        <option value="perl">Perl</option>
        <option value="php">PHP</option>
        <option value="plaintext">Plain Text</option>
        <option value="python">Python</option>
        <option value="r">R</option>
        <option value="ruby">Ruby</option>
        <option value="rust">Rust</option>
        <option value="scss">SCSS</option>
        <option value="shell">Shell</option>
        <option value="sql">SQL</option>
        <option value="swift">Swift</option>
        <option value="typescript">TypeScript</option>
        <option value="vbnet">VB.NET</option>
        <option value="wasm">WebAssembly</option>
        <option value="xml">XML / HTML</option>
        <option value="yaml">YAML</option>
      </select>
      <pre className="!mt-0 !mb-0 bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-800">
        <NodeViewContent as="code" className="font-mono text-sm text-slate-50" />
      </pre>
    </NodeViewWrapper>
  );
}
