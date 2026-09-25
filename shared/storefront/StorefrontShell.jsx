import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './storefront.css';

// Storefront parts don't use Polaris – they imitate what shoppers see in a Shopify store.
export function renderStorefront(element) {
  createRoot(document.getElementById('root')).render(<StrictMode>{element}</StrictMode>);
}
