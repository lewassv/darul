/**
 * AURA 3D EXCLUSIVE SHOWCASE - THREE.JS CORE ENGINE
 */

// Global State
const state = {
  activeShape: 'diamond',
  activeTheme: 'gold',
  autoRotate: true,
  rotateSpeed: 1.5,
  particleCount: 2000,
  wireframe: false
};

// Theme Color Maps (Hex values for 3D lights and materials)
const themes = {
  gold: {
    primary: 0xf3b036,
    secondary: 0xff8a00,
    accent: 0xffe066,
    bgEmissive: 0x2b1a00,
    fog: 0x07090e
  },
  neon: {
    primary: 0x00f2fe,
    secondary: 0x4facfe,
    accent: 0x00ffffff,
    bgEmissive: 0x001f2e,
    fog: 0x050c18
  },
  purple: {
    primary: 0x9d4edd,
    secondary: 0x7b2cbf,
    accent: 0xe0aaff,
    bgEmissive: 0x1e0038,
    fog: 0x0a0512
  },
  emerald: {
    primary: 0x10b981,
    secondary: 0x059669,
    accent: 0x6ee7b7,
    bgEmissive: 0x002619,
    fog: 0x040e0b
  }
};

// Core Variables
let scene, camera, renderer, controls;
let mainMesh, particleSystem, lightGroup;
let pointLight1, pointLight2;
let clock = new THREE.Clock();
let frameCount = 0, lastTime = performance.now(), currentFps = 60;

// Initialize 3D Engine on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initEngine();
  setupLighting();
  create3DObject();
  createParticleSystem();
  setupEventListeners();
  animate();
});

// Setup Renderer, Camera & Scene
function initEngine() {
  const canvas = document.getElementById('webgl-canvas');

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(themes.gold.fog, 0.03);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.5, 7.5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.8;
  controls.enableZoom = true;
  controls.minDistance = 3;
  controls.maxDistance = 15;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = state.rotateSpeed;

  // Handle Resize
  window.addEventListener('resize', onWindowResize);
}

// Setup Dynamic Lights
function setupLighting() {
  lightGroup = new THREE.Group();
  scene.add(lightGroup);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  lightGroup.add(ambientLight);

  // Key Directional Light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  lightGroup.add(dirLight);

  // Dynamic Orbiting Point Lights
  pointLight1 = new THREE.PointLight(themes[state.activeTheme].primary, 3, 20);
  pointLight1.position.set(3, 2, 3);
  lightGroup.add(pointLight1);

  pointLight2 = new THREE.PointLight(themes[state.activeTheme].secondary, 2.5, 20);
  pointLight2.position.set(-3, -2, -3);
  lightGroup.add(pointLight2);
}

// Create Main 3D Mesh Material & Geometries
function getGeometry(shapeType) {
  switch (shapeType) {
    case 'diamond':
      return new THREE.OctahedronGeometry(2, 0);
    case 'torus':
      return new THREE.TorusKnotGeometry(1.3, 0.4, 128, 32);
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(2, 1);
    case 'crystal':
      return new THREE.DodecahedronGeometry(2, 0);
    default:
      return new THREE.OctahedronGeometry(2, 0);
  }
}

function create3DObject() {
  if (mainMesh) {
    scene.remove(mainMesh);
    mainMesh.geometry.dispose();
    mainMesh.material.dispose();
  }

  const geometry = getGeometry(state.activeShape);
  const themeColors = themes[state.activeTheme];

  // Exclusive Glass & Metallic Material
  const material = new THREE.MeshPhysicalMaterial({
    color: themeColors.primary,
    metalness: 0.25,
    roughness: 0.1,
    transmission: 0.6, // Glass transparency
    ior: 1.5, // Refraction index
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: themeColors.bgEmissive,
    emissiveIntensity: 0.3,
    wireframe: state.wireframe,
    flatShading: state.activeShape === 'diamond' || state.activeShape === 'crystal'
  });

  mainMesh = new THREE.Mesh(geometry, material);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  scene.add(mainMesh);

  updateHUD();
}

