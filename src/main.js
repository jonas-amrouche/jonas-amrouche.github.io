import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { PROJECTS, SCENE } from './constants.js';
import { createRenderer, createComposer, resizeAll } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { AudioManager } from './audio/AudioManager.js';
import { createTunnel } from './scene/tunnel.js';
import { createProjectLights, setLightsIntensity } from './scene/projectLights.js';
import { createProjectScreens, clearAllHovers, setScreenHover } from './scene/projectScreens.js';
import { ScrollManager } from './ui/scroll.js';
import { openProject, closeProject, open2DTab, close2DTab } from './ui/transitions.js';
import { runIntro } from './ui/introSequence.js';

// Dev flag
const skipIntro = import.meta.env.DEV && import.meta.env.VITE_SKIP_INTRO === 'true';

// Core setup
const renderer = createRenderer(document.querySelector('#bg'));
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const { camera, cameraSocket } = createCamera();
scene.add(cameraSocket);

const { composer, fxaaPass, distortionMaterial } = createComposer(renderer, scene, camera);
const scrollManager = new ScrollManager();

// Audio
const audio = new AudioManager(camera);
audio.loadAll(skipIntro);

// Loaders
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const loader = new GLTFLoader(loadingManager);

loadingManager.onLoad = () => {
  if (!skipIntro) document.getElementById('enter-text').style.visibility = 'visible';
};

// Load GLTF scene
const gltf = await loader.loadAsync('/animations.glb');
const loadingMesh = gltf.scene;
const mixer = new THREE.AnimationMixer(loadingMesh);
scene.add(loadingMesh);

loadingMesh.children.forEach(child => {child.castShadow = true;});

const mask = loadingMesh.getObjectByName('Mask');
const Windows = loadingMesh.getObjectByName('Windows');
const props = loadingMesh.getObjectByName('Props');
const projectStar = loadingMesh.getObjectByName('ProjectStar');
const projectPlane = loadingMesh.getObjectByName('ProjectPlane');
projectPlane.receiveShadow = true;
projectPlane.castShadow = false;
props.children.forEach(child => {child.children.forEach(ch => {ch.castShadow = true;});});

projectStar.material.emissiveIntensity = 0.0;
props.visible = false;
Windows.visible = false;
Windows.frustumCulled = false;

// Textures
const alphaMap = loadTexture(textureLoader, '/hologram_alpha.jpg');
const hoverMap = loadTexture(textureLoader, '/hologram_hover.jpg');

createProjectScreens(loadingMesh, textureLoader, alphaMap, hoverMap);

function loadTexture(loader, path) {
  const tex = loader.load(path);
  tex.minFilter = THREE.LinearMipMapNearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Scene objects
const loading_anim = playClip('loading', false);
const tunnelMesh   = createTunnel();
scene.add(tunnelMesh);

const torus = createTorus();
scene.add(torus);

const pointLight = new THREE.PointLight(0xffffff, 100, 10);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);

const { lights, videosPlayers } = createProjectLights(scene, textureLoader);

// State
let introDone = false;
let screenTouched = false;
let introTriggered = false;
let inProjectTransition = false;
let projectShown = '';
let tabShown = '';
let targetStarRotation = new THREE.Vector3();
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

// DOM refs
const scrollBox = document.getElementById('scroll-box');
const backButton = document.getElementById('backButton');
const tab2DBackContainer = document.getElementById('tab2DBackContainer');
const projectContainers = document.getElementsByClassName('project-container');

// Event listeners
window.addEventListener('resize', onResize);
document.getElementById('toggleSoundButton').addEventListener('click', onSoundToggle);
document.getElementById('behindTheScenesButton').addEventListener('click', () => toggleTab('BehindTheScenes'));
document.getElementById('bioButton').addEventListener('click', () => toggleTab('Bio'));
document.getElementById('metronimMoreButton').addEventListener('click', () => openTab('MetronimMore'));
document.getElementById('fireliveMoreButton').addEventListener('click', () => openTab('FireliveMore'));
document.getElementById('serverMeshingMoreButton').addEventListener('click', () => openTab('ServerMeshingMore'));
document.getElementById('eluminMoreButton').addEventListener('click', () => openTab('EluminMore'));

backButton.addEventListener('click', onBackClick);
backButton.addEventListener('mouseover', () => { backButton.style.opacity = '90%'; });
backButton.addEventListener('mouseout', () => { backButton.style.opacity = '20%'; });

scrollBox.addEventListener('mousemove', onMouseMove);
scrollBox.addEventListener('click', onBackgroundClick);
scrollBox.addEventListener('scroll', () => scrollManager.onScroll(scrollBox));
scrollBox.addEventListener('touchstart', (e) => scrollManager.onTouchStart(e), false);
scrollBox.addEventListener('touchmove', (e) => scrollManager.onTouchMove(e),  false);

tab2DBackContainer.addEventListener('click', () => closeTab(tabShown));

for (const c of projectContainers) {
  c.addEventListener('mousemove', onMouseMove);
}

// Dev skip
if (skipIntro) {
  initSkipIntroState();
}

onResize();

