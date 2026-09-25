import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, Frame } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

// Polaris setup every admin part needs: styles, translations, and a Frame
// (Frame is required for Toast, Modal and other overlay components).
export function AdminShell({ children }) {
  return (
    <AppProvider i18n={en}>
      <Frame>{children}</Frame>
    </AppProvider>
  );
}

// Mounts an admin part into <div id="root">. Call once from the part's main.jsx.
export function renderAdmin(element) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AdminShell>{element}</AdminShell>
    </StrictMode>,
  );
}
