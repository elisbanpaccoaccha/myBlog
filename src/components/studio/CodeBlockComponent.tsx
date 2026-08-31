import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const LANGUAGES = [
  { value: 'null', label: 'Auto' },
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'ini', label: 'TOML, INI' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'less', label: 'Less' },
  { value: 'lua', label: 'Lua' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'perl', label: 'Perl' },
  { value: 'php', label: 'PHP' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'python', label: 'Python' },
  { value: 'r', label: 'R' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'scss', label: 'SCSS' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vbnet', label: 'VB.NET' },
  { value: 'wasm', label: 'WebAssembly' },
  { value: 'xml', label: 'XML / HTML' },
  { value: 'yaml', label: 'YAML' },
];

export default function CodeBlockComponent({ node, updateAttributes, extension, selected, editor }: any) {
  const isEditable = editor?.isEditable ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditable) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditable]);

  const currentLang = LANGUAGES.find(l => l.value === (node.attrs.language || 'null'))?.label || 'Auto';

  return (
    <NodeViewWrapper className="relative bg-white border border-gray-300 rounded-sm font-mono text-[13px] mt-6 mb-6 group">
      {isEditable ? (
        <div ref={dropdownRef} className="absolute top-1 left-2 z-50">
          <button
            contentEditable={false}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`text-gray-500 hover:text-gray-800 bg-transparent text-[11px] font-sans py-1 px-1 rounded flex items-center gap-1 transition-opacity ${selected || isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            {currentLang}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          
          {isOpen && (
            <div 
              contentEditable={false}
              className="absolute bottom-full left-0 mb-2 w-40 z-50 font-sans"
            >
              <div className="relative bg-white border border-gray-200 rounded shadow-lg">
                <ul className="max-h-64 overflow-y-auto py-1 scrollbar-hide">
                  {LANGUAGES.map((lang) => {
                    const isSelected = (node.attrs.language || 'null') === lang.value;
                    return (
                      <li
                        key={lang.value}
                        onClick={() => {
                          updateAttributes({ language: lang.value === 'null' ? null : lang.value });
                          setIsOpen(false);
                        }}
                        className="px-4 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      >
                        <span>{lang.label}</span>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {/* Tooltip Arrow */}
                <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        currentLang !== 'Auto' && (
          <div className="absolute top-1 left-2 z-10 select-none">
            <span className="text-gray-400 text-[11px] font-sans px-1">
              {currentLang}
            </span>
          </div>
        )
      )}

      <pre className="!m-0 !pt-8 !pb-4 !px-4 !bg-transparent !border-none overflow-x-auto">
        <NodeViewContent as="code" className="block min-w-full !text-gray-800 !bg-transparent !p-0" />
      </pre>
    </NodeViewWrapper>
  );
}
