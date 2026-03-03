import { gsap } from 'gsap/gsap-core';
import { BLACK_HOLE, SCENE } from '../constants.js';

// ─── Black-hole project open/close ───────────────────────────────────────────

export function openProject({
  projectName, distortionMaterial, cameraSocket,
  projectStar, audio, scrollManager, scrollBox, backButton,
  onStart, onComplete,
}) {
  const container = document.getElementById(projectName);
  _runBlackHoleTransition({
    val: 1.0, container, distortionMaterial, cameraSocket,
    projectStar, backButton, scrollManager, scrollBox,
    audio, onStart, onComplete,
  });
}

export function closeProject({
  projectName, distortionMaterial, cameraSocket,
  projectStar, audio, scrollManager, scrollBox, backButton, scrollTarget,
  onComplete,
}) {
  const container = document.getElementById(projectName);
  _runBlackHoleTransition({
    val: 0.0, container, distortionMaterial, cameraSocket,
    projectStar, backButton, scrollManager, scrollBox, scrollTarget,
    audio, onComplete,
  });
}

function _runBlackHoleTransition({
  val, container, distortionMaterial, cameraSocket,
  projectStar, backButton, scrollManager, scrollBox, scrollTarget,
  audio, onStart, onComplete,
}) {
  const opening = val === 1.0;
  const fromVal = opening ? 0.0 : 1.0;

  // Distortion sweep
  let obj = { value: fromVal };
  gsap.to(obj, {
    delay: opening ? 0.0 : 1.0,
    value: val,
    duration: 1.0,
    ease: 'power2.inOut',
    onStart:  () => {
      audio.play(opening ? 'blackHole' : 'reverseBlackHole');
      onStart?.();
    },
    onUpdate: () => {
      distortionMaterial.uniforms.sphereRadius.value    = obj.value * BLACK_HOLE.SPHERE_RADIUS;
      distortionMaterial.uniforms.gravityStrength.value = obj.value * BLACK_HOLE.GRAVITY_STRENGTH;
    },
    onComplete: () => {
      if (opening) {
        cameraSocket.position.set(0, SCENE.PROJECT_VIEW_Y, SCENE.PROJECT_VIEW_Z);
        container.style.visibility = 'visible';
        backButton.style.visibility = 'visible';
      } else {
        container.style.visibility = 'hidden';
        backButton.style.visibility = 'hidden';
      }
      distortionMaterial.uniforms.sphereRadius.value    = 0.0;
      distortionMaterial.uniforms.gravityStrength.value = 0.0;
    },
  });

  // Event horizon radius
  gsap.to(distortionMaterial.uniforms.eventHorizonRadius, {
    value: val * BLACK_HOLE.EVENT_HORIZON_RADIUS,
    delay: opening ? 0.3 : 1.0,
    duration: 0.7,
    ease: 'power2.inOut',
  });

  // Star fade + UI opacity
  let starObj = { value: fromVal };
  gsap.to(starObj, {
    value: val,
    delay: opening ? 1.0 : 0.0,
    duration: 0.7,
    ease: 'power2.inOut',
    onUpdate: () => {
      projectStar.material.emissiveIntensity = starObj.value;
      container.style.opacity = `${starObj.value * 100}%`;
      backButton.style.opacity = `${starObj.value * 40}%`;
    },
    onComplete: () => {
      if (!opening) {
        distortionMaterial.uniforms.sphereRadius.value    = BLACK_HOLE.SPHERE_RADIUS;
        distortionMaterial.uniforms.gravityStrength.value = BLACK_HOLE.GRAVITY_STRENGTH;
        cameraSocket.position.set(scrollTarget, 0, SCENE.CAMERA_END_Z);
        scrollManager.disabled = false;
        scrollBox.style.overflow = 'scroll';
      }
      onComplete?.();
    },
  });
}

// ─── 2D overlay tabs ──────────────────────────────────────────────────────────

let _activeTween = null;

export function open2DTab(tabName, onDone) {
  _animateTab(tabName, 100.0, onDone);
}

export function close2DTab(tabName, onDone) {
  _animateTab(tabName, 0.0, onDone);
}

function _animateTab(tabName, targetVal, onDone) {
  const tab = document.getElementById(tabName);
  const backContainer = document.getElementById('tab2DBackContainer');
  const fromVal = targetVal === 100.0 ? 0.0 : 100.0;

  if (_activeTween?.isActive()) {
    _activeTween.eventCallback('onComplete', () => _animateTab(tabName, targetVal, onDone));
    return;
  }

  if (targetVal === 100.0) _setTabVisibility(tab, backContainer, 'visible', 0.0);

  let obj = { value: fromVal };
  _activeTween = gsap.to(obj, {
    value: targetVal,
    duration: 0.3,
    ease: 'power2.inOut',
    onUpdate: () => {
      tab.style.opacity = `${obj.value}%`;
      backContainer.style.opacity = `${obj.value * 0.95}%`;
    },
    onComplete: () => {
      if (targetVal === 0.0) _setTabVisibility(tab, backContainer, 'hidden', 0.0);
      onDone?.();
    },
  });
}

function _setTabVisibility(tab, back, visibility, opacity) {
  tab.style.visibility = visibility;
  back.style.visibility = visibility;
  tab.style.opacity = `${opacity * 0.9}%`;
  back.style.opacity = `${opacity * 0.9}%`;
}