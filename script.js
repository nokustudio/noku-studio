(function () {
  // ─── LOADING PROCESS ───
  const loaderProgress = document.getElementById('loader-progress');
  const loaderScreen = document.getElementById('loading-screen');

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
          document.body.style.backgroundColor = 'var(--dark-bg)';
        }
        sessionStorage.setItem(LOADER_KEY, '1');
      }, 400);
    }
  }

  // Simulate initial asset loading progress, completed when three.js model loads
  let loadPercent = 0;
  let loaderInterval = null;
  if (loaderScreen) {
    if (hasSeenLoader) {
      // Skip loader instantly on repeat visits
      loaderScreen.style.display = 'none';
      document.body.style.backgroundColor = 'var(--dark-bg)';
    } else {
      // First visit — run the full loader animation
      loaderInterval = setInterval(() => {
        if (loadPercent < 85) {
          loadPercent += Math.random() * 12;
          updateLoader(Math.min(loadPercent, 85));
        }
      }, 80);
    }
  }

  // ─── THREE.JS 3D CANVAS REDIRECTS ───
  const container = document.getElementById('three-container');
  const canvas = document.getElementById('three-canvas');

  const scene = new THREE.Scene();

  // Perspective Camera setup
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
  // Warm room ambient light
  const ambientLight = new THREE.AmbientLight(0xEDE6DA, 0.45);
  scene.add(ambientLight);

  // Bright warm key light from upper right front
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

  // Soft cool fill light from left front to soften shadows
  const fillLight = new THREE.DirectionalLight(0xC8D8E8, 0.65);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);

  // Rim light from behind/top to create structural separation outline
  const rimLight = new THREE.DirectionalLight(0xFFF0D0, 0.95);
  rimLight.position.set(-2, 4, -4);
  scene.add(rimLight);

  // Subtle warm uplight
  const floorLight = new THREE.PointLight(0xEDE6DA, 0.25, 10);
  floorLight.position.set(0, -2, 2);
  scene.add(floorLight);

  // ─── 3D MODEL LOADER INTEGRATION ───
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  // Create a pivot group specifically for rotating the barstool mesh, 
  // preventing the shadow plane from tilting
  const barstoolPivot = new THREE.Group();
  modelGroup.add(barstoolPivot);

  // ─── GROUND SHADOW PLANE ───
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.2 });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.75; // aligned to barstool legs bottom
  shadowPlane.receiveShadow = true;
  modelGroup.add(shadowPlane);

  let barstoolMesh = null;
  let isModelLoaded = false;
  const loader = new THREE.GLTFLoader();

  // Configure Draco Loader for compressed GLB files
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
  loader.setDRACOLoader(dracoLoader);

  function runFallback() {
    console.warn('Setting up procedural furniture placeholder.');
    const stoolGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4A2E1B, roughness: 0.6 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xA7B09F, roughness: 0.85 });
    const caneMat = new THREE.MeshStandardMaterial({ color: 0xD5BD8D, roughness: 0.75 });

    // Seat cushion
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.08, 32), cushionMat);
    seat.position.y = 0.15;
    seat.castShadow = true;
    stoolGroup.add(seat);

    // Seat Rim Ring
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.015, 8, 32), woodMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.11;
    stoolGroup.add(rim);

    // Legs
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

    // Horizontal stretchers
    const stretcher = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.01, 8, 4), woodMat);
    stretcher.rotation.x = Math.PI / 2;
    stretcher.rotation.z = Math.PI / 4;
    stretcher.position.y = -0.45;
    stoolGroup.add(stretcher);

    // Backrest columns
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), woodMat);
    postL.position.set(-0.13, 0.34, -0.16);
    postL.rotation.x = -0.06;
    stoolGroup.add(postL);

    const postR = postL.clone();
    postR.position.x = 0.13;
    stoolGroup.add(postR);

    // Backrest top arc
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

  // Load local GLB file directly instead of parsing a massive inlined Base64 string
  loader.load(
    'Resources/Barstool 01 R2.glb',
    function (gltf) {
      barstoolMesh = gltf.scene;

      // Auto-center and adjust model size scale
      const box = new THREE.Box3().setFromObject(barstoolMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Standardise size to fit screen nicely
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scaleFactor = 1.35 / maxDimension;
      barstoolMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Correctly offset the mesh so its geometric center sits at the origin, scaled properly
      barstoolMesh.position.x = -center.x * scaleFactor;
      barstoolMesh.position.z = -center.z * scaleFactor;

      // Align the bottom of the scaled model with y = -0.75
      // bottom in parent space is: position.y + box.min.y * scaleFactor = -0.75
      barstoolMesh.position.y = -0.75 - (box.min.y * scaleFactor);

      // Enable shadow support on all model parts
      barstoolMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Refine shader/materials parameters for luxury tactile look
          if (child.material) {
            child.material.roughness = Math.max(child.material.roughness, 0.4);
            child.material.envMapIntensity = 1.5;
          }
        }
      });

      barstoolPivot.add(barstoolMesh);
      isModelLoaded = true;

      // Complete load sequence
      clearInterval(loaderInterval);
      updateLoader(100);
    },
    function (xhr) {
      // Direct load progress representation on the loading screen
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

  // ─── SCROLL INTERACTIVE MATHEMATICS (Oryzo-inspired) ───
  let scrollProgress = 0;
  let isThreeCanvasVisible = true;

  // Interpolation targets
  let targetRotY = 0;
  let currentRotY = 0;

  let targetPosX = 0;
  let currentPosX = 0;

  let targetPosY = 0;
  let currentPosY = 0;

  let targetScale = 1.0;
  let currentScale = 1.0;

  let targetOpacity = 1.0;
  let currentOpacity = 1.0;

  // Mouse movements offset for parallax
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

  // Caching variables for reflow-free scroll calculations
  let configTopDoc = 0;
  let configBottomDoc = 0;
  let cardTopOffsetFromConfig = 0;
  let configPanelTopDoc = 0;
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
    }

    const configPanel = document.getElementById('config-panel');
    if (configPanel) {
      configPanelTopDoc = getUnscaledRect(configPanel).top;
    }
    threeMetricsCached = true;
  }

  // Keyframe interpolation utility with smoothstep easing
  function interpolate(val, keyframes) {
    if (val <= keyframes[0][0]) return keyframes[0][1];
    if (val >= keyframes[keyframes.length - 1][0]) return keyframes[keyframes.length - 1][1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      const k1 = keyframes[i];
      const k2 = keyframes[i + 1];
      if (val >= k1[0] && val <= k2[0]) {
        const t = (val - k1[0]) / (k2[0] - k1[0]);
        const easedT = t * t * (3 - 2 * t); // Smoothstep ease
        return k1[1] + (k2[1] - k1[1]) * easedT;
      }
    }
    return keyframes[0][1];
  }

  // Listen scroll updates
  function evaluateScrollCalculations() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    // The top of the last narrative panel in document coordinates
    const start = threeMetricsCached ? configPanelTopDoc : (viewportHeight * 3);
    const lockPoint = start + viewportHeight;

    // Lock position to absolute when scrolled past the narrative sections
    if (scrollY >= lockPoint) {
      if (container.style.position !== 'absolute') {
        container.style.position = 'absolute';
        container.style.top = lockPoint + 'px';
      }
    } else {
      if (container.style.position !== 'fixed') {
        container.style.position = 'fixed';
        container.style.top = '0px';
      }
    }

    // Early return if scrolled past the configurator section to avoid unnecessary layout/projection math
    if (threeMetricsCached && scrollY > configBottomDoc) {
      if (isThreeCanvasVisible) {
        container.style.visibility = 'hidden';
        isThreeCanvasVisible = false;
      }
      return;
    }

    let staticCardOpacity = 0.0;

    if (scrollY < start) {
      // ─── PHASE 1: Hero to Specs Panel ───
      const progress = Math.min(Math.max(scrollY / start, 0), 1);

      if (window.innerWidth > 1024) {
        const xKeyframes = [
          [0.0, 0.0],
          [0.35, 0.95],
          [0.65, -0.95],
          [1.0, -0.95]
        ];
        const yKeyframes = [
          [0.0, -0.52],
          [0.35, 0.05],
          [0.65, 0.08],
          [1.0, 0.08]
        ];
        const scaleKeyframes = [
          [0.0, 0.8],
          [0.35, 0.95],
          [0.65, 0.95],
          [1.0, 0.95]
        ];
        const rotYKeyframes = [
          [0.0, 0.0],
          [0.35, 0.65 * Math.PI],
          [0.65, 1.35 * Math.PI],
          [1.0, 1.35 * Math.PI]
        ];

        targetPosX = interpolate(progress, xKeyframes);
        targetPosY = interpolate(progress, yKeyframes);
        targetScale = interpolate(progress, scaleKeyframes);
        targetRotY = interpolate(progress, rotYKeyframes);
      } else {
        const yKeyframesMobile = [
          [0.0, -0.70],
          [0.35, 0.2],
          [0.65, -0.2],
          [1.0, -0.2]
        ];
        const rotYKeyframesMobile = [
          [0.0, 0.0],
          [0.35, 0.65 * Math.PI],
          [0.65, 1.35 * Math.PI],
          [1.0, 1.35 * Math.PI]
        ];

        targetPosX = 0;
        targetPosY = interpolate(progress, yKeyframesMobile);
        targetScale = 0.72;
        targetRotY = interpolate(progress, rotYKeyframesMobile);
      }
      targetOpacity = 1.0;
      staticCardOpacity = 0.0;
    } else {
      // ─── PHASE 2: Last Narrative Panel Sticky Phase (Slide, Pause, Fade) ───
      const localProgress = Math.min(Math.max((scrollY - start) / viewportHeight, 0), 1);

      let targetX = 0.95;
      let targetY = -0.15;
      let targetS = 1.0;
      let targetR = 2.0 * Math.PI;

      if (window.innerWidth <= 1024) {
        targetX = 0;
        targetY = 0.0;
        targetS = 0.72;
      }

      // Slide Phase (0.0 to 0.3)
      if (localProgress <= 0.3) {
        const t = localProgress / 0.3;
        const easedT = t * t * (3 - 2 * t);
        
        const startX = window.innerWidth > 1024 ? -0.95 : 0;
        const startY = window.innerWidth > 1024 ? 0.08 : -0.2;
        const startS = window.innerWidth > 1024 ? 0.95 : 0.72;
        const startR = 1.35 * Math.PI;

        targetPosX = startX + (targetX - startX) * easedT;
        targetPosY = startY + (targetY - startY) * easedT;
        targetScale = startS + (targetS - startS) * easedT;
        targetRotY = startR + (targetR - startR) * easedT;
        
        targetOpacity = 1.0;
        staticCardOpacity = 0.0;
      }
      // Pause Phase (0.3 to 0.6)
      else if (localProgress <= 0.6) {
        targetPosX = targetX;
        targetPosY = targetY;
        targetScale = targetS;
        targetRotY = targetR;
        
        targetOpacity = 1.0;
        staticCardOpacity = 0.0;
      }
      // Fade Phase (0.6 to 0.9)
      else if (localProgress <= 0.9) {
        targetPosX = targetX;
        targetPosY = targetY;
        targetScale = targetS;
        targetRotY = targetR;

        const t = (localProgress - 0.6) / 0.3;
        const easedT = t * t * (3 - 2 * t);
        
        targetOpacity = 1.0 - easedT;
        staticCardOpacity = easedT;
      }
      // Final Phase (0.9 to 1.0 and beyond)
      else {
        targetPosX = targetX;
        targetPosY = targetY;
        targetScale = targetS;
        targetRotY = targetR;
        
        targetOpacity = 0.0;
        staticCardOpacity = 1.0;
      }
    }

    // Apply visibility of WebGL container
    if (scrollY >= lockPoint + viewportHeight * 0.5) {
      if (isThreeCanvasVisible) {
        container.style.visibility = 'hidden';
        isThreeCanvasVisible = false;
      }
    } else {
      if (threeMetricsCached && scrollY > configBottomDoc) {
        // do nothing
      } else {
        if (!isThreeCanvasVisible) {
          container.style.visibility = 'visible';
          isThreeCanvasVisible = true;
        }
      }
    }

    // Update the static default card opacity and pointer events
    const staticCardWrap = document.getElementById('narrative-default-card-wrap');
    if (staticCardWrap) {
      staticCardWrap.style.opacity = staticCardOpacity.toFixed(3);
      if (staticCardOpacity > 0.1) {
        staticCardWrap.style.pointerEvents = 'auto';
      } else {
        staticCardWrap.style.pointerEvents = 'none';
      }
    }
  }

  window.addEventListener('scroll', evaluateScrollCalculations, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateThreeLayoutMetrics();
    evaluateScrollCalculations();
    centerActiveCard(false);
  }, { passive: true });

  window.addEventListener('activecardchange', () => {
    updateThreeLayoutMetrics();
    evaluateScrollCalculations();
  });

  // Setup ResizeObserver to handle layout shifts dynamically
  if (typeof ResizeObserver !== 'undefined') {
    const threeLayoutObserver = new ResizeObserver(() => {
      updateThreeLayoutMetrics();
      evaluateScrollCalculations();
    });
    threeLayoutObserver.observe(document.body);
  }

  // Initialize calculations once on script execution
  updateThreeLayoutMetrics();
  evaluateScrollCalculations();

  // Deferred backup updates to handle dynamic image rendering and page layout shifts
  setTimeout(updateThreeLayoutMetrics, 100);
  setTimeout(updateThreeLayoutMetrics, 500);

  // Dynamic merge cross-fade calculation
  function updateMergeTransition() {
    const highlightedCard = document.querySelector('.carousel-card.highlighted');
    if (!highlightedCard) return;

    // Set card container opacity based on current interpolated opacity (fades in as model dissolves)
    highlightedCard.style.opacity = (1 - currentOpacity).toFixed(3);

    // Reset other cards' opacity/image opacity
    const allCards = document.querySelectorAll('.carousel-card');
    allCards.forEach(card => {
      if (!card.classList.contains('highlighted')) {
        card.style.opacity = ''; // uses default CSS opacity
        const img = card.querySelector('.carousel-card-img-wrap img');
        if (img) img.style.opacity = '1';
      }
    });
  }

  // ─── RENDERING & SMOOTH INTERPOLATION LOOP ───
  function animate() {
    requestAnimationFrame(animate);

    if (!isThreeCanvasVisible) return;

    if (isModelLoaded) {
      // Linear interpolation (lerp) for liquid smooth transitions
      currentRotY += (targetRotY - currentRotY) * 0.055;
      currentPosX += (targetPosX - currentPosX) * 0.045;
      currentPosY += (targetPosY - currentPosY) * 0.045;
      currentScale += (targetScale - currentScale) * 0.045;
      currentOpacity += (targetOpacity - currentOpacity) * 0.06;

      // Merge updates
      updateMergeTransition();

      // Apply rotation only to the barstool pivot group, leaving shadowPlane horizontal!
      barstoolPivot.rotation.y = currentRotY + mouseX * 0.2;
      barstoolPivot.rotation.x = mouseY * 0.1;

      modelGroup.position.x = currentPosX;

      // Subtle hover floating wave animation added to y position target
      const time = Date.now() * 0.0012;
      const idleWave = Math.sin(time) * 0.015;
      modelGroup.position.y = currentPosY + idleWave;

      // Apply scale
      const s = Math.max(0.01, currentScale);
      modelGroup.scale.set(s, s, s);

      // Apply smooth opacity fade on all mesh materials (excluding shadow plane)
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

  // Reveal-on-scroll (.reveal-el) and the navbar "scrolled" toggle are handled by
  // the shared site.js, loaded on every page. Only the homepage-specific light/dark
  // theme observers live here.

  // ─── NAV BAR BACKGROUND SHIFT THEME CONTROLLER ───
  const navbar = document.getElementById('navbar');
  const isHomepage = !!document.getElementById('hero-panel');

  if (navbar) {
    if (!isHomepage) {
      navbar.classList.add('light-nav');
    } else {
      // 2. Navbar Theme Observer: detects when sections cross the navbar line
      const navHeight = navbar.offsetHeight || 70;
      const navThemeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const targetId = entry.target.id;
            const targetClass = entry.target.classList;
            
            const isLight = targetId === 'configurator' ||
                            targetClass.contains('products-section') ||
                            targetClass.contains('collections-section') ||
                            targetClass.contains('materials-section') ||
                            entry.target.tagName.toLowerCase() === 'footer';
            
            if (isLight) {
              navbar.classList.add('light-nav');
            } else {
              navbar.classList.remove('light-nav');
            }
          }
        });
      }, {
        rootMargin: `-${navHeight}px 0px -90% 0px`,
        threshold: 0
      });

      // 3. Body Theme Observer: detects when sections occupy the center of the viewport
      const bodyThemeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const targetId = entry.target.id;
            const targetClass = entry.target.classList;

            const isLight = targetId === 'configurator' ||
                            targetClass.contains('products-section') ||
                            targetClass.contains('collections-section') ||
                            targetClass.contains('materials-section') ||
                            entry.target.tagName.toLowerCase() === 'footer';

            if (isLight) {
              document.body.style.backgroundColor = 'var(--light)';
            } else {
              document.body.style.backgroundColor = 'var(--dark-bg)';
            }
          }
        });
      }, {
        // Wider zone (-30% each side) prevents the zero-height center-only trigger
        // that caused rapid dark/light toggling when fast-scrolling between sections
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0
      });

      // Observe all page sections and elements that define light/dark zones on the homepage
      const targetSections = document.querySelectorAll(
        '#hero-panel, #story-panel, #specs-panel, #config-panel, #configurator, .quote_wrap, .products-section, .collections-section, .materials-section, .video-section, footer'
      );
      targetSections.forEach(sec => {
        navThemeObserver.observe(sec);
        bodyThemeObserver.observe(sec);
      });
    }
  }

  // ─── INSTANT SCROLL TO COLLECTIONS SECTION ───
  const handleCollectionsScroll = (e) => {
    const href = e.currentTarget.getAttribute('href');
    const isCurrentPageAnchor = href === '#collections' || href.endsWith('/index.html#collections') || (window.location.pathname.endsWith('index.html') && href === 'index.html#collections');
    
    if (isCurrentPageAnchor) {
      const target = document.getElementById('collections');
      if (target) {
        e.preventDefault();
        const htmlEl = document.documentElement;
        const originalScrollBehavior = htmlEl.style.scrollBehavior;
        htmlEl.style.scrollBehavior = 'auto';
        
        target.scrollIntoView({ behavior: 'auto' });
        
        requestAnimationFrame(() => {
          htmlEl.style.scrollBehavior = originalScrollBehavior;
        });
        history.pushState(null, null, '#collections');
      }
    }
  };

  document.querySelectorAll('a[href*="#collections"]').forEach(link => {
    link.addEventListener('click', handleCollectionsScroll);
  });

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

  // Pause video when out of viewport
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
  let activeCushionIndex = 4; // linen

  const cushions = ['blush', 'charcoal', 'chestnut', 'cognac', 'linen', 'olive', 'opal', 'vienna'];

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
        card.style.opacity = ''; // Reset opacity style
        const img = card.querySelector('.carousel-card-img-wrap img');
        if (img) img.style.opacity = '1';
      }
    });

    const activeCard = cards[activeCushionIndex];

    // Sync the scatter stack image with the selected cushion variant
    const activeCardImg = activeCard.querySelector('.carousel-card-img-wrap img');
    const scatterImg = document.querySelector('.radial-scatter__item.barstool-item img');
    if (scatterImg) {
      if (activeCardImg) {
        scatterImg.src = activeCardImg.src;
        scatterImg.style.display = '';
      } else {
        scatterImg.src = '';
        scatterImg.style.display = 'none';
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

      // Try to pull from Shopify headless store connection if available
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

      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.dataset.cushion = cushion;
      card.dataset.index = idx;

      const imgHTML = imgPath 
        ? `<img src="${imgPath}" alt="Barstool ${selectedWood} ${cushion}">` 
        : '';

      card.innerHTML = `
        <div class="carousel-card-img-wrap">
          ${imgHTML}
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
          // Double-click/second-click on active card -> go to detail page with variant selected
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

  // Hook wood selectors
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

  // Initial carousel render
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

    let isQuoteInViewport = false;
    let isLoopRunning = false;

    // Document-relative layout metrics cached to avoid forced reflows in the render loop
    let quoteContainerTopDoc = 0;
    let quoteContainerHeight = 0;
    let quoteStageWidth = 0;
    let quoteStageHeight = 0;
    let quoteStageLeftDoc = 0;
    let quoteStageTopDoc = 0;
    let activeCardDiffX = 0;
    let activeCardCenterYDoc = 0; // document-absolute card center Y — diff computed live at render time
    let activeCardCenterXDoc = 0; // document-absolute card center X
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

            // Store document-absolute card center Y and X
            activeCardCenterYDoc = cardRect.top + activeCardHeight / 2;
            activeCardCenterXDoc = cardRect.left + activeCardWidth / 2;

            // Calculate correct horizontal difference relative to target stage center X
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

    // Easing equations mapping scroll progress
    function easeOutCubicVal(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeOutQuadVal(t) {
      return 1 - (1 - t) * (1 - t);
    }

    function mapRangeVal(value, inMin, inMax, outMin, outMax) {
      if (inMax === inMin) return outMax;
      const t = clampVal((value - inMin) / (inMax - inMin), 0, 1);
      return outMin + (outMax - outMin) * t;
    }

    function getBaseWidth(isBarstoolVal) {
      const w = window.innerWidth;
      if (isBarstoolVal) {
        if (w <= 767) return 130;
        if (w <= 991) return 190;
        return 266;
      } else {
        if (w <= 767) return 220;
        if (w <= 991) return 320;
        return 450;
      }
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

      // 1. Animate transition text ("and there's more")
      let subOpacity = 0;
      let subY = 15;

      if (s <= 0.1) {
        const t = s / 0.1;
        subOpacity = t * t * (3 - 2 * t); // smoothstep fade in
        subY = 15 * (1 - t);
      } else if (s <= 0.5) {
        // Extended visibility: stays fully visible through 50% of scroll
        subOpacity = 1.0;
        subY = 0;
      } else if (s <= 0.6) {
        const t = (s - 0.5) / 0.1;
        subOpacity = 1 - t * t * (3 - 2 * t); // smoothstep fade out
        subY = -15 * t;
      } else {
        subOpacity = 0;
        subY = -15;
      }

      // Apply centering factor so it only fades in after the variant card centers
      const activeCardCenteringFactor = clampVal((p - 0.9) / 0.1, 0, 1);
      const finalSubOpacity = subOpacity * activeCardCenteringFactor;

      if (quoteSub) {
        const subScale = 0.96 + (0.04 * finalSubOpacity);
        quoteSub.style.opacity = finalSubOpacity.toFixed(3);
        quoteSub.style.transform =
          "translate(-50%, calc(-50% + var(--sub-y-offset, 230px) + " + subY.toFixed(2) + "px)) " +
          "scale(" + subScale.toFixed(3) + ")";
      }

      // 2. Animate main quote text
      let quoteOpacity = 0;
      let quoteY = 20;

      if (s >= 0.4) {
        const t = clampVal((s - 0.4) / 0.35, 0, 1);
        quoteOpacity = t * t * (3 - 2 * t); // smoothstep
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
      if (!isQuoteInViewport) {
        isLoopRunning = false;
        return;
      }

      isLoopRunning = true;

      const rectTop = quoteContainerTopDoc - window.scrollY;
      const viewportH = window.innerHeight;

      // Calculate transition progress p:
      // p = 0 when quote is below viewport (rectTop >= viewportH)
      // p = 1 when quote reaches top of viewport (rectTop <= 0)
      const p = clampVal(1 - (rectTop / viewportH), 0, 1);

      // Overflow is always 'hidden' in CSS — no dynamic toggling needed
      // (toggling overflow forces layout recalculation every frame)

      const baseProgress = easeOutCubicVal(getScatterProgress());

      scatterCurrentX += (scatterTargetX - scatterCurrentX) * 0.08;
      scatterCurrentY += (scatterTargetY - scatterCurrentY) * 0.08;

      // Use cached highlighted card reference instead of querying DOM every frame
      // The highlighted card is stable and only changes on user interaction (centerActiveCard)
      const highlightedCard = document.querySelector('.carousel-card.highlighted');
      let cardImg = null;

      if (highlightedCard) {
        cardImg = highlightedCard.querySelector('.carousel-card-img-wrap img');
      }

      // Keep the active card image visible so it fades out naturally with the carousel container
      if (cardImg) {
        cardImg.style.opacity = "1";
      }

      // Fade out configurator controls
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

        // Scatter starts only after s (baseProgress) exceeds 0.3
        const s = baseProgress;
        let itemProgress = 0;
        if (s >= 0.3) {
          const mappedS = (s - 0.3) / 0.7;
          itemProgress = clampVal(mappedS * speed, 0, 1);
        }

        // Compute scatter offset and scale
        const tx = txBase * itemProgress + scatterCurrentX * depth * itemProgress;
        const ty = tyBase * itemProgress + scatterCurrentY * depth * itemProgress;
        const scale = 1 - ((1 - minScale) * itemProgress);

        if (isBarstool) {
          if (activeCardHasData) {
            // Smooth fade in over the first 10% of the transition
            let itemOpacity = 1;
            if (p < 0.1) {
              itemOpacity = p / 0.1;
            }
            item.style.opacity = itemOpacity.toFixed(3);

            // Avoid fixed positioning toggling during scroll to prevent GPU paint flushes
            item.style.position = "absolute";

            // dx is 0 to center the variant image horizontally
            const dx = 0;
            // dy is 0 to center the variant image vertically
            const dy = 0;

            // Scale uses the scatter target scale directly, no interpolation from the carousel card size
            const currentScale = 1;

            const finalX = dx + tx;
            const finalY = dy + ty;
            const finalScale = currentScale * scale;

            item.style.transform =
              "translate(-50%, -50%) " +
              "translate3d(" + finalX.toFixed(2) + "px, " + finalY.toFixed(2) + "px, 0) " +
              "scale(" + finalScale.toFixed(3) + ")";
          } else {
            // Fallback: default scatter positioning
            item.style.position = "absolute";
            item.style.opacity = "1";
            item.style.transform =
              "translate(-50%, -50%) " +
              "translate3d(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px, 0) " +
              "scale(" + scale.toFixed(3) + ")";
          }
        } else {
          // Hide other items until scatter starts (i.e. s >= 0.3), then fade them in quickly
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
      // Use live getBoundingClientRect so the coordinates are always correct
      // even when quoteStage is in sticky mode (cached doc-offsets go stale)
      const rect = quoteStage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      scatterTargetX = nx * 24;
      scatterTargetY = ny * 14;
    }

    function onScatterLeave() {
      scatterTargetX = 0;
      scatterTargetY = 0;
    }

    // Initialize targets and layout metrics
    updateLayoutMetrics();
    setScatterTargets();

    window.addEventListener("resize", () => {
      updateLayoutMetrics();
      setScatterTargets();
    });
    window.addEventListener("activecardchange", updateLayoutMetrics);

    // One-time listener to cache metrics once scroll begins
    const initScrollListener = () => {
      updateLayoutMetrics();
      window.removeEventListener('scroll', initScrollListener);
    };
    window.addEventListener('scroll', initScrollListener, { passive: true });

    // Deferred backup updates to handle dynamic image rendering and page layout shifts
    setTimeout(updateLayoutMetrics, 100);
    setTimeout(updateLayoutMetrics, 500);

    quoteStage.addEventListener("mousemove", onScatterMove);
    quoteStage.addEventListener("mouseleave", onScatterLeave);

    // Start renderScatter loop only when quote section is in view
    const quoteObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isQuoteInViewport = entry.isIntersecting;
        if (isQuoteInViewport && !isLoopRunning) {
          requestAnimationFrame(renderScatter);
        } else if (!isQuoteInViewport) {
          // Restore configurator controls when quote section leaves viewport.
          // renderScatter sets inline opacity:0 on these which overrides the
          // .is-revealed CSS class — clearing the inline style hands control
          // back to CSS so they reappear correctly.
          if (carouselOuter) { carouselOuter.style.opacity = ''; carouselOuter.style.pointerEvents = ''; }
          if (woodSelector)  { woodSelector.style.opacity  = ''; woodSelector.style.pointerEvents  = ''; }
          if (selectedDetails) { selectedDetails.style.opacity = ''; selectedDetails.style.pointerEvents = ''; }
        }
      });
    }, {
      rootMargin: "50px 0px 50px 0px"
    });
    quoteObserver.observe(quoteContainer);

    // CORS warning banner for file:// protocol
    if (window.location.protocol === 'file:') {
      const banner = document.createElement('div');
      banner.className = 'cors-warning-banner';
      banner.innerHTML = `
        <span>
          <strong>Security Notice:</strong> Browsers block local 3D assets when using the <code>file://</code> protocol. 
          Please visit <a href="http://localhost:8000/index.html" target="_blank">http://localhost:8000/index.html</a> in your browser to view the interactive 3D scene.
        </span>
        <button class="close-banner-btn" onclick="this.parentElement.remove()">&times;</button>
      `;
      document.body.appendChild(banner);
    }
  })();

  // ─── FEATURED PRODUCTS CAROUSEL CODE ───
  let activeProductIndex = 1; // Start with the second product highlighted/centered (Lounge Chair)

  function centerActiveProduct(animate = true) {
    const track = document.querySelector('.featured-carousel-track');
    const container = document.querySelector('.featured-carousel-track-container');
    if (!track || !container) return;

    const cards = track.querySelectorAll('.product-card');
    if (cards.length === 0) return;

    // Constrain active index
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

    // Add click listeners to cards
    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        // If clicking buttons/links inside the card, don't trigger carousel shift or navigation
        if (e.target.closest('.product-add-to-cart-btn') || e.target.closest('.product-inquire-btn') || e.target.closest('a')) {
          return;
        }

        if (card.classList.contains('highlighted')) {
          const handle = card.getAttribute('data-handle');
          if (handle) {
            window.location.href = `product.html?handle=${handle}`;
          }
          return;
        }

        activeProductIndex = idx;
        centerActiveProduct(true);
      });
    });

    // Prev/Next buttons
    const prevBtn = document.querySelector('.featured-carousel-outer-wrap .prev-btn');
    const nextBtn = document.querySelector('.featured-carousel-outer-wrap .next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (activeProductIndex > 0) {
          activeProductIndex--;
          centerActiveProduct(true);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (activeProductIndex < cards.length - 1) {
          activeProductIndex++;
          centerActiveProduct(true);
        }
      });
    }

    // Call centering initially
    centerActiveProduct(false);

    // Safari / loading delays layout shifts
    setTimeout(() => centerActiveProduct(false), 150);
    setTimeout(() => centerActiveProduct(false), 600);
  }

  // Hook into window resize and custom load events
  window.addEventListener('resize', () => {
    centerActiveProduct(false);
  }, { passive: true });

  window.addEventListener('featuredproductsloaded', () => {
    centerActiveProduct(false);
  });

  window.addEventListener('load', () => {
    centerActiveProduct(false);
  });

  // Initialize
  initFeaturedProductsCarousel();
}
)();
