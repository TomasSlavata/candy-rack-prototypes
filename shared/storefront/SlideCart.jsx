import closeIcon from './images/close.svg';
import deleteIcon from './images/delete.svg';
import plusIcon from './images/plus.svg';
import './tokens.css';
import './SlideCart.css';

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

  return (
    <div className={`sf-SlideCart${fullHeight ? ' sf-SlideCart--fullHeight' : ''}`}>
      <header className="sf-SlideCart__header">
        <h2 className="sf-SlideCart__title">Cart ({count})</h2>
        <button type="button" className="sf-SlideCart__iconButton" aria-label="Close cart" onClick={onClose}>
          <img src={closeIcon} alt="" width="20" height="20" />
        </button>
      </header>

      <div className="sf-SlideCart__body">
        {top && <div className={stickyTop ? 'sf-SlideCart__top sf-SlideCart__top--sticky' : 'sf-SlideCart__top'}>{top}</div>}

        <div className="sf-SlideCart__products">
          {items.length === 0 && <p className="sf-SlideCart__empty">Your cart is empty</p>}
          {items.map((item, index) => (
            <div key={item.id} className="sf-SlideCart__product">
              {index > 0 && <hr className="sf-SlideCart__divider" />}
              <ProductCard
                item={item}
                formatPrice={formatPrice}
                onQuantityChange={(quantity) => onQuantityChange?.(item.id, quantity)}
                onRemove={() => onRemove?.(item.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="sf-SlideCart__footer">
        {showDiscount && (
          <div className="sf-SlideCart__discount">
            <span>Discount</span>
            <img src={plusIcon} alt="" width="20" height="20" />
          </div>
        )}
        <div className="sf-SlideCart__total">
          <span>{totalLabel}</span>
          <span>{formatPrice(total)}</span>
        </div>
        <button type="button" className="sf-SlideCart__checkout">
          Checkout
        </button>
      </footer>
    </div>
  );
}

function ProductCard({ item, formatPrice, onQuantityChange, onRemove }) {
  return (
    <div className="sf-ProductCard">
      <img className="sf-ProductCard__thumbnail" src={item.image} alt="" />
      <div className="sf-ProductCard__content">
        <div className="sf-ProductCard__heading">
          <div className="sf-ProductCard__name">
            <p className="sf-ProductCard__title">{item.title}</p>
            <p className="sf-ProductCard__variant">{item.variant}</p>
          </div>
          <button type="button" className="sf-SlideCart__iconButton" aria-label={`Remove ${item.title}`} onClick={onRemove}>
            <img src={deleteIcon} alt="" width="20" height="20" />
          </button>
        </div>
        <div className="sf-ProductCard__bottom">
          <div className="sf-QuantityStepper">
            {/* At 1 the shopper removes the product with the delete button instead. */}
            <button
              type="button"
              className="sf-QuantityStepper__button"
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange(item.quantity - 1)}
            >
              <span className="sf-QuantityStepper__minus" />
            </button>
            <span className="sf-QuantityStepper__value">{item.quantity}</span>
            <button
              type="button"
              className="sf-QuantityStepper__button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(item.quantity + 1)}
            >
              <img src={plusIcon} alt="" width="20" height="20" />
            </button>
          </div>
          <p className="sf-ProductCard__price">{formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}

// 79.99 → "$79.99" – how the store shows prices.
export function formatMoney(amount, currency) {
  return amount.toLocaleString('en-US', { style: 'currency', currency });
}
