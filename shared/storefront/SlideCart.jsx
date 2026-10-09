import { useState } from 'react';
import closeIcon from './images/close.svg';
import deleteIcon from './images/delete.svg';
import plusIcon from './images/plus.svg';
import spinnerIcon from './images/spinner.svg';
import './tokens.css';
import './SlideCart.css';

const MAX_QUANTITY = 99;
// How long removing a product takes – stands in for the request to Shopify (Figma "13.0 Microinteractions –
// Removing Product" shows the states, not the time).
const REMOVE_DELAY = 800;

// A 20px icon in the color of its button (CSS mask), so hover and disabled states can recolor it.
function Icon({ source }) {
  return <span className="sf-Icon" style={{ '--sf-icon-source': `url("${source}")` }} aria-hidden="true" />;
}

// Candy Rack slide cart as the shopper sees it (Figma "CR Slide Cart"). Used by storefront parts and by
// admin previews, so its styles are scoped to .sf-SlideCart and only need tokens.css, not storefront.css.
//   items        – [{ id, title, variant, price, quantity, image }], price as a number
//   currency     – currency code for the prices, e.g. "USD"
//   top          – shown at the top of the cart body, above the products (e.g. a rewards bar)
//   stickyTop    – `top` stays in place while the products scroll under it
//   totalLabel   – "Subtotal" (default) or e.g. "Estimated total"
//   showDiscount – the discount code row above the total (the Discounts section of the slide cart)
//   fullHeight   – fills its container and scrolls the body (storefront), otherwise as tall as its content
//                  with a minimum height (admin preview)
// Without items it shows the empty cart (Figma "1.2 Slide Cart (Empty Cart)"): no title, `top` or footer,
// "Continue shopping" closes the cart.
// Removing a product waits REMOVE_DELAY: meanwhile the delete button spins, the product is faded out
// and the total greyed out – then the product goes and the count and total update.
export function SlideCart({
  items,
  currency,
  top,
  stickyTop = false,
  totalLabel = 'Subtotal',
  showDiscount = false,
  fullHeight = false,
  onQuantityChange,
  onRemove,
  onClose,
}) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const formatPrice = (amount) => formatMoney(amount, currency);
  const [removingIds, setRemovingIds] = useState([]);
  const remove = (id) => {
    if (!onRemove || removingIds.includes(id)) return;
    setRemovingIds((current) => [...current, id]);
    setTimeout(() => {
      onRemove(id);
      setRemovingIds((current) => current.filter((removing) => removing !== id));
    }, REMOVE_DELAY);
  };

  const className = `sf-SlideCart${fullHeight ? ' sf-SlideCart--fullHeight' : ''}`;
  const closeButton = (
    <button type="button" className="sf-SlideCart__iconButton" aria-label="Close cart" onClick={onClose}>
      <Icon source={closeIcon} />
    </button>
  );

  if (items.length === 0) {
    return (
      <div className={className}>
        <header className="sf-SlideCart__header sf-SlideCart__header--empty">{closeButton}</header>
        <div className="sf-SlideCart__emptyState">
          <h2 className="sf-SlideCart__title">Your cart is empty</h2>
          <button type="button" className="sf-PrimaryButton" onClick={onClose}>
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <header className="sf-SlideCart__header">
        <h2 className="sf-SlideCart__title">Cart ({count})</h2>
        {closeButton}
      </header>

      <div className="sf-SlideCart__body">
        {top && <div className={stickyTop ? 'sf-SlideCart__top sf-SlideCart__top--sticky' : 'sf-SlideCart__top'}>{top}</div>}

        <div className="sf-SlideCart__products">
          {items.map((item, index) => (
            <div key={item.id} className="sf-SlideCart__product">
              {index > 0 && <hr className="sf-SlideCart__divider" />}
              <ProductCard
                item={item}
                removing={removingIds.includes(item.id)}
                formatPrice={formatPrice}
                onQuantityChange={(quantity) => onQuantityChange?.(item.id, quantity)}
                onRemove={() => remove(item.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="sf-SlideCart__footer">
        {showDiscount && (
          <div className="sf-SlideCart__discount">
            <span>Discount</span>
            <Icon source={plusIcon} />
          </div>
        )}
        <div className="sf-SlideCart__total">
          <span>{totalLabel}</span>
          <span className={removingIds.length > 0 ? 'sf-SlideCart__totalValue--updating' : undefined}>
            {formatPrice(total)}
          </span>
        </div>
        <button type="button" className="sf-PrimaryButton sf-SlideCart__checkout">
          Checkout
        </button>
      </footer>
    </div>
  );
}

function ProductCard({ item, removing, formatPrice, onQuantityChange, onRemove }) {
  return (
    <div className={`sf-ProductCard${removing ? ' sf-ProductCard--removing' : ''}`} aria-busy={removing}>
      <img className="sf-ProductCard__thumbnail" src={item.image} alt="" />
      <div className="sf-ProductCard__content">
        <div className="sf-ProductCard__heading">
          <div className="sf-ProductCard__name">
            <p className="sf-ProductCard__title">{item.title}</p>
            <p className="sf-ProductCard__variant">{item.variant}</p>
          </div>
          {removing ? (
            // Icon button "Loading" state – stays at full opacity while the rest of the card fades.
            <span className="sf-SlideCart__iconButton sf-SlideCart__iconButton--loading" role="status" aria-label="Removing">
              <Icon source={spinnerIcon} />
            </span>
          ) : (
            <button type="button" className="sf-SlideCart__iconButton" aria-label={`Remove ${item.title}`} onClick={onRemove}>
              <Icon source={deleteIcon} />
            </button>
          )}
        </div>
        <div className="sf-ProductCard__bottom">
          <QuantityStepper quantity={item.quantity} label={item.title} onChange={onQuantityChange} />
          <p className="sf-ProductCard__price">{formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}

// Quantity stepper (Figma "Quantity Stepper"): − and + buttons, the number can also be typed.
// At 1 the minus is disabled – the shopper removes the product with the delete button instead.
// A typed number applies on blur or Enter; a blank or 0 goes back to the last quantity.
function QuantityStepper({ quantity, label, onChange }) {
  const [draft, setDraft] = useState(null); // what's typed, while the field is focused

  const finish = () => {
    const typed = Number.parseInt(draft, 10);
    if (typed >= 1) onChange(Math.min(MAX_QUANTITY, typed));
    setDraft(null);
  };

  return (
    <div className="sf-QuantityStepper">
      <button
        type="button"
        className="sf-QuantityStepper__button"
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <span className="sf-QuantityStepper__minus" />
      </button>
      <input
        className="sf-QuantityStepper__value"
        aria-label={`Quantity of ${label}`}
        inputMode="numeric"
        value={draft ?? quantity}
        onFocus={(event) => event.target.select()}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={finish}
        onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
      />
      <button
        type="button"
        className="sf-QuantityStepper__button"
        aria-label="Increase quantity"
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onChange(quantity + 1)}
      >
        <Icon source={plusIcon} />
      </button>
    </div>
  );
}

// 79.99 → "$79.99" – how the store shows prices.
export function formatMoney(amount, currency) {
  return amount.toLocaleString('en-US', { style: 'currency', currency });
}
