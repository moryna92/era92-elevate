import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

window.storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value === null) throw new Error('Key not found');
    return { key, value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = '') {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    return { keys };
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
