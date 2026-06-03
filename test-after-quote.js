(function () {
  // ─── NAV BAR THEME & SCROLL CONTROLLER ───
  const navbar = document.getElementById('navbar');
  const lightSectionSelectors = [
    '.products-section',
    '.collections-section',
    '.materials-section'
  ];
  let cachedLightSections = []; // { el, top, height }
  let lastBodyState = null;
  let lastNavState = null;

  function getUnscaledRect(el) {
    let top = 0;
    let left = 0;
    const width = el.offsetWidth || 0;
    const height = el.offsetHeight || 0;
    let current = el;
    while (current) {
      top += current.offsetTop || 0;
      left += current.offsetLeft || 0;
      current = current.offsetParent;
    }
    return { top, left, width, height };
  }

  function rebuildNavSectionCache() {
    cachedLightSections = [];
    for (const sel of lightSectionSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const rect = getUnscaledRect(el);
        cachedLightSections.push({
          el,
          top: rect.top,
          height: el.offsetHeight
        });
      }
    }
  }

  function updateNavbarTheme() {
    if (!navbar) return;
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 40);

    const navHeight = navbar.offsetHeight || 70;
    const checkY = scrollY + navHeight / 2;
    const checkY_body = scrollY + window.innerHeight / 2;

    let isLightNavbar = false;
    let isLightBody = false;

    for (const sec of cachedLightSections) {
      if (checkY >= sec.top && checkY < sec.top + sec.height) {
        isLightNavbar = true;
      }
      if (checkY_body >= sec.top && checkY_body < sec.top + sec.height) {
        isLightBody = true;
      }
      if (isLightNavbar && isLightBody) break;
    }

    if (lastNavState !== isLightNavbar) {
      lastNavState = isLightNavbar;
      if (isLightNavbar) {
        navbar.classList.add('light-nav');
      } else {
        navbar.classList.remove('light-nav');
      }
    }

    if (lastBodyState !== isLightBody) {
      lastBodyState = isLightBody;
      if (isLightBody) {
        document.body.style.backgroundColor = 'var(--light)';
      } else {
        document.body.style.backgroundColor = 'var(--dark-bg)';
      }
    }
  }

  // Build cache on load & resize
  window.addEventListener('DOMContentLoaded', () => {
    rebuildNavSectionCache();
    updateNavbarTheme();
    // Delay backups to account for image/layout shifts
    setTimeout(rebuildNavSectionCache, 100);
    setTimeout(updateNavbarTheme, 100);
    setTimeout(rebuildNavSectionCache, 500);
    setTimeout(updateNavbarTheme, 500);
  });

  window.addEventListener('resize', () => {
    rebuildNavSectionCache();
    updateNavbarTheme();
  }, { passive: true });

  window.addEventListener('scroll', updateNavbarTheme, { passive: true });

  // ─── OPTIMIZED CRAFTSMANSHIP VIDEO PLAYER CONTROLS ───
  const video = document.getElementById('workshop-video');
  const videoBtn = document.getElementById('video-toggle');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');

  if (videoBtn && video) {
    videoBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
        videoBtn.classList.remove('manually-paused');
      } else {
        video.pause();
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (playIcon) playIcon.style.display = 'block';
        videoBtn.classList.add('manually-paused');
      }
    });
  }

  if (video) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (videoBtn && !videoBtn.classList.contains('manually-paused')) {
            video.play().catch(err => console.log('Autoplay blocked', err));
          }
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    videoObserver.observe(video);
  }

  // ─── INTERACTION OBSERVER FOR REVEAL TRANSLATIONS ───
  const revealElements = document.querySelectorAll('.reveal-el');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ─── SHOPPING CART SIDE-DRAWER & UI CONTROLLER ───
  let cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');

  function saveCart() {
    localStorage.setItem('noku_cart', JSON.stringify(cart));
    updateCartUI();
    window.dispatchEvent(new Event('storage'));
  }

  function openCartDrawer() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Lock main scroll
    }
  }

  function closeCartDrawer() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Unlock main scroll
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function updateCartUI() {
    if (!cartItemsContainer) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountBadge) {
      cartCountBadge.textContent = totalItems;
      cartCountBadge.style.transform = 'scale(1.2)';
      setTimeout(() => {
        cartCountBadge.style.transform = 'scale(1)';
      }, 200);
    }

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="cart-empty-message">Your cart is currently empty.</div>';
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatCurrency(0);
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Cart is Empty';
      }
      return;
    }

    let subtotal = 0;
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <div class="cart-item-img-wrap">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.title}</h4>
          <span class="cart-item-variants">${item.options && item.options.variantTitle ? item.options.variantTitle : 'Standard Finish'}</span>
          <span class="cart-item-price">${formatCurrency(item.price)}</span>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button class="qty-btn dec-qty-btn" data-id="${item.id}" aria-label="Decrease quantity">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn inc-qty-btn" data-id="${item.id}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = formatCurrency(subtotal);
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Proceed to Checkout';
    }
  }

  function addItemToCart(handle, title, variantTitle, price, image) {
    const cartItemId = `featured-${handle}`;
    const existingItemIndex = cart.findIndex(item => item.id === cartItemId);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        id: cartItemId,
        title: title,
        price: price,
        quantity: 1,
        options: {
          variantTitle: variantTitle
        },
        image: image
      });
    }

    saveCart();
    openCartDrawer();
  }

  function updateItemQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      cart[itemIndex].quantity += change;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      saveCart();
    }
  }

  function removeItemFromCart(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      cart.splice(itemIndex, 1);
      saveCart();
    }
  }

  async function proceedToCheckout() {
    if (cart.length === 0) return;

    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Preparing Checkout...';
    }

    // Local simulation checkout popup
    setTimeout(() => {
      const itemsDescription = cart.map(item => 
        `- ${item.title} (${item.options.variantTitle || 'Standard Finish'}): Qty ${item.quantity} @ ${formatCurrency(item.price)}`
      ).join('\n');

      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const alertModal = document.createElement('div');
      alertModal.style.position = 'fixed';
      alertModal.style.inset = '0';
      alertModal.style.backgroundColor = 'rgba(12, 10, 8, 0.9)';
      alertModal.style.zIndex = '10000';
      alertModal.style.display = 'flex';
      alertModal.style.alignItems = 'center';
      alertModal.style.justifyContent = 'center';
      alertModal.style.padding = '20px';

      alertModal.innerHTML = `
        <div style="background-color: var(--dark-bg, #241F1B); border: 1px solid var(--chamoisee, #a27b5c); border-radius: 16px; max-width: 500px; width: 100%; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: var(--font-body, serif); color: var(--paper, #F4F1EC);">
          <h3 style="font-family: var(--font-display, sans-serif); text-transform: uppercase; font-weight: 300; letter-spacing: 2px; color: var(--chamoisee, #a27b5c); margin-bottom: 24px;">Checkout Simulation</h3>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; opacity: 0.9;">
            In production, this would create a secure storefront cart and redirect to Shopify checkout with:
          </p>
          <pre style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; margin-bottom: 24px; white-space: pre-wrap; color: var(--bone, #dcd7c9);">${itemsDescription}\n\nTotal: ${formatCurrency(totalAmount)}</pre>
          <div style="display: flex; gap: 16px; justify-content: flex-end;">
            <button id="modal-close" style="background: none; border: 1px solid rgba(220, 215, 201, 0.3); color: var(--bone, #dcd7c9); padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Back</button>
            <button id="modal-checkout" style="background-color: var(--chamoisee, #a27b5c); border: none; color: var(--paper, #F4F1EC); padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">Complete Order</button>
          </div>
        </div>
      `;

      document.body.appendChild(alertModal);

      document.getElementById('modal-close').addEventListener('click', () => {
        alertModal.remove();
        updateCartUI();
      });

      document.getElementById('modal-checkout').addEventListener('click', () => {
        alertModal.remove();
        cart = [];
        saveCart();
        closeCartDrawer();
        alert('Order simulated successfully! Thank you.');
      });
    }, 800);
  }

  // Initialize listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Toggle Drawer
    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
    if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);

    // Quantity controls and remove action
    if (cartItemsContainer) {
      cartItemsContainer.addEventListener('click', (e) => {
        const btn = e.target;
        const itemId = btn.getAttribute('data-id');
        if (!itemId) return;

        if (btn.classList.contains('inc-qty-btn')) {
          updateItemQuantity(itemId, 1);
        } else if (btn.classList.contains('dec-qty-btn')) {
          updateItemQuantity(itemId, -1);
        } else if (btn.classList.contains('cart-item-remove')) {
          removeItemFromCart(itemId);
        }
      });
    }

    // Add to cart buttons in grid
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
      productsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.product-add-to-cart-btn');
        if (!btn) return;

        const card = btn.closest('.product-card');
        if (!card) return;

        const handle = card.getAttribute('data-handle') || 'product';
        const title = card.querySelector('.product-name')?.textContent.trim() || 'Furniture Piece';
        const variantTitle = card.querySelector('.product-materials')?.textContent.trim() || card.getAttribute('data-materials') || '';
        
        const priceText = card.querySelector('.product-price')?.textContent.trim() || '';
        const priceVal = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;

        const img = card.querySelector('.product-card-img-wrap img');
        const imageSrc = img ? img.src : '';

        addItemToCart(handle, title, variantTitle, priceVal, imageSrc);
      });
    }

    // Mobile nav toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }

    // Sync from other tabs/pages
    window.addEventListener('storage', () => {
      cart = JSON.parse(localStorage.getItem('noku_cart')) || [];
      updateCartUI();
    });

    // Initial render
    updateCartUI();
  });
})();