// Particle System (Nebula Effect)
function createParticleSystem() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(state.particleCount * 3);
  const colors = new Float32Array(state.particleCount * 3);

  const primaryColor = new THREE.Color(themes[state.activeTheme].primary);
  const accentColor = new THREE.Color(themes[state.activeTheme].accent);

  for (let i = 0; i < state.particleCount; i++) {
    // Distribute in a spherical cloud
    const radius = 6 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Mix particle colors
    const mixedColor = primaryColor.clone().lerp(accentColor, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

// Update Theme Colors Dynamically
function updateTheme(themeKey) {
  state.activeTheme = themeKey;
  const theme = themes[themeKey];

  // Update Fog & Point Lights
  scene.fog.color.setHex(theme.fog);
  pointLight1.color.setHex(theme.primary);
  pointLight2.color.setHex(theme.secondary);

  // Update Main Mesh Material
  if (mainMesh) {
    mainMesh.material.color.setHex(theme.primary);
    mainMesh.material.emissive.setHex(theme.bgEmissive);
  }

  // Update Particle Colors
  if (particleSystem) {
    const colors = particleSystem.geometry.attributes.color.array;
    const c1 = new THREE.Color(theme.primary);
    const c2 = new THREE.Color(theme.accent);

    for (let i = 0; i < state.particleCount; i++) {
      const mixedColor = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    particleSystem.geometry.attributes.color.needsUpdate = true;
  }
}

// UI & Controls Handlers
function setupEventListeners() {
  // Shape Selector Buttons
  const shapeBtns = document.querySelectorAll('[data-shape]');
  shapeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.activeShape = e.target.getAttribute('data-shape');
      create3DObject();
    });
  });

  // Color Theme Picker Dots
  const colorDots = document.querySelectorAll('[data-theme]');
  colorDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      colorDots.forEach(d => d.classList.remove('active'));
      e.target.classList.add('active');
      const selectedTheme = e.target.getAttribute('data-theme');
      updateTheme(selectedTheme);
    });
  });

  // Auto-Rotate Switch Toggle
  const rotateToggle = document.getElementById('rotate-toggle');
  if (rotateToggle) {
    rotateToggle.addEventListener('change', (e) => {
      state.autoRotate = e.target.checked;
      controls.autoRotate = state.autoRotate;
    });
  }

  // Wireframe Toggle
  const wireframeToggle = document.getElementById('wireframe-toggle');
  if (wireframeToggle) {
    wireframeToggle.addEventListener('change', (e) => {
      state.wireframe = e.target.checked;
      if (mainMesh) {
        mainMesh.material.wireframe = state.wireframe;
      }
    });
  }

  // Mouse Parallax Effect on Hero Text & Mesh
  document.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    if (mainMesh) {
      mainMesh.rotation.z = mouseX * 0.15;
    }
  });
}

// Window Resize Handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update HUD Real-time Metrics
function updateHUD() {
  const fpsVal = document.getElementById('hud-fps');
  const polyVal = document.getElementById('hud-poly');
  const camVal = document.getElementById('hud-cam');

  if (polyVal && mainMesh) {
    const vertCount = mainMesh.geometry.attributes.position.count;
    polyVal.innerText = vertCount.toLocaleString();
  }

  if (fpsVal) {
    fpsVal.innerText = currentFps;
  }

  if (camVal && camera) {
    const x = camera.position.x.toFixed(1);
    const y = camera.position.y.toFixed(1);
    const z = camera.position.z.toFixed(1);
    camVal.innerText = `${x}, ${y}, ${z}`;
  }
}

// Animation Frame Loop
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Rotate Point Lights around the 3D object
  if (pointLight1 && pointLight2) {
    pointLight1.position.x = Math.sin(elapsedTime * 0.8) * 4;
    pointLight1.position.z = Math.cos(elapsedTime * 0.8) * 4;

    pointLight2.position.x = Math.sin(elapsedTime * -0.6) * 5;
    pointLight2.position.y = Math.cos(elapsedTime * 0.6) * 3;
    pointLight2.position.z = Math.cos(elapsedTime * -0.6) * 5;
  }

  // Floating Mesh Bobbing Animation
  if (mainMesh) {
    mainMesh.position.y = Math.sin(elapsedTime * 1.5) * 0.15;
  }

  // Slowly Rotate Particle Cloud
  if (particleSystem) {
    particleSystem.rotation.y = elapsedTime * 0.03;
  }

  // Update Controls & FPS Calculation
  controls.update();
  renderer.render(scene, camera);

  // Measure FPS
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (now - lastTime));
    frameCount = 0;
    lastTime = now;
    updateHUD();
  }
}
