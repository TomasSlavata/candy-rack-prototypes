import { useState } from 'react';
import { renderStorefront } from '../../shared/storefront/StorefrontShell.jsx';
import { SlideCart, formatMoney } from '../../shared/storefront/SlideCart.jsx';
import { useFeatureSettings } from '../../shared/usePersistentState.js';
import herschelBackpack from '../../shared/storefront/images/herschel-backpack.png';
import acgCanwellGlacier from '../../shared/storefront/images/acg-canwell-glacier.webp';
import nikeZoomFly from '../../shared/storefront/images/nike-zoom-fly.png';
import { CURRENCY, DEFAULT_SETTINGS } from '../settings.js';
import { RewardsBar } from '../RewardsBar.jsx';
import './styles.css';

// Products of the demo store (Figma storefront designs). The cart starts with two of them.
const PRODUCTS = [
  { id: 'canwell-glacier', title: 'ACG Canwell Glacier', variant: 'M / Black', price: 139.99, image: acgCanwellGlacier },
  { id: 'zoom-fly', title: 'Nike Zoom Fly 5 Premium', variant: '44 / White', price: 79.99, image: nikeZoomFly },
  { id: 'backpack', title: 'Herschel Classic Backpack', variant: 'One Size / Black', price: 29.99, image: herschelBackpack },
];
const INITIAL_CART = [
  { ...PRODUCTS[1], quantity: 1 },
  { ...PRODUCTS[2], quantity: 1 },
];

// Shows the saved settings – changes made in the admin part show up here after Save.
// The cart lives only in this page (a reload starts over).
function Storefront() {
  const [settings] = useFeatureSettings(DEFAULT_SETTINGS);
  const [cart, setCart] = useState(INITIAL_CART);
  const [isCartOpen, setCartOpen] = useState(true);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product) => {
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...current, { ...product, quantity: 1 }],
    );
    setCartOpen(true);
  };
  const setQuantity = (id, quantity) =>
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
  const remove = (id) => setCart((current) => current.filter((item) => item.id !== id));

  return (
    <>
      <header className="store-header">
        <strong>Demo store</strong>
        <button type="button" className="link-button" onClick={() => setCartOpen(true)}>
          Cart ({count})
        </button>
      </header>

      <main className="store-products">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="store-product">
            <img className="store-product__image" src={product.image} alt="" />
            <div>
              <div className="store-product__title">{product.title}</div>
              <div className="muted">{formatMoney(product.price, CURRENCY)}</div>
            </div>
            <button type="button" className="secondary-button" onClick={() => addToCart(product)}>
              Add to cart
            </button>
          </div>
        ))}
      </main>

      {/* Always rendered, so the cart can slide out when it closes (styles.css). */}
      <div className={`overlay${isCartOpen ? ' is-open' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`slide-cart${isCartOpen ? ' is-open' : ''}`} aria-label="Cart" aria-hidden={!isCartOpen}>
        <SlideCart
          fullHeight
          items={cart}
          currency={CURRENCY}
          top={settings.enabled && <RewardsBar settings={settings} cartTotal={total} />}
          stickyTop={settings.appearance.sticky}
          onQuantityChange={setQuantity}
          onRemove={remove}
          onClose={() => setCartOpen(false)}
        />
      </aside>
    </>
  );
}

renderStorefront(<Storefront />);
