import React, { useState } from "react";

interface Props {
  initialTags?: string[];
}

export default function TagSelector({ initialTags = [] }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState("");

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Evitar que Enter envíe el formulario, sin importar si hay texto o no
    if (e.key === "Enter") {
      e.preventDefault();
    }

    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      const tag = input.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="tag-selector">
      <div className="tag-list">
        {tags.map((t, i) => (
          <span key={i} className="tag-pill">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="tag-remove"
              aria-label={`Eliminar etiqueta ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={
            tags.length === 0
              ? "Añade etiquetas y pulsa Enter..."
              : "Más etiquetas..."
          }
          className="tag-input"
        />
      </div>
      {/* CSV serializado para el formulario de Astro */}
      <input type="hidden" name="tags" value={tags.join(",")} />

      <style>{`
        .tag-selector {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          background: #ffffff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tag-selector:focus-within {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17,24,39,0.08);
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #f3f4f6;
          color: #374151;
          font-size: 0.83rem;
          font-weight: 500;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
        }
        .tag-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.12s;
          font-family: inherit;
        }
        .tag-remove:hover { color: #ef4444; }
        .tag-input {
          border: none;
          outline: none;
          font-size: 0.9rem;
          color: #111827;
          background: transparent;
          min-width: 180px;
          flex: 1;
          padding: 0.25rem 0.1rem;
          font-family: inherit;
        }
        .tag-input::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  );
}
