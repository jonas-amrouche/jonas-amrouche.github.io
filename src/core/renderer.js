import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAPass }        from 'three/addons/postprocessing/FXAAPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { BLOOM }           from '../constants.js';

const IS_TOUCH = window.matchMedia('(hover: none)').matches;

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    antialias: !IS_TOUCH, // native AA on desktop, off on mobile (FXAA handles it)
    canvas,
  });

  // Enable shadow maps — PCFSoft gives smooth penumbra matching projector look
  renderer.shadowMap.enabled = false;

  return renderer;
}

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  if (IS_TOUCH) {
    // Mobile: bare minimum — just render + output. No bloom, no FXAA, no cursor shader.
    composer.addPass(new OutputPass());
    // Return a stub cursorMaterial so main.js doesn't crash on uniform updates
    const stub = { uniforms: { strength: { value: 0 }, mouseUV: { value: new THREE.Vector2() }, resolution: { value: new THREE.Vector2() } } };
    return { composer, fxaaPass: null, cursorMaterial: stub };
  }

  // Desktop: FXAA + Bloom + Output (cursor distortion removed — not worth the pass cost)
  const fxaaPass = new FXAAPass();
  composer.addPass(fxaaPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM.STRENGTH, BLOOM.RADIUS, BLOOM.THRESHOLD,
  );
  composer.addPass(bloomPass);

  composer.addPass(new OutputPass());

  // Stub cursorMaterial (distortion shader removed)
  const cursorMaterial = {
    uniforms: {
      strength:   { value: 0 },
      mouseUV:    { value: new THREE.Vector2() },
      resolution: { value: new THREE.Vector2() },
    },
  };

  return { composer, fxaaPass, cursorMaterial };
}

export function resizeAll(renderer, composer, fxaaPass, cursorMaterial, camera) {
  const w   = window.innerWidth;
  const h   = window.innerHeight;
  // Cap DPR at 2 — retina beyond 2x adds GPU load with no visible benefit
  const dpr = Math.min(window.devicePixelRatio, IS_TOUCH ? 1.5 : 2);

  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);

  if (fxaaPass) {
    fxaaPass.uniforms['resolution'].value.set(1 / (w * dpr), 1 / (h * dpr));
  }

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, h / w * 8.0 - 4.0);
}