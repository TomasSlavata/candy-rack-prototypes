import { useRef, useState } from 'react';
import { renderStorefront } from '../../shared/storefront/StorefrontShell.jsx';
import { SlideCart, formatMoney } from '../../shared/storefront/SlideCart.jsx';
import { useFeatureSettings } from '../../shared/usePersistentState.js';
import herschelBackpack from '../../shared/storefront/images/herschel-backpack.png';
import acgCanwellGlacier from '../../shared/storefront/images/acg-canwell-glacier.webp';
import nikeZoomFly from '../../shared/storefront/images/nike-zoom-fly.png';
import spinnerIcon from '../../shared/storefront/images/spinner.svg';
import { CURRENCY, DEFAULT_SETTINGS } from '../settings.js';
import { RewardsBar } from '../RewardsBar.jsx';
import './styles.css';

// Products of the demo store (Figma storefront designs). The cart starts with two of them.
const PRODUCTS = [
  { id: 'canwell-glacier', title: 'ACG Canwell Glacier', variant: 'M / Black', price: 139.99, image: acgCanwellGlacier },
  { id: 'zoom-fly', title: 'Nike Zoom Fly 5 Premium', variant: '44 / White', price: 79.99, image: nikeZoomFly },
  { id: 'backpack', title: 'Herschel Classic Backpack', variant: 'One Size / Black', price: 29.99, image: herschelBackpack },
];
// How long adding a product takes – stands in for the request to Shopify. Meanwhile its button shows a spinner.
const ADD_DELAY = 800;

const INITIAL_CART = [
  { ...PRODUCTS[1], quantity: 1 },
  { ...PRODUCTS[2], quantity: 1 },
];

// How long the cart takes to open, from the storefront tokens (--sf-duration-open, e.g. "260ms").
const openingDuration = () =>
  Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sf-duration-open')) || 0;

// Shows the saved settings – changes made in the admin part show up here after Save.
// The cart lives only in this page (a reload starts over).
function Storefront() {
  const [settings] = useFeatureSettings(DEFAULT_SETTINGS);
  const [cart, setCart] = useState(INITIAL_CART);
  const [isCartOpen, setCartOpen] = useState(true);
  const [addingIds, setAddingIds] = useState([]);
  // The rewards bar waits for the cart to open before it moves (only for an add that opens the cart).
  const [barDelay, setBarDelay] = useState(0);
  const cartOpen = useRef(isCartOpen);
  cartOpen.current = isCartOpen;
  // An add that opened the cart (the only change with a delay): the rewards bar shows an unlocked reward's
  // "Text after reward" right away (RewardsBar `textFirst`).
  const addOpenedCart = barDelay > 0;
  // Once the cart has been emptied, the rewards bar that comes back with the next product animates from $0.
  const [cartWasEmptied, setCartWasEmptied] = useState(false);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // After ADD_DELAY the product is in the cart and the cart opens.
  const addToCart = (product) => {
    if (addingIds.includes(product.id)) return;
    setAddingIds((current) => [...current, product.id]);
    setTimeout(() => {
      // A new product goes first, as in Shopify carts; more of one already in the cart keeps its place.
      setCart((current) =>
        current.some((item) => item.id === product.id)
          ? current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
          : [{ ...product, quantity: 1 }, ...current],
      );
      setAddingIds((current) => current.filter((id) => id !== product.id));
      setBarDelay(cartOpen.current ? 0 : openingDuration());
      setCartOpen(true);
    }, ADD_DELAY);
  };
  const setQuantity = (id, quantity) => {
    setBarDelay(0);
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };
  const remove = (id) => {
    setBarDelay(0);
    setCart((current) => {
      const next = current.filter((item) => item.id !== id);
      if (next.length === 0) setCartWasEmptied(true);
      return next;
    });
  };

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
            {/* Loading: the label stays (invisible) so the button keeps its size, the spinner sits over it. */}
            <button
              type="button"
              className={`secondary-button${addingIds.includes(product.id) ? ' secondary-button--loading' : ''}`}
              aria-busy={addingIds.includes(product.id)}
              onClick={() => addToCart(product)}
            >
              <span className="secondary-button__label">Add to cart</span>
              <span className="secondary-button__spinner" style={{ '--spinner-icon': `url("${spinnerIcon}")` }} aria-hidden="true" />
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
          top={
            settings.enabled && (
              <RewardsBar
                settings={settings}
                cartTotal={total}
                delay={barDelay}
                fromEmpty={cartWasEmptied}
                textFirst={addOpenedCart}
              />
            )
          }
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
