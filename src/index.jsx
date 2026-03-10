import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Persistent storage polyfill using localStorage
window.storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) throw new Error('Key not found');
      return { key, value };
    } catch (e) {
      throw e;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      throw e;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (e) {
      throw e;
    }
  },
  async list(prefix = '') {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    return { keys };
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