// Render loop
function animate() {
  requestAnimationFrame(animate);
  mixer.update(clock.getDelta());
  tunnelMesh.material.uniforms.uTime = { value: clock.elapsedTime };
  scrollManager.update(cameraSocket, introDone);
  checkIntroTrigger();
  updateStarRotation();
  composer.render();
}
animate();

// Helpers

function playClip(clipName, oneShot) {
  const clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
  const action = mixer.clipAction(clip);
  action.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat);
  action.play();
  return action;
}

function createTorus() {
  const geo = new THREE.RingGeometry(2, 3, 4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: new THREE.Color('rgb(255,255,255)'), emissiveIntensity: 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -2);
  return mesh;
}

function onResize() {
  resizeAll(renderer, composer, fxaaPass, distortionMaterial, camera);
}

function onMouseMove(event) {
  mouseCoords.set(
    event.clientX / renderer.domElement.clientWidth  *  2 - 1,
   -(event.clientY / renderer.domElement.clientHeight * 2 - 1)
  );
  targetStarRotation.set(-mouseCoords.y * 0.1, mouseCoords.x * 0.1, 0);
  updateHover();
}

function updateHover() {
  raycaster.setFromCamera(mouseCoords, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hitName = hits[0]?.object.name;
  const hoveredProject = PROJECTS.find(p => p === hitName);

  clearAllHovers(loadingMesh, PROJECTS);
  document.body.style.cursor = 'default';

  if (hoveredProject && !inProjectTransition) {
    setScreenHover(loadingMesh, hoveredProject, true);
    document.body.style.cursor = 'pointer';
  }
}

function updateStarRotation() {
  if (!projectStar) return;
  const { x, y } = projectStar.rotation;
  const t = targetStarRotation;
  projectStar.rotation.set(
    THREE.MathUtils.lerp(x, t.x, 0.1),
    THREE.MathUtils.lerp(y, t.y, 0.1),
    0
  );
}

function onBackgroundClick() {
  const hits = raycaster.intersectObjects(scene.children, true);
  if (hits.length > 0) onRaycastClick(hits[0].object.name);

  if (skipIntro) {
    videosPlayers.forEach(v => v.play());
    return;
  }

  screenTouched = true;
  document.getElementById('enter-text').style.visibility = 'hidden';
  audio.play('ambient');
}

function onRaycastClick(name) {
  const project = PROJECTS.find(p => p === name);
  if (project) toggleProject(project);
}

function toggleProject(name) {
  if (inProjectTransition) return;
  inProjectTransition = true;

  if (projectShown === '') {
    scrollManager.disabled = true;
    scrollBox.style.overflow = 'hidden';
    projectShown = name;
    openProject({
      projectName: name, distortionMaterial, cameraSocket,
      projectStar, audio, scrollManager, scrollBox, backButton,
      onComplete: () => { inProjectTransition = false; },
    });
  } else {
    const closing = projectShown;
    projectShown  = '';
    updateHover();
    closeProject({
      projectName: closing, distortionMaterial, cameraSocket,
      projectStar, audio, scrollManager, scrollBox, backButton,
      scrollTarget: scrollManager.scrollTarget,
      onComplete: () => { inProjectTransition = false; },
    });
  }
}

function onBackClick() {
  if (projectShown !== '') toggleProject('');
}

function openTab(name) {
  closeTab(tabShown);
  tabShown = name;
  open2DTab(name);
  document.getElementById('bg').style.pointerEvents = 'none';
}

function closeTab(name) {
  if (!name) return;
  close2DTab(name);
  tabShown = '';
  document.getElementById('bg').style.pointerEvents = 'all';
}

function toggleTab(name) {
  tabShown === name ? closeTab(name) : openTab(name);
}

function onSoundToggle() {
  const muted = audio.toggleMute();
  document.getElementById('not-muted-icon').style.visibility = muted ? 'hidden' : 'visible';
  document.getElementById('muted-icon').style.visibility     = muted ? 'visible' : 'hidden';
}

function checkIntroTrigger() {
  if (loading_anim.time < 0.1 && screenTouched && !introTriggered) {
    screenTouched  = false;
    introTriggered = true;
    runIntro({
      mixer, camera, cameraSocket, torus, mask, Windows, tunnelMesh,
      projectStar, props, lights: lights, videosPlayers, audio,
      playClip, scrollManager, scrollBox,
    }).then(() => { introDone = true; });
  }
}

function initSkipIntroState() {
  cameraSocket.position.set(0, 0, SCENE.CAMERA_END_Z);
  camera.fov = 50.0;
  camera.updateProjectionMatrix();
  playClip('floating', false);
  torus.visible = false;
  mask.visible = false;
  Windows.visible = true;
  tunnelMesh.visible = false;
  props.visible = true;
  audio.setVolume('ambient', 2.0);
  audio.play('ambient');
  setLightsIntensity(lights, 1.0);
  document.querySelectorAll('.project-ui').forEach(el => { el.style.opacity = '100%'; });
  tunnelMesh.material.uniforms.uOpacity = { value: 1.0 };
  introDone = true;
  scrollBox.style.overflow = 'scroll';
  scrollManager.center(scrollBox);
}