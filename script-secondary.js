(function () {
  // ─── LOADING & LANDING INITIALIZATION ───
  const loaderProgress = document.getElementById('loader-progress');
  const loaderScreen = document.getElementById('loading-screen');
  const scatteredIntro = document.getElementById('scattered-intro-container');

  let isIntroComplete = false;
  const startTime = Date.now();
  const cushions = ['blush', 'charcoal', 'chestnut', 'cognac', 'linen', 'olive', 'opal', 'vienna'];

  function initializeLandingSection() {
    if (isIntroComplete) return;
    isIntroComplete = true;

    if (scatteredIntro) {
      scatteredIntro.style.display = 'none';
    }

    document.body.classList.add('intro-complete');

    // Recalculate metrics now that scroll is active and layout shifts are stable
    updateThreeLayoutMetrics();
    evaluateScrollCalculations();
    updateNavbarTheme();
  }

  let hasPopulatedSecondaryImages = false;

  // Dynamic image loader from live Shopify store variants data
  function populateSecondaryLandingImages() {
    if (hasPopulatedSecondaryImages) return;
    hasPopulatedSecondaryImages = true;

    // Populate centerpiece image
    const staticImg = document.getElementById('hero-static-image');
    if (staticImg) {
      let centerpieceUrl = '';
      if (
        typeof isShopifyConnected !== 'undefined' && 
        isShopifyConnected && 
        typeof getProductVariant === 'function'
      ) {
        const variant = getProductVariant('Teak', 'Linen');
        if (variant && variant.image) {
          centerpieceUrl = variant.image;
        }
      }

      if (!centerpieceUrl) {
        // Safe remote CDN fallback (never use local images per user requirements)
        centerpieceUrl = 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp';
      }

      staticImg.src = centerpieceUrl;
    }
  }

  // Bind custom shopify loaded event
  window.addEventListener('shopifyloaded', populateSecondaryLandingImages);

  // Fallback timer in case Shopify API hangs or event fails to fire
  setTimeout(() => {
    populateSecondaryLandingImages();
  }, 1200);

  // Track whether loader has been shown this session
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
        }
        sessionStorage.setItem(LOADER_KEY, '1');
        initializeLandingSection();
      }, 400);
    }
  }

  // Background loader progress animation for Three.js progress representation
  let loadPercent = 0;
  let loaderInterval = null;
  if (loaderScreen) {
    if (hasSeenLoader) {
      loaderScreen.style.display = 'none';
      initializeLandingSection();
    } else {
      loaderInterval = setInterval(() => {
        if (loadPercent < 85) {
          loadPercent += Math.random() * 15;
          updateLoader(Math.min(loadPercent, 85));
        }
      }, 100);
    }
  } else {
    initializeLandingSection();
  }

  // ─── THREE.JS 3D CANVAS REDIRECTS ───
  const container = document.getElementById('three-container');
  const canvas = document.getElementById('three-canvas');

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.3, 4.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ─── CINEMATIC LIGHTING DESIGN ───
  const ambientLight = new THREE.AmbientLight(0xEDE6DA, 0.45);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xFFF5E6, 1.8);
  keyLight.position.set(4, 6, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 15;
  keyLight.shadow.camera.left = -2;
  keyLight.shadow.camera.right = 2;
  keyLight.shadow.camera.top = 2;
  keyLight.shadow.camera.bottom = -2;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xC8D8E8, 0.65);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xFFF0D0, 0.95);
  rimLight.position.set(-2, 4, -4);
  scene.add(rimLight);

  const floorLight = new THREE.PointLight(0xEDE6DA, 0.25, 10);
  floorLight.position.set(0, -2, 2);
  scene.add(floorLight);

  // ─── 3D MODEL LOADER INTEGRATION ───
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const barstoolPivot = new THREE.Group();
  modelGroup.add(barstoolPivot);

  // ─── GROUND SHADOW PLANE ───
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.2 });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.75;
  shadowPlane.receiveShadow = true;
  modelGroup.add(shadowPlane);

  let barstoolMesh = null;
  let isModelLoaded = false;
  const loader = new THREE.GLTFLoader();

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
  loader.setDRACOLoader(dracoLoader);

  function runFallback() {
    console.warn('Setting up procedural furniture placeholder.');
    const stoolGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4A2E1B, roughness: 0.6 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xA7B09F, roughness: 0.85 });
    const caneMat = new THREE.MeshStandardMaterial({ color: 0xD5BD8D, roughness: 0.75 });

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.08, 32), cushionMat);
    seat.position.y = 0.15;
    seat.castShadow = true;
    stoolGroup.add(seat);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.015, 8, 32), woodMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.11;
    stoolGroup.add(rim);

    const legsAngle = [0.15, -0.15];
    legsAngle.forEach(lx => {
      legsAngle.forEach(lz => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, 0.85, 8), woodMat);
        leg.position.set(lx, -0.3, lz);
        leg.rotation.x = lz * 0.15;
        leg.rotation.z = -lx * 0.15;
        leg.castShadow = true;
        stoolGroup.add(leg);
      });
    });

    const stretcher = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.01, 8, 4), woodMat);
    stretcher.rotation.x = Math.PI / 2;
    stretcher.rotation.z = Math.PI / 4;
    stretcher.position.y = -0.45;
    stoolGroup.add(stretcher);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), woodMat);
    postL.position.set(-0.13, 0.34, -0.16);
    postL.rotation.x = -0.06;
    stoolGroup.add(postL);

    const postR = postL.clone();
    postR.position.x = 0.13;
    stoolGroup.add(postR);

    const backGeo = new THREE.TorusGeometry(0.16, 0.015, 8, 24, Math.PI);
    const back = new THREE.Mesh(backGeo, woodMat);
    back.position.set(0, 0.52, -0.17);
    back.rotation.y = Math.PI;
    stoolGroup.add(back);

    stoolGroup.position.y = 0.05;
    barstoolPivot.add(stoolGroup);
    isModelLoaded = true;

    clearInterval(loaderInterval);
    updateLoader(100);
  }

  loader.load(
    'Resources/Barstool 01 R2.glb',
    function (gltf) {
      barstoolMesh = gltf.scene;

      const box = new THREE.Box3().setFromObject(barstoolMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDimension = Math.max(size.x, size.y, size.z);
      const scaleFactor = 1.35 / maxDimension;
      barstoolMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

      barstoolMesh.position.x = -center.x * scaleFactor;
      barstoolMesh.position.z = -center.z * scaleFactor;
      barstoolMesh.position.y = -0.70 - (box.min.y * scaleFactor);

      barstoolMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.roughness = Math.max(child.material.roughness, 0.4);
            child.material.envMapIntensity = 1.5;
          }
        }
      });

      barstoolPivot.add(barstoolMesh);
      isModelLoaded = true;

      clearInterval(loaderInterval);
      updateLoader(100);
    },
    function (xhr) {
      if (xhr.total) {
        const percent = Math.min(Math.round((xhr.loaded / xhr.total) * 100), 99);
        updateLoader(percent);
      }
    },
    function (error) {
      console.warn('GLB load failed, running fallback.', error);
      runFallback();
    }
  );

  // ─── SCROLL INTERACTIVE MATHEMATICS ───
  let scrollProgress = 0;
  let modelFadeInRatio = 0.0; // Dynamic 3d model opacity fade-in ratio on scroll

  let targetRotY = 0;
  let currentRotY = 0;

  let targetPosX = 0;
  let currentPosX = 0;

  let targetPosY = 0;
  let currentPosY = 0;

  let targetScale = 1.0;
  let currentScale = 1.0;

  let targetOpacity = 1.0;
  let currentOpacity = 0.0; // Start at 0.0 on load

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  });

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

  let configTopDoc = 0;
  let configBottomDoc = 0;
  let cardTopOffsetFromConfig = 0;
  let threeMetricsCached = false;

  function updateThreeLayoutMetrics() {
    const configuratorSection = document.getElementById('configurator');
    if (configuratorSection) {
      const configRect = getUnscaledRect(configuratorSection);
      configTopDoc = configRect.top;
      configBottomDoc = configRect.top + configRect.height;

      const highlightedCard = document.querySelector('.carousel-card.highlighted');
      if (highlightedCard) {
        const imgWrap = highlightedCard.querySelector('.carousel-card-img-wrap');
        const cardRect = imgWrap ? getUnscaledRect(imgWrap) : getUnscaledRect(highlightedCard);
        cardTopOffsetFromConfig = cardRect.top - configTopDoc;
      } else {
        cardTopOffsetFromConfig = 0;
      }
      threeMetricsCached = true;
    }
  }

  function interpolate(val, keyframes) {
    if (val <= keyframes[0][0]) return keyframes[0][1];
    if (val >= keyframes[keyframes.length - 1][0]) return keyframes[keyframes.length - 1][1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      const k1 = keyframes[i];
      const k2 = keyframes[i + 1];
      if (val >= k1[0] && val <= k2[0]) {
        const t = (val - k1[0]) / (k2[0] - k1[0]);
        const easedT = t * t * (3 - 2 * t);
        return k1[1] + (k2[1] - k1[1]) * easedT;
      }
    }
    return keyframes[0][1];
  }

  function evaluateScrollCalculations() {
    if (!isIntroComplete) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const total3DZoneHeight = viewportHeight * 3;

    scrollProgress = Math.min(Math.max(scrollY / total3DZoneHeight, 0), 1);

    // Fade out static product image on scroll with upward translation
    const staticImg = document.getElementById('hero-static-image');
    if (staticImg) {
      const staticOpacity = Math.max(0, 1 - scrollY / 250);
      staticImg.style.opacity = staticOpacity.toFixed(3);
      staticImg.style.transform = `translateY(-${scrollY * 0.2}px)`;
      
      // Toggle display none to prevent graphics card overhead once fully faded
      if (staticOpacity <= 0) {
        staticImg.style.display = 'none';
      } else {
        staticImg.style.display = 'block';
      }
    }

    // Dynamic scroll-based body background-color transition is removed to keep it light themed

    // Calculate 3D model scroll-fade-in ratio (fades in between scrollY 40 and 240)
    let ratio = Math.min(Math.max((scrollY - 40) / 200, 0), 1);
    modelFadeInRatio = ratio * ratio * (3 - 2 * ratio); // Smoothstep

    // Position X, Y, Scale, and Y-Rotation keyframe mapping
    if (window.innerWidth > 1024) {
      const xKeyframes = [
        [0.0, 0.0],    // Start in the center (matching the static image position)
        [0.35, 0.95],  // Shift to right column (as the first narrative is on the left)
        [0.65, -0.95], // Shift to left column (as the second narrative is on the right)
        [1.0, 0.0]     // Merge to center for the configurator
      ];
      const yKeyframes = [
        [0.0, 0.05],   // Align vertically
        [0.35, 0.05],
        [0.65, 0.08],
        [1.0, 0.22]
      ];
      const scaleKeyframes = [
        [0.0, 0.95],   // Initial scale
        [0.35, 0.95],
        [0.65, 0.95],
        [1.0, 1.0]
      ];
      const rotYKeyframes = [
        [0.0, -0.25 * Math.PI], // Start rotated 45 degrees to the opposite side
        [0.35, 0.65 * Math.PI],
        [0.65, 1.35 * Math.PI],
        [1.0, 2.0 * Math.PI]
      ];

      targetPosX = interpolate(scrollProgress, xKeyframes);
      targetPosY = interpolate(scrollProgress, yKeyframes);
      targetScale = interpolate(scrollProgress, scaleKeyframes);
      targetRotY = interpolate(scrollProgress, rotYKeyframes);
    } else {
      const yKeyframesMobile = [
        [0.0, 0.2],    // Align vertically stack
        [0.35, 0.2],
        [0.65, -0.2],
        [1.0, 0.0]
      ];
      const rotYKeyframesMobile = [
        [0.0, -0.25 * Math.PI], // Start rotated 45 degrees to the opposite side
        [0.35, 0.65 * Math.PI],
        [0.65, 1.35 * Math.PI],
        [1.0, 2.0 * Math.PI]
      ];

      targetPosX = 0;
      targetPosY = interpolate(scrollProgress, yKeyframesMobile);
      targetScale = 0.72;
      targetRotY = interpolate(scrollProgress, rotYKeyframesMobile);
    }

    // Calculate targetOpacity based on projected model bottom and card top position
    if (threeMetricsCached && modelGroup && camera) {
      const cardTopY = configTopDoc + cardTopOffsetFromConfig - scrollY;
      const modelBottomVec = new THREE.Vector3(targetPosX, targetPosY - 0.55, 0);
      modelBottomVec.project(camera);

      const modelBottomY = (1 - modelBottomVec.y) * (window.innerHeight / 2) + 30;
      const fadeEndDiff = 20;
      const fadeStartDiff = 90;

      if (cardTopY > modelBottomY + fadeStartDiff) {
        targetOpacity = 1.0;
      } else if (cardTopY > modelBottomY + fadeEndDiff) {
        const t = (cardTopY - (modelBottomY + fadeEndDiff)) / (fadeStartDiff - fadeEndDiff);
        targetOpacity = t * t * (3 - 2 * t);
      } else {
        targetOpacity = 0.0;
      }
    } else {
      if (scrollProgress > 0.8) {
        targetOpacity = Math.max(0, 1 - (scrollProgress - 0.8) * 5.0);
      } else {
        targetOpacity = 1.0;
      }
    }

    // Disable renderer canvas display if configurator scrolled past top
    if (threeMetricsCached) {
      const configRectBottom = configBottomDoc - scrollY;
      if (configRectBottom < 0) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    } else {
      if (scrollY > viewportHeight * 3.5) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    }
  }

  window.addEventListener('scroll', () => {
    evaluateScrollCalculations();
    updateNavbarTheme();
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateThreeLayoutMetrics();
    evaluateScrollCalculations();
    updateNavbarTheme();
    centerActiveCard(false);
  }, { passive: true });

  window.addEventListener('activecardchange', () => {
    updateThreeLayoutMetrics();
    evaluateScrollCalculations();
  });

  if (typeof ResizeObserver !== 'undefined') {
    const threeLayoutObserver = new ResizeObserver(() => {
      updateThreeLayoutMetrics();
      evaluateScrollCalculations();
    });
    threeLayoutObserver.observe(document.body);
  }

  // Dynamic merge cross-fade calculation
  function updateMergeTransition() {
    const highlightedCard = document.querySelector('.carousel-card.highlighted');
    if (!highlightedCard) return;

    highlightedCard.style.opacity = (1 - currentOpacity).toFixed(3);

    const allCards = document.querySelectorAll('.carousel-card');
    allCards.forEach(card => {
      if (!card.classList.contains('highlighted')) {
        card.style.opacity = '';
        const img = card.querySelector('.carousel-card-img-wrap img');
        if (img) img.style.opacity = '1';
      }
    });
  }

  // ─── RENDERING & SMOOTH INTERPOLATION LOOP ───
  function animate() {
    requestAnimationFrame(animate);

    if (isModelLoaded) {
      currentRotY += (targetRotY - currentRotY) * 0.055;
      currentPosX += (targetPosX - currentPosX) * 0.045;
      currentPosY += (targetPosY - currentPosY) * 0.045;
      currentScale += (targetScale - currentScale) * 0.045;

      // Multiply targetOpacity by modelFadeInRatio to handle scroll fade-in on load
      const finalTargetOpacity = targetOpacity * modelFadeInRatio;
      currentOpacity += (finalTargetOpacity - currentOpacity) * 0.06;

      updateMergeTransition();

      barstoolPivot.rotation.y = currentRotY + mouseX * 0.2;
      barstoolPivot.rotation.x = mouseY * 0.1;

      modelGroup.position.x = currentPosX;

      const time = Date.now() * 0.0012;
      const idleWave = Math.sin(time) * 0.015;
      modelGroup.position.y = currentPosY + idleWave;

      const s = Math.max(0.01, currentScale);
      modelGroup.scale.set(s, s, s);

      modelGroup.traverse((child) => {
        if (child.isMesh && child.material !== shadowMat) {
          child.material.transparent = true;
          child.material.opacity = currentOpacity;
        }
      });
      shadowPlane.material.opacity = 0.2 * currentOpacity;
    }

    renderer.render(scene, camera);
  }

  animate();

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

  // ─── NAV BAR BACKGROUND SHIFT THEME CONTROLLER ───
  // Mirrors the same section-aware logic as script.js so the navbar
  // seamlessly transitions between light and dark states as the user scrolls
  // through the different sections of the secondary landing page.
  const navbar = document.getElementById('navbar');

  function updateNavbarTheme() {
    if (!navbar) return;
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 40);

    const navHeight = navbar.offsetHeight || 70;
    const checkY = scrollY + navHeight / 2;

    // Sections with a light background — navbar should use light-nav state
    const lightSections = [
      { selector: '#configurator' },
      { selector: '.materials-section' },
      { selector: '.products-section' },
      { selector: '.collections-section' }
    ];

    // The 3D narrative scroll zone uses the secondary page's light body background,
    // so the navbar stays light-nav there too — we include the hero/narrative zone.
    const darkSections = [
      { selector: '.video-section' }
    ];

    // Check if currently over a dark section (remove light-nav)
    let isDark = false;
    for (const sec of darkSections) {
      const el = document.querySelector(sec.selector);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const height = el.offsetHeight;
        if (checkY >= top && checkY < top + height) {
          isDark = true;
          break;
        }
      }
    }

    if (isDark) {
      navbar.classList.remove('light-nav');
      return;
    }

    // For all other sections (light bg), check explicitly
    let isLight = false;
    for (const sec of lightSections) {
      const el = document.querySelector(sec.selector);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const height = el.offsetHeight;
        if (checkY >= top && checkY < top + height) {
          isLight = true;
          break;
        }
      }
    }

    // Secondary landing page is always light-themed in the 3D narrative + hero zone
    // so default to light-nav unless explicitly over the dark video section
    if (isLight || !isDark) {
      navbar.classList.add('light-nav');
    } else {
      navbar.classList.remove('light-nav');
    }
  }

  window.addEventListener('scroll', updateNavbarTheme, { passive: true });
  window.addEventListener('resize', updateNavbarTheme, { passive: true });
  updateNavbarTheme();

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

  // ─── HORIZONTAL CAROUSEL CONFIGURATOR CODE ───
  let selectedWood = 'teak';
  let selectedPrefix = 't';
  let selectedFolder = 'Teak';
  let activeCushionIndex = 4;

  function centerActiveCard(animate = true) {
    const track = document.querySelector('.carousel-track');
    const container = document.querySelector('.carousel-track-container');
    if (!track || !container) return;

    const cards = document.querySelectorAll('.carousel-card');
    if (cards.length === 0) return;

    cards.forEach((card, idx) => {
      if (idx === activeCushionIndex) {
        card.classList.add('highlighted');
      } else {
        card.classList.remove('highlighted');
        card.style.opacity = '';
        const img = card.querySelector('.carousel-card-img-wrap img');
        if (img) img.style.opacity = '1';
      }
    });

    const activeCard = cards[activeCushionIndex];

    const activeCardImg = activeCard.querySelector('.carousel-card-img-wrap img');
    if (activeCardImg) {
      const scatterImg = document.querySelector('.radial-scatter__item.barstool-item img');
      if (scatterImg) {
        scatterImg.src = activeCardImg.src;
      }
    }

    const containerWidth = container.offsetWidth;
    const cardWidth = activeCard.offsetWidth || 350;
    const cardOffsetLeft = activeCard.offsetLeft;

    const translateX = (containerWidth - cardWidth) / 2 - cardOffsetLeft;

    if (animate) {
      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
      track.style.transition = 'none';
    }

    track.style.transform = `translateX(${translateX}px)`;

    const selectedWoodLabel = document.querySelector('.selected-wood-label');
    const selectedCushionLabel = document.querySelector('.selected-cushion-label');
    if (selectedWoodLabel && selectedCushionLabel) {
      const woodNameMap = {
        'teak': 'Teak',
        'reclaimed-teak': 'Reclaimed Teak',
        'white-ash': 'White Ash'
      };
      selectedWoodLabel.textContent = woodNameMap[selectedWood] || 'Teak';
      selectedCushionLabel.textContent = cushions[activeCushionIndex].charAt(0).toUpperCase() + cushions[activeCushionIndex].slice(1) + ' Cushion';
    }
    window.dispatchEvent(new CustomEvent('activecardchange'));
  }

  function renderCarousel() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    track.innerHTML = '';

    const woodNameMap = {
      'teak': 'Teak',
      'reclaimed-teak': 'Reclaimed Teak',
      'white-ash': 'White Ash'
    };
    const currentWoodName = woodNameMap[selectedWood] || 'Teak';

    cushions.forEach((cushion, idx) => {
      let imgPath = '';

      if (
        typeof isShopifyConnected !== 'undefined' && 
        isShopifyConnected && 
        typeof getProductVariant === 'function'
      ) {
        const formattedCushion = cushion.charAt(0).toUpperCase() + cushion.slice(1);
        const variant = getProductVariant(currentWoodName, formattedCushion);
        if (variant && variant.image) {
          imgPath = variant.image;
        }
      }

      if (!imgPath) {
        const padIdx = String(idx + 1).padStart(2, '0');
        imgPath = `Resources/Barstool/WebP/shopify webp/Noku_ofStillness_Barstool_${padIdx}.webp`;
      }

      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.dataset.cushion = cushion;
      card.dataset.index = idx;

      card.innerHTML = `
        <div class="carousel-card-img-wrap">
          <img src="${imgPath}" alt="Barstool ${selectedWood} ${cushion}">
        </div>
        <div class="carousel-card-info">
          <span class="cushion-name">${cushion.charAt(0).toUpperCase() + cushion.slice(1)}</span>
          <svg class="add-to-cart-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"></path>
            <path d="M8 6a4 4 0 0 1 8 0"></path>
          </svg>
        </div>
      `;

      card.addEventListener('click', () => {
        if (card.classList.contains('highlighted')) {
          window.location.href = `product.html?handle=barstool&wood=${selectedWood}&upholstery=${cushion}`;
          return;
        }
        activeCushionIndex = idx;
        centerActiveCard(true);
      });

      track.appendChild(card);
    });

    centerActiveCard(false);
  }

  const woodSwatches = document.querySelectorAll('.wood-swatch');
  woodSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      woodSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      selectedWood = swatch.dataset.wood;
      selectedPrefix = swatch.dataset.prefix;
      selectedFolder = swatch.dataset.folder;

      renderCarousel();
    });
  });

  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (activeCushionIndex > 0) {
        activeCushionIndex--;
        centerActiveCard(true);
      }
    });

    nextBtn.addEventListener('click', () => {
      if (activeCushionIndex < cushions.length - 1) {
        activeCushionIndex++;
        centerActiveCard(true);
      }
    });
  }

  renderCarousel();

  // ─── PARALLAX MAPPED SCATTER IMAGES IN QUOTE SECTION ───
  (function () {
    const quoteContainer = document.querySelector(".quote_wrap");
    const quoteStage = quoteContainer ? quoteContainer.querySelector(".quote_contain") : null;
    const quoteTextWrap = quoteContainer ? quoteContainer.querySelector(".quote_text_wrap") : null;
    const quoteSub = quoteContainer ? quoteContainer.querySelector(".quote-sub") : null;

    if (!quoteContainer || !quoteStage) return;

    const scatterItems = Array.from(quoteStage.querySelectorAll(".radial-scatter__item"));
    const scatterTotal = scatterItems.length;

    if (!scatterTotal) return;

    let scatterTargetX = 0;
    let scatterTargetY = 0;
    let scatterCurrentX = 0;
    let scatterCurrentY = 0;

    let quoteContainerTopDoc = 0;
    let quoteContainerHeight = 0;
    let quoteStageWidth = 0;
    let quoteStageHeight = 0;
    let quoteStageLeftDoc = 0;
    let quoteStageTopDoc = 0;
    let activeCardDiffX = 0;
    let activeCardCenterYDoc = 0;
    let activeCardCenterXDoc = 0;
    let activeCardWidth = 0;
    let activeCardHeight = 0;
    let activeCardHasData = false;

    function updateLayoutMetrics() {
      if (!quoteContainer || !quoteStage) return;

      const quoteRect = getUnscaledRect(quoteContainer);
      const stageRect = getUnscaledRect(quoteStage);
      quoteContainerTopDoc = quoteRect.top;
      quoteContainerHeight = quoteRect.height || quoteContainer.offsetHeight;
      quoteStageWidth = stageRect.width;
      quoteStageHeight = stageRect.height;
      quoteStageLeftDoc = stageRect.left;
      quoteStageTopDoc = stageRect.top;

      const highlightedCard = document.querySelector('.carousel-card.highlighted');
      if (highlightedCard) {
        const cardImgWrap = highlightedCard.querySelector('.carousel-card-img-wrap');
        if (cardImgWrap) {
          const cardRect = getUnscaledRect(cardImgWrap);
          if (cardRect.width > 0) {
            activeCardWidth = cardRect.width;
            activeCardHeight = cardRect.height;
            activeCardCenterYDoc = cardRect.top + activeCardHeight / 2;
            activeCardCenterXDoc = cardRect.left + activeCardWidth / 2;

            const cardCenterX = activeCardCenterXDoc;
            const targetCenterX = quoteStageLeftDoc + quoteStageWidth / 2;
            activeCardDiffX = cardCenterX - targetCenterX;

            activeCardHasData = true;
            return;
          }
        }
      }
      activeCardHasData = false;
    }

    function clampVal(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function easeOutCubicVal(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function setScatterTargets() {
      const minSide = Math.min(quoteStageWidth || window.innerWidth, window.innerHeight);

      scatterItems.forEach((item, i) => {
        const angle = (Math.PI * 2 * i) / scatterTotal - Math.PI / 2;

        const yRadius =
          minSide * 0.25 +
          (i % 2 === 0 ? minSide * 0.1 : minSide * 0.15) +
          Math.cos(i * 1.41) * minSide * 0.02;

        const xRadius =
          minSide * 0.60 +
          (i % 2 === 0 ? minSide * 0.24 : minSide * 0.34) +
          Math.sin(i * 1.73) * minSide * 0.045;

        item.dataset.tx = (Math.cos(angle) * xRadius).toFixed(2);
        item.dataset.ty = (Math.sin(angle) * yRadius).toFixed(2);
        item.dataset.speed = (0.88 + (i / Math.max(scatterTotal - 1, 1)) * 0.22).toFixed(3);
        item.dataset.minScale = (0.34 + (i % 4) * 0.04).toFixed(3);
      });
    }

    const carouselOuter = document.querySelector('.carousel-outer-wrap');
    const woodSelector = document.querySelector('.wood-selector');
    const selectedDetails = document.querySelector('.selected-details');

    function getScatterProgress() {
      const rectTop = quoteContainerTopDoc - window.scrollY;
      const viewportH = window.innerHeight;
      const stickyDistance = quoteContainerHeight - viewportH;

      if (stickyDistance <= 0) return 1;

      const traveled = clampVal(-rectTop, 0, stickyDistance);
      return traveled / stickyDistance;
    }

    function renderScatterText(baseProgress, p) {
      const s = baseProgress;
      let subOpacity = 0;
      let subY = 15;

      if (s <= 0.1) {
        const t = s / 0.1;
        subOpacity = t * t * (3 - 2 * t);
        subY = 15 * (1 - t);
      } else if (s <= 0.2) {
        subOpacity = 1.0;
        subY = 0;
      } else if (s <= 0.3) {
        const t = (s - 0.2) / 0.1;
        subOpacity = 1 - t * t * (3 - 2 * t);
        subY = -15 * t;
      } else {
        subOpacity = 0;
        subY = -15;
      }

      const activeCardCenteringFactor = clampVal((p - 0.9) / 0.1, 0, 1);
      const finalSubOpacity = subOpacity * activeCardCenteringFactor;

      if (quoteSub) {
        const subScale = 0.96 + (0.04 * finalSubOpacity);
        quoteSub.style.opacity = finalSubOpacity.toFixed(3);
        quoteSub.style.transform =
          "translate(-50%, calc(-50% + var(--sub-y-offset, 230px) + " + subY.toFixed(2) + "px)) " +
          "scale(" + subScale.toFixed(3) + ")";
      }

      let quoteOpacity = 0;
      let quoteY = 20;

      if (s >= 0.4) {
        const t = clampVal((s - 0.4) / 0.35, 0, 1);
        quoteOpacity = t * t * (3 - 2 * t);
        quoteY = 20 * (1 - t);
      } else {
        quoteOpacity = 0;
        quoteY = 20;
      }

      const quoteScale = 0.96 + (0.04 * quoteOpacity);

      if (quoteTextWrap) {
        quoteTextWrap.style.opacity = quoteOpacity.toFixed(3);
        quoteTextWrap.style.transform =
          "translate3d(0, " + quoteY.toFixed(2) + "px, 0) " +
          "scale(" + quoteScale.toFixed(3) + ")";
      }
    }

    function renderScatter() {
      if (!isIntroComplete) {
        requestAnimationFrame(renderScatter);
        return;
      }

      const rectTop = quoteContainerTopDoc - window.scrollY;
      const viewportH = window.innerHeight;
      const p = clampVal(1 - (rectTop / viewportH), 0, 1);

      if (quoteStage) {
        quoteStage.style.overflow = (p < 1) ? "visible" : "hidden";
      }

      const baseProgress = easeOutCubicVal(getScatterProgress());

      scatterCurrentX += (scatterTargetX - scatterCurrentX) * 0.08;
      scatterCurrentY += (scatterTargetY - scatterCurrentY) * 0.08;

      const highlightedCard = document.querySelector('.carousel-card.highlighted');
      let cardImg = null;

      if (highlightedCard) {
        const cardImgWrap = highlightedCard.querySelector('.carousel-card-img-wrap');
        if (cardImgWrap) {
          cardImg = cardImgWrap.querySelector('img');
        }
      }

      if (cardImg) {
        cardImg.style.opacity = "1";
      }

      const fadeOpacity = clampVal(1 - p * 2, 0, 1);
      if (carouselOuter) {
        carouselOuter.style.opacity = fadeOpacity.toFixed(3);
        carouselOuter.style.pointerEvents = p > 0.5 ? "none" : "auto";
      }
      if (woodSelector) {
        woodSelector.style.opacity = fadeOpacity.toFixed(3);
        woodSelector.style.pointerEvents = p > 0.5 ? "none" : "auto";
      }
      if (selectedDetails) {
        selectedDetails.style.opacity = fadeOpacity.toFixed(3);
        selectedDetails.style.pointerEvents = p > 0.5 ? "none" : "auto";
      }

      scatterItems.forEach((item, index) => {
        const isBarstool = item.classList.contains('barstool-item');
        const txBase = parseFloat(item.dataset.tx || "0");
        const tyBase = parseFloat(item.dataset.ty || "0");
        const depthAttr = item.getAttribute("data-depth");
        const depth = depthAttr ? parseFloat(depthAttr) : (0.18 + (index % 5) * 0.06);

        const speed = parseFloat(item.dataset.speed || "1");
        const minScale = parseFloat(item.dataset.minScale || "0.4");

        const s = baseProgress;
        let itemProgress = 0;
        if (s >= 0.3) {
          const mappedS = (s - 0.3) / 0.7;
          itemProgress = clampVal(mappedS * speed, 0, 1);
        }

        const tx = txBase * itemProgress + scatterCurrentX * depth * itemProgress;
        const ty = tyBase * itemProgress + scatterCurrentY * depth * itemProgress;
        const scale = 1 - ((1 - minScale) * itemProgress);

        if (isBarstool) {
          if (activeCardHasData) {
            let itemOpacity = 1;
            if (p < 0.1) {
              itemOpacity = p / 0.1;
            }
            item.style.opacity = itemOpacity.toFixed(3);

            if (p > 0 && p < 1) {
              item.style.position = "fixed";
            } else {
              item.style.position = "absolute";
            }

            const currentStageTopDoc = Math.max(quoteContainerTopDoc, window.scrollY);
            const stageCenterYDoc = currentStageTopDoc + quoteStageHeight / 2;
            const liveCardDiffY = activeCardCenterYDoc - stageCenterYDoc;

            const dx = 0;
            const dy = 0;
            const currentScale = 1;

            const finalX = dx + tx;
            const finalY = dy + ty;
            const finalScale = currentScale * scale;

            item.style.transform =
              "translate(-50%, -50%) " +
              "translate3d(" + finalX.toFixed(2) + "px, " + finalY.toFixed(2) + "px, 0) " +
              "scale(" + finalScale.toFixed(3) + ")";
          } else {
            item.style.position = "absolute";
            item.style.opacity = "1";
            item.style.transform =
              "translate(-50%, -50%) " +
              "translate3d(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px, 0) " +
              "scale(" + scale.toFixed(3) + ")";
          }
        } else {
          let otherOpacity = 0;
          if (s >= 0.3) {
            const mappedS = (s - 0.3) / 0.7;
            otherOpacity = clampVal(mappedS * 5, 0, 1);
          }
          item.style.opacity = otherOpacity.toFixed(3);

          item.style.transform =
            "translate(-50%, -50%) " +
            "translate3d(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px, 0) " +
            "scale(" + scale.toFixed(3) + ")";
        }
      });

      renderScatterText(baseProgress, p);
      requestAnimationFrame(renderScatter);
    }

    function onScatterMove(e) {
      const rectLeft = quoteStageLeftDoc - window.scrollX;
      const rectTop = quoteStageTopDoc - window.scrollY;
      const nx = (e.clientX - rectLeft) / quoteStageWidth - 0.5;
      const ny = (e.clientY - rectTop) / quoteStageHeight - 0.5;

      scatterTargetX = nx * 24;
      scatterTargetY = ny * 14;
    }

    function onScatterLeave() {
      scatterTargetX = 0;
      scatterTargetY = 0;
    }

    updateLayoutMetrics();
    setScatterTargets();

    window.addEventListener("resize", () => {
      updateLayoutMetrics();
      setScatterTargets();
    });
    window.addEventListener("activecardchange", updateLayoutMetrics);

    const initScrollListener = () => {
      updateLayoutMetrics();
      window.removeEventListener('scroll', initScrollListener);
    };
    window.addEventListener('scroll', initScrollListener, { passive: true });

    setTimeout(updateLayoutMetrics, 100);
    setTimeout(updateLayoutMetrics, 500);

    quoteStage.addEventListener("mousemove", onScatterMove);
    quoteStage.addEventListener("mouseleave", onScatterLeave);

    requestAnimationFrame(renderScatter);
  })();
}
)();
