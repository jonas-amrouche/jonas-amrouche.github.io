import './style.css';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { SCENE } from './constants.js';
import { PROJECT_IDS } from './scenes.js';
import { createRenderer, createComposer, resizeAll } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { AudioManager } from './audio/AudioManager.js';
import { createTunnel } from './scene/tunnel.js';
import { createProjectLights, setLightsIntensity } from './scene/projectLights.js';
import { createProjectScreens, clearAllHovers } from './scene/projectScreens.js';
import { ProjectNavigator } from './ui/scroll.js';
import { openProjectPanel, closeProjectPanel, openAbout, closeAbout } from './ui/transitions.js';
import { runIntro } from './ui/introSequence.js';

const skipIntro = import.meta.env.DEV && import.meta.env.VITE_SKIP_INTRO === 'true';
const IS_TOUCH  = window.matchMedia('(hover: none)').matches;

// ─── Core setup ───────────────────────────────────────────────────────────────

const renderer = createRenderer(document.querySelector('#bg'));
const scene    = new THREE.Scene();
const { camera, cameraSocket } = createCamera();
scene.add(cameraSocket);

const { composer, fxaaPass, cursorMaterial } = createComposer(renderer, scene, camera);

// ─── Audio ────────────────────────────────────────────────────────────────────

const audio = new AudioManager(camera);
audio.loadAll(skipIntro);

// ─── Loaders ──────────────────────────────────────────────────────────────────

const loadingManager = new THREE.LoadingManager();
const textureLoader  = new THREE.TextureLoader(loadingManager);
const loader         = new GLTFLoader(loadingManager);

const loadingEl = document.getElementById('loading-text');
const enterEl   = document.getElementById('enter-text');

loadingManager.onProgress = (_url, loaded, total) => {
  if (loadingEl) loadingEl.textContent = `LOADING ${Math.round((loaded / total) * 100)}%`;
};

loadingManager.onLoad = () => {
  if (skipIntro) return;
  if (loadingEl) {
    loadingEl.style.transition = 'opacity 0.4s';
    loadingEl.style.opacity    = '0';
    setTimeout(() => {
      loadingEl.style.visibility = 'hidden';
      if (IS_TOUCH) {
        introTriggered = true;
        _startExperience();
      } else {
        if (enterEl) enterEl.style.visibility = 'visible';
      }
    }, 400);
  } else {
    if (IS_TOUCH) { introTriggered = true; _startExperience(); }
    else if (enterEl) enterEl.style.visibility = 'visible';
  }
};

// ─── GLTF ─────────────────────────────────────────────────────────────────────

const gltf        = await loader.loadAsync('/animations.glb');
const loadingMesh = gltf.scene;
const mixer       = new THREE.AnimationMixer(loadingMesh);
scene.add(loadingMesh);

loadingMesh.children.forEach(child => { child.castShadow = true; });

const mask         = loadingMesh.getObjectByName('Mask');
const Windows      = loadingMesh.getObjectByName('Windows');
const props        = loadingMesh.getObjectByName('Props');
const projectPlane = loadingMesh.getObjectByName('ProjectPlane');
projectPlane.receiveShadow = true;
projectPlane.castShadow    = false;
props.children.forEach(child => {
  child.children.forEach(ch => { ch.castShadow = true; });
});

if (mask) mask.visible = false;
props.visible         = false;
Windows.visible       = false;
Windows.frustumCulled = false;

// ─── Textures & screens ───────────────────────────────────────────────────────

const alphaMap = loadTexture(textureLoader, '/hologram_alpha.jpg');
const hoverMap = loadTexture(textureLoader, '/hologram_hover.jpg');
createProjectScreens(loadingMesh, textureLoader, alphaMap, hoverMap);

// Hover group wrappers — group at world origin, mesh keeps its local position.
// Mixer writes mesh.position in local space (unchanged). GSAP animates group.position.
const _hoverGroups = {};
PROJECT_IDS.forEach(id => {
  const mesh = loadingMesh.getObjectByName(id);
  if (!mesh) return;
  const parent = mesh.parent;
  const group  = new THREE.Group();
  parent.remove(mesh);
  parent.add(group);
  group.add(mesh);
  _hoverGroups[id] = group;
});

