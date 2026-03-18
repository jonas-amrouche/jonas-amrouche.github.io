import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAPass }        from 'three/addons/postprocessing/FXAAPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { BLOOM }           from '../constants.js';
import { cursorDistortionShader } from '../shaders/distortion_cursor.glsl.js';

export function createRenderer(canvas) {
  return new THREE.WebGLRenderer({ antialias: true, canvas });
}

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const fxaaPass = new FXAAPass();
  composer.addPass(fxaaPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM.STRENGTH, BLOOM.RADIUS, BLOOM.THRESHOLD,
  );
  composer.addPass(bloomPass);

  // ShaderPass takes the raw shader definition object — NOT a ShaderMaterial.
  // It creates its own ShaderMaterial internally, exposed as cursorPass.material.
  const cursorPass = new ShaderPass(cursorDistortionShader);
  composer.addPass(cursorPass);

  composer.addPass(new OutputPass());

  // Return the pass's internal material so main.js can update uniforms each frame.
  return { composer, fxaaPass, cursorMaterial: cursorPass.material };
}

export function resizeAll(renderer, composer, fxaaPass, cursorMaterial, camera) {
  const w   = window.innerWidth;
  const h   = window.innerHeight;
  const dpr = window.devicePixelRatio;

  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  fxaaPass.uniforms['resolution'].value.set(1 / (w * dpr), 1 / (h * dpr));
  cursorMaterial.uniforms.resolution.value.set(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, h / w * 8.0 - 4.0);
}