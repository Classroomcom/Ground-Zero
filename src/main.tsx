import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for environments missing requestPointerLock (e.g. mobile Safari, restricted iframes)
if (typeof Element !== 'undefined' && !Element.prototype.requestPointerLock) {
  Element.prototype.requestPointerLock = function() {
    console.warn('Pointer lock is not supported in this environment.');
    const doc = this.ownerDocument || document;
    try {
      Object.defineProperty(doc, 'pointerLockElement', {
        get: () => this,
        configurable: true
      });
    } catch (e) {}
    setTimeout(() => {
      doc.dispatchEvent(new Event('pointerlockchange'));
    }, 10);
  };
}

if (typeof Document !== 'undefined' && !Document.prototype.exitPointerLock) {
  Document.prototype.exitPointerLock = function() {
    try {
      Object.defineProperty(this, 'pointerLockElement', {
        get: () => null,
        configurable: true
      });
    } catch (e) {}
    setTimeout(() => {
      this.dispatchEvent(new Event('pointerlockchange'));
    }, 10);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