// Halo PointLights — one per board.
// IMPORTANT: The light must be positioned AT the mesh's world position, not at group origin.
// We read mesh world position after the scene is fully set up, then place the light there.
// The light is added to the scene (not the group) so it doesn't move with the group Z animation.
// Instead we sync it manually in the hover animation.
const _haloLights = {};
PROJECT_IDS.forEach(id => {
  const halo = new THREE.PointLight(0x88aaff, 0, 18);
  scene.add(halo);
  _haloLights[id] = halo;
});

function loadTexture(ldr, path) {
  const tex = ldr.load(path);
  tex.minFilter       = THREE.LinearMipMapNearestFilter;
  tex.magFilter       = THREE.NearestFilter;
  tex.generateMipmaps = true;
  tex.anisotropy      = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// ─── Scene objects ────────────────────────────────────────────────────────────

const loadingAction = playClip('loading', false);
const tunnelMesh    = createTunnel();
scene.add(tunnelMesh);

const pointLight = new THREE.PointLight(0xffffff, 100, 10);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);

const { lights, videosPlayers } = createProjectLights(scene, textureLoader);

// ─── Navigator ────────────────────────────────────────────────────────────────
let navigator = null;

// ─── DOM elements ─────────────────────────────────────────────────────────────

const cursor = document.createElement('div');
cursor.id = 'custom-cursor';
if (!IS_TOUCH) {
  document.body.appendChild(cursor);
  let cursorVisible = false;
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    if (!cursorVisible) { cursor.style.opacity = '1'; cursorVisible = true; }
  });
}

document.body.appendChild(buildNav());
const dotNav     = buildDotNav();    document.body.appendChild(dotNav);
const scrollHint = buildScrollHint(); document.body.appendChild(scrollHint);
const arrivalCard = buildArrivalCard(); document.body.appendChild(arrivalCard);

// ─── State ────────────────────────────────────────────────────────────────────

let introDone           = false;
let introTriggered      = false;
let panelOpen           = false;
let aboutOpen           = false;
let currentProjectIndex = -1;
let _currentHovered     = null;

const mouseNDC  = new THREE.Vector2();
const mouseUV   = new THREE.Vector2(-1.0, -1.0);
const raycaster = new THREE.Raycaster();
const clock     = new THREE.Clock();
let _strengthTarget  = 0.0;
let _strengthCurrent = 0.0;

// ─── Events ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', onResize);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onWorldClick);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') onEscape(); });

document.getElementById('bg').addEventListener('click', onCanvasClick);

document.addEventListener('click', (e) => {
  if (e.target.closest('#pp-close'))    onEscape();
  if (e.target.closest('#about-close')) closeAboutPanel();
  if (e.target.id === 'about-overlay')  closeAboutPanel();
  if (e.target.closest('#arrival-card') && currentProjectIndex > 0) {
    openPanel(PROJECT_IDS[currentProjectIndex - 1]);
  }
});

if (skipIntro) initSkipIntroState();
onResize();

// ─── Render loop ──────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  mixer.update(clock.getDelta());
  tunnelMesh.material.uniforms.uTime = { value: clock.elapsedTime };
  _updateCursorShader();
  composer.render();
}
animate();

// ─── Hover animation ──────────────────────────────────────────────────────────

function updateHover() {
  raycaster.setFromCamera(mouseNDC, camera);
  const hits           = raycaster.intersectObjects(scene.children, true);
  const hitName        = hits[0]?.object.name;
  const hoveredProject = PROJECT_IDS.find(p => p === hitName);
  const effective      = hoveredProject && !panelOpen ? hoveredProject : null;

  if (effective !== _currentHovered) {
    if (_currentHovered) _setScreenHoverAnim(_currentHovered, false);
    if (effective)        _setScreenHoverAnim(effective, true);
    _currentHovered = effective;
    _strengthTarget = effective ? 1.0 : 0.18;
    cursor.classList.toggle('cursor--hover', !!effective);
  }
}

function _updateCursorShader() {
  if (!introDone || IS_TOUCH) return;
  _strengthCurrent += (_strengthTarget - _strengthCurrent) * 0.08;
  cursorMaterial.uniforms.strength.value = _strengthCurrent;
  cursorMaterial.uniforms.mouseUV.value.copy(mouseUV);
}

