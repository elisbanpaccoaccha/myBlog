import React, { useState } from 'react';

export default function TagSelector({ initialTags = [] }: { initialTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        setTags([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="tag-selector">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {t}
            <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', padding: 0 }}>&times;</button>
          </span>
        ))}
      </div>
      <input 
        type="text" 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addTag}
        placeholder="Add a tag and press Enter..." 
        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      <input type="hidden" name="tags" value={tags.join(',')} />
    </div>
  );
}