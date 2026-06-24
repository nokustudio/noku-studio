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

  // ─── Mobile: drag to rotate the model (touch/pointer) ───
  // On ≤1024 the model is pinned in the hero (no scroll-driven motion); the user
  // spins it horizontally instead. touch-action: pan-y (set in CSS) lets vertical
  // swipes scroll the page while horizontal drags rotate the barstool.
  const MOBILE_BP = 1024;
  let dragRotY = 0;        // accumulated user rotation (radians)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRot = 0;

  function onDragStart(clientX) {
    if (window.innerWidth > MOBILE_BP) return;
    isDragging = true;
    dragStartX = clientX;
    dragStartRot = dragRotY;
  }
  function onDragMove(clientX) {
    if (!isDragging) return;
    const dx = clientX - dragStartX;
    dragRotY = dragStartRot + dx * 0.01; // ~ a full turn per ~630px of drag
  }
  function onDragEnd() { isDragging = false; }

  container.addEventListener('pointerdown', (e) => onDragStart(e.clientX), { passive: true });
  window.addEventListener('pointermove', (e) => onDragMove(e.clientX), { passive: true });
  window.addEventListener('pointerup', onDragEnd, { passive: true });
  window.addEventListener('pointercancel', onDragEnd, { passive: true });

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
  let productsTopDoc = 0;
  let productsHeight = 0;
  let threeMetricsCached = false;
  let activeProductIndex = 1; // Start with the second product highlighted/centered (Lounge Chair)
  let isProductsAnimActive = false;

  function updateThreeLayoutMetrics() {
    const configPanel = document.getElementById('config-panel');
    if (configPanel) {
      configPanelTopDoc = getUnscaledRect(configPanel).top;
    }

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
    } else {
      // Fallback if configurator section is not on the page (e.g. removed from index.html)
      configTopDoc = configPanelTopDoc + window.innerHeight;
      configBottomDoc = configTopDoc + window.innerHeight * 2;
      cardTopOffsetFromConfig = 0;
    }

    const productsSec = document.querySelector('.products-section');
    if (productsSec) {
      const productsRect = getUnscaledRect(productsSec);
      productsTopDoc = productsRect.top;
      productsHeight = productsRect.height;
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

    // ── Mobile (≤1024): the model lives in the hero ONLY. Pin it at a fixed
    //    transform and fade it out as the hero scrolls away, so it never drifts
    //    over the story / specs / config text. Rotation comes from drag, not
    //    scroll (see onDragMove). This bypasses all the desktop morph math. ──
    if (window.innerWidth <= MOBILE_BP) {
      // The model lives in a container pinned to the TOP of the document (the
      // hero stage), so it simply scrolls away with the hero. No fade, no
      // scroll-driven motion — just a fixed transform. Rotation comes from drag.
      container.style.position = 'absolute';
      container.style.top = '0px';

      targetPosX = 0;
      targetPosY = -0.20;
      targetScale = 0.56;
      targetRotY = 0;       // base orientation; drag adds on top in animate()
      targetOpacity = 1;    // fade-on-scroll disabled on mobile

      // Stop rendering once the hero (and its model) has scrolled off-screen.
      const visible = scrollY < viewportHeight * 1.05;
      if (visible !== isThreeCanvasVisible) {
        container.style.visibility = visible ? 'visible' : 'hidden';
        isThreeCanvasVisible = visible;
      }
      return;
    }

    // Early return if scrolled past the configurator section to avoid unnecessary layout/projection math
    if (threeMetricsCached && scrollY > configBottomDoc) {
      if (isThreeCanvasVisible) {
        container.style.visibility = 'hidden';
        isThreeCanvasVisible = false;
      }

      return;
    }

    let finalLandingX = 0.95;
    let finalLandingY = 0.0;

    const frameRect = document.querySelector('.model-frame-rect');
    if (frameRect && window.innerWidth > 1024 && typeof THREE !== 'undefined' && camera) {
      const rectViewport = frameRect.getBoundingClientRect();
      const centerX = rectViewport.left + rectViewport.width / 2;
      const centerY = window.innerHeight / 2; // Center vertically when sticky
      
      const ndcX = (centerX / window.innerWidth) * 2 - 1;
      const ndcY = -(centerY / window.innerHeight) * 2 + 1;
      
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      
      const dir = vec.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      finalLandingX = pos.x;
      finalLandingY = pos.y;
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
          [1.0, finalLandingX] // Slides smoothly to the final centered Y coordinate
        ];
        const yKeyframes = [
          [0.0, -0.52],
          [0.35, 0.05],
          [0.65, 0.08],
          [1.0, finalLandingY] // Slides smoothly to the final centered Y coordinate
        ];
        const scaleKeyframes = [
          [0.0, 0.8],
          [0.35, 0.95],
          [0.65, 0.95],
          [1.0, 1.0]
        ];
        const rotYKeyframes = [
          [0.0, 0.0],
          [0.35, 0.65 * Math.PI],
          [0.65, 1.35 * Math.PI],
          [1.0, 2.0 * Math.PI] // Rotates smoothly to face front
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
          [1.0, 0.0]
        ];
        const rotYKeyframesMobile = [
          [0.0, 0.0],
          [0.35, 0.65 * Math.PI],
          [0.65, 1.35 * Math.PI],
          [1.0, 2.0 * Math.PI]
        ];

        targetPosX = 0;
        targetPosY = interpolate(progress, yKeyframesMobile);
        targetScale = 0.72;
        targetRotY = interpolate(progress, rotYKeyframesMobile);
      }
      targetOpacity = 1.0;
      staticCardOpacity = 0.0;
    } else {
      // ─── PHASE 2: Last Narrative Panel Sticky Phase (Pause & Fade) ───
      const localProgress = Math.min(Math.max((scrollY - start) / viewportHeight, 0), 1);

      let targetX = finalLandingX;
      let targetY = finalLandingY;
      let targetS = 1.0;
      let targetR = 2.0 * Math.PI;

      if (window.innerWidth <= 1024) {
        targetX = 0;
        targetY = 0.0;
        targetS = 0.72;
      }

      // Always remain fixed at target coordinates during Phase 2
      targetPosX = targetX;
      targetPosY = targetY;

      // Pause Phase (0.0 to 0.5 local progress)
      if (localProgress <= 0.5) {
        targetScale = targetS;
        targetRotY = targetR;
        targetOpacity = 1.0;
        staticCardOpacity = 0.0;
      }
      // Fade & Transform Phase (0.5 to 0.8 local progress)
      else if (localProgress <= 0.8) {
        const t = (localProgress - 0.5) / 0.3;
        const easedT = t * t * (3 - 2 * t);
        
        targetScale = targetS * (1.0 - easedT * 0.4); // Scale down to 0.6 * targetS
        targetRotY = targetR - easedT * (55 * Math.PI / 180); // Rotate to -55 degrees relatively
        targetOpacity = 1.0 - easedT;
        staticCardOpacity = easedT;
      }
      // Final Phase (0.8 to 1.0 and beyond)
      else {
        targetScale = targetS * 0.6;
        targetRotY = targetR - (55 * Math.PI / 180);
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
        staticCardWrap.classList.add('active');
      } else {
        staticCardWrap.classList.remove('active');
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
      // Mobile: user drag spins it. Desktop: subtle mouse-parallax tilt.
      const onMobile = window.innerWidth <= MOBILE_BP;
      barstoolPivot.rotation.y = currentRotY + (onMobile ? dragRotY : mouseX * 0.2);
      barstoolPivot.rotation.x = onMobile ? 0 : mouseY * 0.1;

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

      // Observe all page sections and elements that define light/dark zones on the homepage
      const targetSections = document.querySelectorAll(
        '#hero-panel, #story-panel, #specs-panel, #config-panel, #configurator, .products-section, .collections-section, .materials-section, .video-section, footer'
      );
      targetSections.forEach(sec => {
        navThemeObserver.observe(sec);
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
  let activeCushionIndex = 4; // default linen index (updated dynamically)
  let activeCushionName = 'linen';
  let currentCushionsList = [];
  let autoRotateInterval = null;
  let isUserInteracted = false;
  let isHovered = false;
  let currentPositionIndex = 4; // default position in the track (will be initialized in renderCarousel)

  function startAutoRotate() {
    if (autoRotateInterval) clearInterval(autoRotateInterval);
    autoRotateInterval = setInterval(() => {
      if (isUserInteracted || isHovered) return;
      const N = currentCushionsList.length;
      if (N > 0) {
        currentPositionIndex++;
        centerActiveCard(true);
      }
    }, 2000);
  }

  function stopAutoRotate() {
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
      autoRotateInterval = null;
    }
  }

  function handleLoopBoundary() {
    const N = currentCushionsList.length;
    if (N === 0) return;

    if (currentPositionIndex < N) {
      currentPositionIndex += N;
      centerActiveCard(false);
    } else if (currentPositionIndex >= 2 * N) {
      currentPositionIndex -= N;
      centerActiveCard(false);
    }
  }

  function cleanCushionDisplayName(name) {
    return name
      .replace(/^fabric\s*-\s*/i, '')
      .replace(/^leather\s*-\s*/i, '')
      .trim();
  }

  function updateCushionsList() {
    const woodNameMap = {
      'teak': 'Teak',
      'reclaimed-teak': 'Reclaimed Teak',
      'white-ash': 'White Ash'
    };
    const currentWoodName = woodNameMap[selectedWood] || 'Teak';
    const list = [];
    const seen = new Set();

    if (
      typeof isShopifyConnected !== 'undefined' &&
      isShopifyConnected &&
      typeof shopifyProductVariants !== 'undefined' &&
      shopifyProductVariants.length > 0
    ) {
      const normWood = currentWoodName.toLowerCase().replace(/[^a-z0-9]/g, '');

      shopifyProductVariants.forEach(variant => {
        let matchesWood = false;
        let cushionVal = '';

        variant.selectedOptions.forEach(opt => {
          const name = opt.name.toLowerCase();
          const val = opt.value.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (name.includes('wood') || name.includes('finish')) {
            if (normWood === 'reclaimedteak') {
              matchesWood = val === 'reclaimedteak' || val.includes('reclaimedteak');
            } else if (normWood === 'teak') {
              matchesWood = (val === 'teak' || val === 'solidteak' || val.includes('teak')) && !val.includes('reclaimed');
            } else {
              matchesWood = val.includes(normWood) || normWood.includes(val);
            }
          } else {
            cushionVal = opt.value;
          }
        });

        if (matchesWood && cushionVal) {
          const normCushion = cushionVal.toLowerCase()
            .replace(/^fabric\s*-\s*/, '')
            .replace(/^leather\s*-\s*/, '')
            .replace(/[^a-z0-9]/g, '');

          if (!seen.has(normCushion)) {
            seen.add(normCushion);
            list.push({
              name: cushionVal,
              normalizedName: normCushion,
              image: variant.image ? variant.image.url : null,
              variantId: variant.id
            });
          }
        }
      });
    }

    // Fallback if list is empty (Shopify not connected yet or empty response)
    if (list.length === 0) {
      const fallbackCushions = ['blush', 'charcoal', 'chestnut', 'cognac', 'linen', 'olive', 'opal', 'vienna'];
      fallbackCushions.forEach(cushion => {
        list.push({
          name: cushion.charAt(0).toUpperCase() + cushion.slice(1),
          normalizedName: cushion,
          image: null,
          variantId: `gid://shopify/ProductVariant/mock-barstool-${selectedWood}-${cushion}`
        });
      });
    }

    currentCushionsList = list;

    // Keep activeCushionIndex in sync with activeCushionName
    let activeIdx = currentCushionsList.findIndex(c => c.normalizedName === activeCushionName);
    if (activeIdx === -1) {
      activeIdx = 0;
      activeCushionName = currentCushionsList[0].normalizedName;
    }
    activeCushionIndex = activeIdx;
  }

  function createCardElement(cushionObj, idx, isNarrative = false) {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.cushion = cushionObj.normalizedName;
    card.dataset.index = idx;
    if (isNarrative) {
      card.id = `narrative-card-${idx}`;
    }

    const rawImgPath = cushionObj.image || '';
    // Size to the carousel card via the Shopify CDN (defined in shopify-integration.js)
    // so we don't ship the multi-megapixel original into a ~263px card. Guarded in
    // case that helper isn't loaded; non-Shopify URLs pass through untouched.
    const imgPath = (rawImgPath && typeof sizeShopifyImage === 'function')
      ? sizeShopifyImage(rawImgPath, Math.round(340 * Math.min(window.devicePixelRatio || 1, 3)))
      : rawImgPath;
    const imgHTML = imgPath
      ? `<img src="${imgPath}" alt="Stilt Barstool ${selectedWood} ${cushionObj.normalizedName}">`
      : '';

    const displayName = cleanCushionDisplayName(cushionObj.name);

    card.innerHTML = `
      <div class="carousel-card-img-wrap">
        ${imgHTML}
      </div>
      <div class="carousel-card-info">
        <span class="cushion-name">${displayName.charAt(0).toUpperCase() + displayName.slice(1)}</span>
        <svg class="add-to-cart-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"></path>
          <path d="M8 6a4 4 0 0 1 8 0"></path>
        </svg>
      </div>
    `;

    card.addEventListener('click', (e) => {
      console.log('Card click event triggered. isNarrative:', isNarrative, 'cushionObj:', cushionObj, 'selectedWood:', selectedWood);
      // If clicking cart icon, let the cart handler handle it
      if (e.target.closest('.add-to-cart-icon')) {
        console.log('Cart icon clicked inside card.');
        const woodNameMap = {
          'teak': 'Teak',
          'reclaimed-teak': 'Reclaimed Teak',
          'white-ash': 'White Ash'
        };
        const currentWoodName = woodNameMap[selectedWood] || 'Teak';
        console.log('Calling addItemToCart with:', 'Stilt Barstool', currentWoodName, cushionObj.name);
        if (typeof window.addItemToCart === 'function') {
          window.addItemToCart('Stilt Barstool', currentWoodName, cushionObj.name, cushionObj.image || imgPath);
        } else {
          console.warn('window.addItemToCart is not a function.');
        }
        return;
      }
      

      if (card.classList.contains('highlighted')) {
        const destUrl = `product.html?handle=barstool&wood=${selectedWood}&upholstery=${cushionObj.normalizedName}`;
        console.log('Redirecting in highlighted mode to:', destUrl);
        window.location.href = destUrl;
        return;
      }
      
      if (card.parentNode) {
        const siblings = Array.from(card.parentNode.querySelectorAll('.carousel-card'));
        const clickedIdx = siblings.indexOf(card);
        
        if (card.parentNode.classList.contains('narrative-carousel-track')) {
          currentPositionIndex = clickedIdx;
          isUserInteracted = true;
          centerActiveCard(true);
        } else {
          // mainTrack is not cloned
          activeCushionIndex = idx;
          activeCushionName = cushionObj.normalizedName;
          const N = currentCushionsList.length;
          currentPositionIndex = N + idx;
          isUserInteracted = true;
          centerActiveCard(true);
        }
      }
    });

    return card;
  }

  function centerActiveCard(animate = true) {
    const mainTrack = document.querySelector('#configurator .carousel-track');
    const mainContainer = document.querySelector('#configurator .carousel-track-container');
    
    const narrativeTrack = document.querySelector('.narrative-carousel-track');
    const narrativeContainer = document.querySelector('.narrative-carousel-track-container');

    const N = currentCushionsList.length;
    if (N === 0) return;

    const originalIdx = (currentPositionIndex % N + N) % N;

    // Update main track highlighted classes
    if (mainTrack) {
      const mainCards = mainTrack.querySelectorAll('.carousel-card');
      mainCards.forEach((card, idx) => {
        if (idx === originalIdx) {
          card.classList.add('highlighted');
        } else {
          card.classList.remove('highlighted');
          card.style.opacity = '';
        }
      });
    }

    // Update narrative track highlighted classes
    if (narrativeTrack) {
      const narrativeCards = narrativeTrack.querySelectorAll('.carousel-card');
      narrativeCards.forEach((card, idx) => {
        if (idx === currentPositionIndex) {
          card.classList.add('highlighted');
        } else {
          card.classList.remove('highlighted');
          card.style.opacity = '';
        }
      });
    }

    // Find active card to sync scatter stacks
    const cards = document.querySelectorAll('.carousel-card');
    const activeCards = Array.from(cards).filter(c => parseInt(c.dataset.index) === originalIdx);
    if (activeCards.length > 0) {
      const activeCardImg = activeCards[0].querySelector('.carousel-card-img-wrap img');
      const scatterImg = document.querySelector('.radial-scatter__item.barstool-item img');
      if (scatterImg && activeCardImg) {
        scatterImg.src = activeCardImg.src;
        scatterImg.style.display = '';
      }
    }

    // Translate main track
    if (mainTrack && mainContainer) {
      const activeCard = mainTrack.querySelector('.carousel-card.highlighted');
      if (activeCard) {
        const containerWidth = mainContainer.offsetWidth;
        const cardWidth = activeCard.offsetWidth || 320;
        const cardOffsetLeft = activeCard.offsetLeft;
        const translateX = (containerWidth - cardWidth) / 2 - cardOffsetLeft;
        
        mainTrack.style.transition = animate ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
        mainTrack.style.transform = `translateX(${translateX}px)`;
      }
    }

    // Translate narrative track
    if (narrativeTrack && narrativeContainer) {
      const narrativeCards = narrativeTrack.querySelectorAll('.carousel-card');
      const activeCard = narrativeCards[currentPositionIndex];
      if (activeCard) {
        const containerWidth = narrativeContainer.offsetWidth;
        const cardWidth = activeCard.offsetWidth || 320;
        const cardOffsetLeft = activeCard.offsetLeft;
        const translateX = (containerWidth - cardWidth) / 2 - cardOffsetLeft;
        
        narrativeTrack.style.transition = animate ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
        narrativeTrack.style.transform = `translateX(${translateX}px)`;
      }
    }

    const selectedWoodLabel = document.querySelector('.selected-wood-label');
    const selectedCushionLabel = document.querySelector('.selected-cushion-label');
    if (selectedWoodLabel && selectedCushionLabel) {
      const woodNameMap = {
        'teak': 'Teak',
        'reclaimed-teak': 'Reclaimed Teak',
        'white-ash': 'White Ash'
      };
      selectedWoodLabel.textContent = woodNameMap[selectedWood] || 'Teak';
      if (currentCushionsList[originalIdx]) {
        const rawName = currentCushionsList[originalIdx].name;
        const cleanedName = cleanCushionDisplayName(rawName);
        selectedCushionLabel.textContent = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1) + ' Cushion';
      }
    }

    // Update activeCushionIndex and activeCushionName so the rest of the code is synced
    activeCushionIndex = originalIdx;
    activeCushionName = currentCushionsList[originalIdx].normalizedName;

    window.dispatchEvent(new CustomEvent('activecardchange'));
  }

  function renderCarousel() {
    const mainTrack = document.querySelector('#configurator .carousel-track');
    const narrativeTrack = document.querySelector('.narrative-carousel-track');

    updateCushionsList();

    if (mainTrack) mainTrack.innerHTML = '';
    if (narrativeTrack) narrativeTrack.innerHTML = '';

    const N = currentCushionsList.length;

    currentCushionsList.forEach((cushionObj, idx) => {
      // Build main carousel card
      if (mainTrack) {
        const card = createCardElement(cushionObj, idx);
        mainTrack.appendChild(card);
      }
    });

    if (narrativeTrack) {
      // 1. Prepend clones
      currentCushionsList.forEach((cushionObj, idx) => {
        const card = createCardElement(cushionObj, idx, true);
        card.id = `narrative-card-clone-prev-${idx}`;
        card.classList.add('clone-card');
        narrativeTrack.appendChild(card);
      });

      // 2. Add original cards
      currentCushionsList.forEach((cushionObj, idx) => {
        const card = createCardElement(cushionObj, idx, true);
        narrativeTrack.appendChild(card);
      });

      // 3. Append clones
      currentCushionsList.forEach((cushionObj, idx) => {
        const card = createCardElement(cushionObj, idx, true);
        card.id = `narrative-card-clone-next-${idx}`;
        card.classList.add('clone-card');
        narrativeTrack.appendChild(card);
      });

      currentPositionIndex = N + activeCushionIndex;
    }

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
      isUserInteracted = true;

      renderCarousel();
    });
  });

  // Hook navigation buttons for both carousels
  const mainPrev = document.querySelector('.variants-section .prev-btn');
  const mainNext = document.querySelector('.variants-section .next-btn');
  if (mainPrev && mainNext) {
    mainPrev.addEventListener('click', () => {
      if (activeCushionIndex > 0) {
        activeCushionIndex--;
        activeCushionName = currentCushionsList[activeCushionIndex].normalizedName;
        const N = currentCushionsList.length;
        currentPositionIndex = N + activeCushionIndex;
        centerActiveCard(true);
      }
    });
    mainNext.addEventListener('click', () => {
      if (activeCushionIndex < currentCushionsList.length - 1) {
        activeCushionIndex++;
        activeCushionName = currentCushionsList[activeCushionIndex].normalizedName;
        const N = currentCushionsList.length;
        currentPositionIndex = N + activeCushionIndex;
        centerActiveCard(true);
      }
    });
  }

  const narrativePrev = document.querySelector('.narrative-prev-btn');
  const narrativeNext = document.querySelector('.narrative-next-btn');
  if (narrativePrev && narrativeNext) {
    narrativePrev.addEventListener('click', () => {
      const N = currentCushionsList.length;
      if (N === 0) return;
      if (currentPositionIndex > 0) {
        currentPositionIndex--;
        isUserInteracted = true;
        centerActiveCard(true);
      }
    });
    narrativeNext.addEventListener('click', () => {
      const N = currentCushionsList.length;
      if (N === 0) return;
      if (currentPositionIndex < 3 * N - 1) {
        currentPositionIndex++;
        isUserInteracted = true;
        centerActiveCard(true);
      }
    });
  }

  // Listen to shopifyloaded to pull variant-specific images once Shopify is ready
  window.addEventListener('shopifyloaded', () => {
    console.log('Shopify loaded event received in script.js. Re-rendering configurator carousels.');
    renderCarousel();
  });

  // Setup mouse enter / leave for auto-rotation
  const narrativeContainer = document.querySelector('.narrative-carousel-track-container');
  if (narrativeContainer) {
    narrativeContainer.addEventListener('mouseenter', () => {
      isHovered = true;
    });
    narrativeContainer.addEventListener('mouseleave', () => {
      isHovered = false;
    });
  }

  // Transitionend listener for loop repositioning
  const narrativeTrack = document.querySelector('.narrative-carousel-track');
  if (narrativeTrack) {
    narrativeTrack.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform') {
        handleLoopBoundary();
      }
    });
  }

  // Initial carousel render
  renderCarousel();
  startAutoRotate();

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

  // ─── FEATURED PRODUCTS CAROUSEL CODE ───

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
            // Open the product page only. The Get-in-touch modal must be opened
            // explicitly via the Inquire button (an <a> excluded above), never by
            // clicking the card itself — so no &inquire=true here.
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
    syncFeaturedBarstoolCard();
  });

  window.addEventListener('load', () => {
    centerActiveProduct(false);
    syncFeaturedBarstoolCard();
  });

  // ─── FEATURED PIECES DYNAMIC CAROUSEL ANIMATION SYSTEM ───


  function syncFeaturedBarstoolCard() {
    // Stop syncing once the entrance animation has fully completed
    if (featuredAnimTriggered && !isProductsAnimActive) return;

    const barstoolCard = document.querySelector('.product-card[data-handle="barstool"]');
    if (!barstoolCard) return;

    const selectedWoodText = document.querySelector('.narrative-wood-swatches .wood-swatch.active')?.textContent.trim() || 'Teak';
    const selectedCushionText = document.querySelector('.narrative-carousel-track .carousel-card.highlighted .cushion-name')?.textContent.trim() || 'Linen';
    
    // Format materials label
    const materialsEl = barstoolCard.querySelector('.product-materials');
    if (materialsEl) {
      materialsEl.textContent = `${selectedWoodText} / Fabric — ${selectedCushionText}`;
    }

    // Get image URL from active narrative cushion card
    const activeNarrativeCardImg = document.querySelector('.narrative-carousel-track .carousel-card.highlighted .carousel-card-img-wrap img');
    if (activeNarrativeCardImg && activeNarrativeCardImg.src) {
      const imgWrap = barstoolCard.querySelector('.product-card-img-wrap');
      if (imgWrap) {
        let img = imgWrap.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.loading = 'lazy';
          img.decoding = 'async';
          img.width = 800;
          img.height = 1000;
          imgWrap.appendChild(img);
        }
        img.src = activeNarrativeCardImg.src;
        img.alt = `Stilt Barstool ${selectedWoodText} ${selectedCushionText}`;
      }
    }

    // Get pricing and variant ID if Shopify is connected
    if (typeof getProductVariant === 'function') {
      const variant = getProductVariant(selectedWoodText, selectedCushionText);
      if (variant) {
        barstoolCard.setAttribute('data-variant-id', variant.id);
        barstoolCard.setAttribute('data-variant-price', variant.price.toString());
        barstoolCard.setAttribute('data-variant-title', `${selectedWoodText} / Fabric — ${selectedCushionText}`);
        barstoolCard.setAttribute('data-variant-image', variant.image || (activeNarrativeCardImg ? activeNarrativeCardImg.src : ''));
        
        const priceEl = barstoolCard.querySelector('.product-price');
        if (priceEl && typeof formatCurrency === 'function') {
          // Show the entry price ("From ₹X") across all barstool variants, not
          // the selected one; data-variant-price above still drives the cart.
          const minPrice = (typeof getMinBarstoolPrice === 'function') ? getMinBarstoolPrice() : null;
          priceEl.textContent = `From ${formatCurrency(minPrice != null ? minPrice : variant.price)}`;
        }
      }
    }
  }

  // ─── VIEWPORT-TRIGGERED FEATURED SECTION ENTRANCE ANIMATION ───
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

    // Disable entrance animation and "There's more" text on mobile breakpoint (width <= 768px)
    if (window.matchMedia('(max-width: 768px)').matches) {
      featuredAnimTriggered = true;
      isProductsAnimActive = false;
      if (moreText) {
        moreText.style.display = 'none';
      }
      // Center the active card initially on mobile
      centerActiveProduct(false);
      return;
    }

    // ── Set initial hidden state ──
    // Hide all cards, buttons, header
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

    // Center track on barstool card (index 0)
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
          // Check if the section is fully in the viewport
          const rect = entry.target.getBoundingClientRect();
          const isFullyVisible = rect.top >= -10 && rect.bottom <= window.innerHeight + 10;
          // Fallback: if section is taller than viewport, trigger at 50%
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
    // Re-calculate translations in case layout shifted
    const containerWidth = container.offsetWidth;
    const cardWidth = barstoolCard.offsetWidth || 320;
    const barstoolOffset = barstoolCard.offsetLeft;
    const translateX_centered = (containerWidth - cardWidth) / 2 - barstoolOffset;

    // Normal position: center on activeProductIndex (default 1, the second card)
    const activeCard = cards[activeProductIndex] || cards[1];
    const activeCardWidth = activeCard.offsetWidth || 320;
    const activeOffset = activeCard.offsetLeft;
    const translateX_normal = (containerWidth - activeCardWidth) / 2 - activeOffset;

    // Ensure centered position is set
    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX_centered}px)`;

    // Position the "There's more" text to the left of the centered Barstool card
    if (moreText) {
      const outerWrap = document.querySelector('.featured-carousel-outer-wrap');
      if (outerWrap) {
        const outerRect = outerWrap.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Barstool card visual left edge = container left + card position in track + track translation
        const barstoolVisualLeft = containerRect.left + barstoolOffset + translateX_centered;
        // Position text to the left of the card, with a gap
        const textRight = barstoolVisualLeft - outerRect.left - 60; // 60px gap from card edge
        moreText.style.right = `calc(100% - ${textRight}px)`;
      }
    }

    // ── Phase 0: Fade in header (200ms) ──
    requestAnimationFrame(() => {
      if (header) {
        header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
      }

      // ── Phase 1: Fade in Barstool card + "There's more" text (after 200ms) ──
      setTimeout(() => {
        barstoolCard.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
        barstoolCard.style.opacity = '1';
        barstoolCard.style.transform = 'scale(1.03)';

        if (moreText) {
          moreText.style.transition = 'opacity 0.7s ease 0.15s';
          moreText.style.opacity = '1';
        }

        // ── Phase 2: Translate track left + reveal other cards (after 1.2s) ──
        setTimeout(() => {
          // Fade out "There's more" text
          if (moreText) {
            moreText.style.transition = 'opacity 0.5s ease';
            moreText.style.opacity = '0';
          }

          // Slide track to normal position
          track.style.transition = 'transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)';
          track.style.transform = `translateX(${translateX_normal}px)`;

          // Fade in other cards with staggered delay
          cards.forEach((card, idx) => {
            if (card === barstoolCard) {
              // Scale the barstool back to its resting scale
              const isActiveCard = (idx === activeProductIndex);
              const restScale = isActiveCard ? 1.03 : 0.92;
              card.style.transition = 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
              card.style.transform = `scale(${restScale})`;
            } else {
              const staggerDelay = 0.08 * Math.abs(idx - 0); // Stagger from barstool position
              card.style.transition = `opacity 0.6s ease ${staggerDelay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`;
              card.style.opacity = '1';
              const isHighlighted = (idx === activeProductIndex);
              card.style.transform = `scale(${isHighlighted ? 1.03 : 0.92})`;
            }
          });

          // Fade in nav buttons
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

          // ── Phase 3: Clean up all inline styles after transitions finish ──
          setTimeout(() => {
            isProductsAnimActive = false;

            // Clear all inline overrides to restore native CSS hover/transitions
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

            // Ensure the carousel is properly centered on the active card
            centerActiveProduct(true);
          }, 1200); // Wait for the longest transition to finish

        }, 1200); // Delay before Phase 2 starts

      }, 200); // Delay before Phase 1 starts
    });
  }

  // Hook sync events and initialize
  window.addEventListener('activecardchange', syncFeaturedBarstoolCard);
  window.addEventListener('shopifyloaded', syncFeaturedBarstoolCard);

  initFeaturedProductsCarousel();
  initFeaturedEntranceAnimation();
}
)();