function _setScreenHoverAnim(id, hovered) {
  const group = _hoverGroups[id];
  if (!group) return;

  // Spatial float toward camera (group Z)
  gsap.to(group.position, {
    z: hovered ? 0.8 : 0,
    duration: hovered ? 0.4 : 0.6,
    ease: hovered ? 'power2.out' : 'power2.inOut',
    overwrite: 'auto',
  });

  // Halo: place light at mesh's current world position, then animate intensity
  const halo = _haloLights[id];
  if (!halo) return;

  if (hovered) {
    // Sync halo world position to the mesh's current world position
    const mesh = loadingMesh.getObjectByName(id);
    if (mesh) {
      const wp = new THREE.Vector3();
      mesh.getWorldPosition(wp);
      halo.position.copy(wp);
      // Shift slightly toward camera
      halo.position.z += 2.0;
    }
  }

  const tgt = { v: halo.intensity };
  gsap.to(tgt, {
    v: hovered ? 8 : 0,
    duration: hovered ? 0.5 : 0.8,
    ease: hovered ? 'power2.out' : 'power2.inOut',
    overwrite: 'auto',
    onUpdate: () => { halo.intensity = tgt.v; },
  });
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────

function buildNav() {
  const nav = document.createElement('nav');
  nav.id = 'site-nav';

  const soundBtn = document.createElement('button');
  soundBtn.id        = 'toggleSoundButton';
  soundBtn.className = 'nav-btn nav-btn--icon';
  soundBtn.setAttribute('aria-label', 'Toggle sound');
  soundBtn.innerHTML = `
    <img id="not-muted-icon" src="/sound_icon.svg" width="18" height="18" alt="Sound on">
    <img id="muted-icon" src="/mute_sound_icon.svg" width="18" height="18" alt="Sound off" style="display:none">`;
  soundBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    document.getElementById('not-muted-icon').style.display = muted ? 'none'  : 'block';
    document.getElementById('muted-icon').style.display     = muted ? 'block' : 'none';
  });

  const aboutBtn = document.createElement('button');
  aboutBtn.id        = 'bioButton';
  aboutBtn.className = 'nav-btn';
  aboutBtn.textContent = 'ABOUT';
  aboutBtn.addEventListener('click', toggleAboutPanel);

  nav.appendChild(soundBtn);
  nav.appendChild(aboutBtn);
  return nav;
}

// ─── Dot nav ──────────────────────────────────────────────────────────────────

function buildDotNav() {
  const nav = document.createElement('div');
  nav.id = 'dot-nav';
  nav.style.visibility = 'hidden';
  const allStops = ['Welcome', ...PROJECT_IDS];
  allStops.forEach((name, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot-btn';
    dot.setAttribute('aria-label', `Go to ${name}`);
    dot.dataset.index = i;
    dot.addEventListener('click', () => { if (navigator && !panelOpen) navigator.goTo(i); });
    nav.appendChild(dot);
  });
  return nav;
}

function updateDots(index) {
  document.querySelectorAll('.dot-btn').forEach((d, i) => {
    d.classList.toggle('dot-btn--active', i === index);
  });
}

// ─── Scroll hint ──────────────────────────────────────────────────────────────

function buildScrollHint() {
  const el = document.createElement('div');
  el.id = 'scroll-hint';
  el.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 7L5 4M5 10L9 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    SCROLL
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 7L9 4M9 10L5 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
  el.style.visibility = 'hidden';
  return el;
}

function showScrollHint() {
  if (IS_TOUCH) return;
  scrollHint.style.visibility = 'visible';
  scrollHint.classList.remove('hint-hide');
}

function hideScrollHint() {
  scrollHint.classList.add('hint-hide');
}

// ─── Arrival card ─────────────────────────────────────────────────────────────

// Data for the arrival card (short version — full data lives in scenes.js)
const ARRIVAL_DATA = {
  Firelive:      { title: 'Firelive',       hook: 'Live mixing software with loop buffers and custom controller support.' },
  Elumin:        { title: 'Elumin',         hook: 'Atmospheric exploration game — 4 years, custom Blender tooling, Steam page.' },
  ServerMeshing: { title: 'Server Meshing', hook: 'Distributed multiplayer architecture with proximity VOIP and server meshing.' },
  Metronim:      { title: 'Metronim',       hook: 'Multiplayer browser game — metro stations firing trains.' },
};

function buildArrivalCard() {
  const el = document.createElement('div');
  el.id = 'arrival-card';
  el.innerHTML = `
    <div id="ac-title"></div>
    <div id="ac-hook"></div>
    <div id="ac-cta">↑ tap to explore</div>`;
  return el;
}

