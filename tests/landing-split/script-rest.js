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

  // ─── OPTIMIZED CRAFTSMANSHIP VIDEO PLAYER CONTROLS ───
  const video = document.getElementById('workshop-video');
  const videoBtn = document.getElementById('video-toggle');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');

  if (videoBtn) {
    videoBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        video.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
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

  // ─── FEATURED PRODUCTS CAROUSEL CODE ───
  let activeProductIndex = 1; // default to the second card (grooved sofa)
  let isProductsAnimActive = false;

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
    if (featuredAnimTriggered && !isProductsAnimActive) return;

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

  let featuredAnimTriggered = false;

  function initFeaturedEntranceAnimation() {
    const productsSec = document.querySelector('.products-section');
    if (!productsSec) return;

    const track = document.querySelector('.featured-carousel-track');
    const container = document.querySelector('.featured-carousel-track-container');
    if (!track || !container) return;

    const cards = track.querySelectorAll('.product-card');
    const barstoolCard = track.querySelector('.product-card[data-handle="barstool"]');
    const moreText = document.querySelector('.there-is-more-text');
    const prevBtn = document.querySelector('.featured-carousel-outer-wrap .prev-btn');
    const nextBtn = document.querySelector('.featured-carousel-outer-wrap .next-btn');
    const header = document.querySelector('.products-header');

    if (!barstoolCard || cards.length === 0) return;

    if (window.matchMedia('(max-width: 768px)').matches) {
      featuredAnimTriggered = true;
      isProductsAnimActive = false;
      if (moreText) {
        moreText.style.display = 'none';
      }
      centerActiveProduct(false);
      return;
    }

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.88)';
      card.style.transition = 'none';
    });
    if (moreText) {
      moreText.style.opacity = '0';
      moreText.style.transition = 'none';
    }
    if (prevBtn) {
      prevBtn.style.opacity = '0';
      prevBtn.style.pointerEvents = 'none';
      prevBtn.style.transition = 'none';
    }
    if (nextBtn) {
      nextBtn.style.opacity = '0';
      nextBtn.style.pointerEvents = 'none';
      nextBtn.style.transition = 'none';
    }
    if (header) {
      header.style.opacity = '0';
      header.style.transform = 'translateY(20px)';
      header.style.transition = 'none';
    }

    const containerWidth = container.offsetWidth;
    const cardWidth = barstoolCard.offsetWidth || 320;
    const barstoolOffset = barstoolCard.offsetLeft;
    const translateX_centered = (containerWidth - cardWidth) / 2 - barstoolOffset;
    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX_centered}px)`;

    isProductsAnimActive = true;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!featuredAnimTriggered && entry.isIntersecting) {
          const rect = entry.target.getBoundingClientRect();
          const isFullyVisible = rect.top >= -10 && rect.bottom <= window.innerHeight + 10;
          const isMostlyVisible = entry.intersectionRatio >= 0.5;

          if (isFullyVisible || isMostlyVisible) {
            featuredAnimTriggered = true;
            observer.unobserve(productsSec);
            runFeaturedEntranceTimeline(track, container, cards, barstoolCard, moreText, prevBtn, nextBtn, header);
          }
        }
      });
    }, {
      threshold: [0.1, 0.3, 0.5, 0.7, 0.85, 1.0]
    });

    observer.observe(productsSec);
  }

  function runFeaturedEntranceTimeline(track, container, cards, barstoolCard, moreText, prevBtn, nextBtn, header) {
    const containerWidth = container.offsetWidth;
    const cardWidth = barstoolCard.offsetWidth || 320;
    const barstoolOffset = barstoolCard.offsetLeft;
    const translateX_centered = (containerWidth - cardWidth) / 2 - barstoolOffset;

    const activeCard = cards[activeProductIndex] || cards[1];
    const activeCardWidth = activeCard.offsetWidth || 320;
    const activeOffset = activeCard.offsetLeft;
    const translateX_normal = (containerWidth - activeCardWidth) / 2 - activeOffset;

    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX_centered}px)`;

    if (moreText) {
      const outerWrap = document.querySelector('.featured-carousel-outer-wrap');
      if (outerWrap) {
        const outerRect = outerWrap.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const barstoolVisualLeft = containerRect.left + barstoolOffset + translateX_centered;
        const textRight = barstoolVisualLeft - outerRect.left - 60;
        moreText.style.right = `calc(100% - ${textRight}px)`;
      }
    }

    requestAnimationFrame(() => {
      if (header) {
        header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
      }

      setTimeout(() => {
        barstoolCard.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
        barstoolCard.style.opacity = '1';
        barstoolCard.style.transform = 'scale(1.03)';

        if (moreText) {
          moreText.style.transition = 'opacity 0.7s ease 0.15s';
          moreText.style.opacity = '1';
        }

        setTimeout(() => {
          if (moreText) {
            moreText.style.transition = 'opacity 0.5s ease';
            moreText.style.opacity = '0';
          }

          track.style.transition = 'transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)';
          track.style.transform = `translateX(${translateX_normal}px)`;

          cards.forEach((card, idx) => {
            if (card === barstoolCard) {
              const isActiveCard = (idx === activeProductIndex);
              const restScale = isActiveCard ? 1.03 : 0.92;
              card.style.transition = 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
              card.style.transform = `scale(${restScale})`;
            } else {
              const staggerDelay = 0.08 * Math.abs(idx - 0);
              card.style.transition = `opacity 0.6s ease ${staggerDelay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`;
              card.style.opacity = '1';
              const isHighlighted = (idx === activeProductIndex);
              card.style.transform = `scale(${isHighlighted ? 1.03 : 0.92})`;
            }
          });

          if (prevBtn) {
            prevBtn.style.transition = 'opacity 0.5s ease 0.3s';
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
          }
          if (nextBtn) {
            nextBtn.style.transition = 'opacity 0.5s ease 0.3s';
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
          }

          setTimeout(() => {
            isProductsAnimActive = false;

            cards.forEach(card => {
              card.style.opacity = '';
              card.style.transform = '';
              card.style.transition = '';
            });
            if (moreText) {
              moreText.style.opacity = '0';
              moreText.style.transform = '';
              moreText.style.transition = '';
              moreText.style.right = '';
            }
            if (prevBtn) {
              prevBtn.style.opacity = '';
              prevBtn.style.pointerEvents = '';
              prevBtn.style.transition = '';
            }
            if (nextBtn) {
              nextBtn.style.opacity = '';
              nextBtn.style.pointerEvents = '';
              nextBtn.style.transition = '';
            }
            if (header) {
              header.style.opacity = '';
              header.style.transform = '';
              header.style.transition = '';
            }
            track.style.transition = '';

            centerActiveProduct(true);
          }, 1200);

        }, 1200);

      }, 200);
    });
  }

  window.addEventListener('shopifyloaded', syncFeaturedBarstoolCard);

  initFeaturedProductsCarousel();
  initFeaturedEntranceAnimation();
})();
