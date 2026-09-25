import { useState } from 'react';
import { renderStorefront } from '../../shared/storefront/StorefrontShell.jsx';
import { useFeatureSettings } from '../../shared/usePersistentState.js';
import { DEFAULT_SETTINGS } from '../settings.js';
import './styles.css';

const CART_ITEMS = [{ title: 'Linen shirt', price: '$68.00' }];
const UPSELLS = [
  { title: 'Gift wrap', price: '$4.00' },
  { title: 'Travel pouch', price: '$12.00' },
];

function Storefront() {
  const [settings] = useFeatureSettings(DEFAULT_SETTINGS);
  const [isCartOpen, setCartOpen] = useState(true);

  return (
    <>
      <header className="store-header">
        <strong>Demo store</strong>
        <button type="button" className="link-button" onClick={() => setCartOpen(true)}>
          Cart (1)
        </button>
      </header>

      {isCartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <aside className="slide-cart" aria-label="Cart">
            <div className="slide-cart__header">
              <strong>Your cart</strong>
              <button type="button" className="link-button" onClick={() => setCartOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            {CART_ITEMS.map((item) => (
              <ProductRow key={item.title} product={item} showPrice />
            ))}

            <section className="upsells">
              <h3 className="upsells__heading">{settings.heading}</h3>
              {UPSELLS.map((item) => (
                <ProductRow key={item.title} product={item} showPrice={settings.showPrices} action="Add" />
              ))}
            </section>

            <button type="button" className="primary-button">
              Checkout
            </button>
          </aside>
        </>
      )}
    </>
  );
}

function ProductRow({ product, showPrice, action }) {
  return (
    <div className="product-row">
      <div className="product-row__image" />
      <div className="product-row__info">
        <div>{product.title}</div>
        {showPrice && <div className="muted">{product.price}</div>}
      </div>
      {action && (
        <button type="button" className="secondary-button">
          {action}
        </button>
      )}
    </div>
  );
}

renderStorefront(<Storefront />);