function showArrivalCard(projectId) {
  const data = ARRIVAL_DATA[projectId];
  if (!data) { hideArrivalCard(); return; }
  document.getElementById('ac-title').textContent = data.title;
  document.getElementById('ac-hook').textContent  = data.hook;
  arrivalCard.classList.remove('card-hide');
  arrivalCard.classList.add('card-show');
}

function hideArrivalCard() {
  arrivalCard.classList.remove('card-show');
  arrivalCard.classList.add('card-hide');
}

// ─── Mouse ────────────────────────────────────────────────────────────────────

function onMouseMove(e) {
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  mouseNDC.set(e.clientX / w * 2 - 1, -(e.clientY / h * 2 - 1));
  mouseUV.set(e.clientX / w, 1.0 - e.clientY / h);
  if (introDone) updateHover();
}

// ─── Clicks ───────────────────────────────────────────────────────────────────

function onWorldClick() {
  if (!introTriggered && enterEl?.style.visibility === 'visible') {
    enterEl.style.visibility = 'hidden';
    const vignette = document.getElementById('screen-vignette');
    if (vignette) vignette.classList.add('hidden');
    introTriggered = true;
    _startExperience();
  }
}

function onCanvasClick() {
  if (!introDone) return;
  if (aboutOpen) { closeAboutPanel(); return; }
  if (panelOpen) { onEscape(); return; }
  raycaster.setFromCamera(mouseNDC, camera);
  const hits    = raycaster.intersectObjects(scene.children, true);
  const project = PROJECT_IDS.find(p => hits.some(h => h.object.name === p));
  if (project) openPanel(project);
}

function openPanel(name) {
  panelOpen = true;
  if (navigator) navigator.disabled = true;
  hideArrivalCard();
  openProjectPanel(name);
}

function onEscape() {
  if (panelOpen) {
    panelOpen = false;
    if (navigator) navigator.disabled = false;
    closeProjectPanel();
    clearAllHovers(loadingMesh);
    if (_currentHovered) { _setScreenHoverAnim(_currentHovered, false); _currentHovered = null; }
    if (currentProjectIndex > 0) showArrivalCard(PROJECT_IDS[currentProjectIndex - 1]);
  }
}

function toggleAboutPanel() { aboutOpen ? closeAboutPanel() : openAboutPanel(); }
function openAboutPanel()   { aboutOpen = true;  if (navigator) navigator.disabled = true;  openAbout(); }
function closeAboutPanel()  { aboutOpen = false; if (navigator) navigator.disabled = false; closeAbout(); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function playClip(clipName, oneShot) {
  const clip   = THREE.AnimationClip.findByName(gltf.animations, clipName);
  const action = mixer.clipAction(clip);
  action.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat);
  action.play();
  return action;
}

function onResize() {
  resizeAll(renderer, composer, fxaaPass, cursorMaterial, camera);
}

function onProjectArrival(index) {
  currentProjectIndex = index;
  updateDots(index);
  hideScrollHint();
  if (index > 0) showArrivalCard(PROJECT_IDS[index - 1]);
  else           hideArrivalCard();
}

function _startExperience() {
  runIntro({
    mixer, camera, cameraSocket,
    mask, Windows, tunnelMesh,
    props, lights, videosPlayers,
    audio, playClip, loadingAction,
    onProjectChange: () => {
      navigator = new ProjectNavigator({ cameraSocket, onProjectChange: onProjectArrival });
      dotNav.style.visibility = 'visible';
      showScrollHint();
      onProjectArrival(0);
    },
  }).then(() => {
    introDone = true;
    _strengthTarget = 0.18;
    if (enterEl) enterEl.style.visibility = 'hidden';
  });
}

function initSkipIntroState() {
  cameraSocket.position.set(0, 0, SCENE.CAMERA_END_Z);
  camera.fov = 50.0;
  camera.updateProjectionMatrix();
  loadingAction.stop();
  playClip('floating', false);
  if (mask) mask.visible = false;
  Windows.visible    = true;
  tunnelMesh.visible = false;
  props.visible      = true;
  setLightsIntensity(lights, 1.0);
  tunnelMesh.material.uniforms.uOpacity = { value: 0.0 };
  introDone = true;
  _strengthTarget = 0.18;
  navigator = new ProjectNavigator({ cameraSocket, onProjectChange: onProjectArrival });
  dotNav.style.visibility = 'visible';
  showScrollHint();
  onProjectArrival(0);
}