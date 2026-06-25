import React from 'react';

export default function AdminNav() {
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: '#1a1a1a', color: '#fff', alignItems: 'center' }}>
      <strong style={{ fontSize: '1.2rem', marginRight: 'auto' }}>Admin Panel</strong>
      <a href="/admin/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</a>
      <a href="/admin/escribir" style={{ color: '#fff', textDecoration: 'none', background: '#0070f3', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Write Post</a>
      <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>View Site</a>
    </nav>
  );
}