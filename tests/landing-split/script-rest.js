(function () {
  'use strict';

  // ─── LOADING PROCESS ───
  const loaderProgress = document.getElementById('loader-progress');
  const loaderScreen = document.getElementById('loading-screen');

  const LOADER_KEY = 'noku_loader_shown';
  const hasSeenLoader = sessionStorage.getItem(LOADER_KEY);

  function updateLoader(percentage) {
    if (loaderProgress) {
      loaderProgress.style.width = percentage + '%';
    }
    if (percentage >= 100) {
      setTimeout(() => {
        if (loaderScreen) {
          loaderScreen.classList.add('fade-out');
          document.body.style.backgroundColor = 'var(--dark-bg)';
        }
        sessionStorage.setItem(LOADER_KEY, '1');
      }, 400);
    }
  }

  let loadPercent = 0;
  let loaderInterval = null;
  if (loaderScreen) {
    if (hasSeenLoader) {
      loaderScreen.style.display = 'none';
      document.body.style.backgroundColor = 'var(--dark-bg)';
    } else {
      loaderInterval = setInterval(() => {
        if (loadPercent < 100) {
          loadPercent += Math.random() * 20;
          updateLoader(Math.min(loadPercent, 100));
        } else {
          clearInterval(loaderInterval);
        }
      }, 80);
    }
  }

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

  // ─── OPTIMIZED CRAFTSMANSHIP VIDEO PLAYER ───
  const video = document.getElementById('workshop-video');

  if (video) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().catch(err => console.log('Autoplay blocked', err));
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    videoObserver.observe(video);
  }

  // ─── FEATURED PRODUCTS CAROUSEL CODE ───
  let activeProductIndex = 1; // default to the second card (grooved sofa)

  function centerActiveProduct(animate = true) {
    const track = document.querySelector('.featured-carousel-track');
    const container = document.querySelector('.featured-carousel-track-container');
    if (!track || !container) return;

    const cards = track.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    if (activeProductIndex >= cards.length) {
      activeProductIndex = cards.length - 1;
    }
    if (activeProductIndex < 0) {
      activeProductIndex = 0;
    }

    cards.forEach((card, idx) => {
      if (idx === activeProductIndex) {
        card.classList.add('highlighted');
      } else {
        card.classList.remove('highlighted');
      }
    });

    const activeCard = cards[activeProductIndex];
    const containerWidth = container.offsetWidth;
    const cardWidth = activeCard.offsetWidth || 320;
    const cardOffsetLeft = activeCard.offsetLeft;

    const translateX = (containerWidth - cardWidth) / 2 - cardOffsetLeft;

    if (animate) {
      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
      track.style.transition = 'none';
    }

    track.style.transform = `translateX(${translateX}px)`;
  }

  function initFeaturedProductsCarousel() {
    const track = document.querySelector('.featured-carousel-track');
    if (!track) return;

    const cards = track.querySelectorAll('.product-card');

    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.product-add-to-cart-btn') || e.target.closest('.product-inquire-btn') || e.target.closest('a')) {
          return;
        }

        if (card.classList.contains('highlighted')) {
          const handle = card.getAttribute('data-handle');
          if (handle) {
            window.location.href = `../../product.html?handle=${handle}`;
          }
          return;
        }

        activeProductIndex = idx;
        centerActiveProduct(true);
      });
    });

    const prevBtn = document.querySelector('.featured-carousel-outer-wrap .prev-btn');
    const nextBtn = document.querySelector('.featured-carousel-outer-wrap .next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        activeProductIndex = (activeProductIndex - 1 + cards.length) % cards.length;
        centerActiveProduct(true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        activeProductIndex = (activeProductIndex + 1) % cards.length;
        centerActiveProduct(true);
      });
    }

    centerActiveProduct(false);
    setTimeout(() => centerActiveProduct(false), 150);
    setTimeout(() => centerActiveProduct(false), 600);
  }

  window.addEventListener('resize', () => {
    centerActiveProduct(false);
  }, { passive: true });

  window.addEventListener('featuredproductsloaded', () => {
    centerActiveProduct(false);
    syncFeaturedBarstoolCard();
  });

  window.addEventListener('load', () => {
    centerActiveProduct(false);
    syncFeaturedBarstoolCard();
  });

  function syncFeaturedBarstoolCard() {
    const barstoolCard = document.querySelector('.product-card[data-handle="barstool"]');
    if (!barstoolCard) return;

    const selectedWoodText = 'Teak';
    const selectedCushionText = 'Linen';

    const materialsEl = barstoolCard.querySelector('.product-materials');
    if (materialsEl) {
      materialsEl.textContent = `${selectedWoodText} / Fabric — ${selectedCushionText}`;
    }

    if (typeof getProductVariant === 'function') {
      const variant = getProductVariant(selectedWoodText, selectedCushionText);
      if (variant) {
        barstoolCard.setAttribute('data-variant-id', variant.id);
        barstoolCard.setAttribute('data-variant-price', variant.price.toString());
        barstoolCard.setAttribute('data-variant-title', `${selectedWoodText} / Fabric — ${selectedCushionText}`);
        barstoolCard.setAttribute('data-variant-image', variant.image || '');

        const priceEl = barstoolCard.querySelector('.product-price');
        if (priceEl && typeof formatCurrency === 'function') {
          const minPrice = (typeof getMinBarstoolPrice === 'function') ? getMinBarstoolPrice() : null;
          priceEl.textContent = `From ${formatCurrency(minPrice != null ? minPrice : variant.price)}`;
        }
      }
    }
  }

  window.addEventListener('shopifyloaded', syncFeaturedBarstoolCard);

  initFeaturedProductsCarousel();
})();
