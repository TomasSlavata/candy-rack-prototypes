import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, Frame } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

// Polaris setup every prototype needs: styles, translations, and a Frame
// (Frame is required for Toast, Modal and other overlay components).
export function PrototypeShell({ children }) {
  return (
    <AppProvider i18n={en}>
      <Frame>{children}</Frame>
    </AppProvider>
  );
}

// Mounts a prototype into <div id="root">. Call once from each prototype's main.jsx.
export function renderPrototype(element) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <PrototypeShell>{element}</PrototypeShell>
    </StrictMode>,
  );
}
