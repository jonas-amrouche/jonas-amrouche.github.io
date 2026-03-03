import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BLOOM } from '../constants.js';
import { distortionShader } from '../shaders/distortion.glsl.js';

export function createRenderer(canvas) {
  return new THREE.WebGLRenderer({ canvas });
}

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  composer.addPass(new RenderPass(scene, camera));

  const fxaaPass = new FXAAPass();
  composer.addPass(fxaaPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM.STRENGTH, BLOOM.RADIUS, BLOOM.THRESHOLD
  );
  composer.addPass(bloomPass);

  const distortionMaterial = new THREE.ShaderMaterial(distortionShader);
  const shaderPass = new ShaderPass(distortionMaterial);
  composer.addPass(shaderPass);

  composer.addPass(new OutputPass());

  return { composer, fxaaPass, distortionMaterial };
}

export function resizeAll(renderer, composer, fxaaPass, distortionMaterial, camera) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio;

  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  fxaaPass.uniforms['resolution'].value.set(1 / (w * dpr), 1 / (h * dpr));
  distortionMaterial.uniforms.resolution = { value: new THREE.Vector2(w, h) };
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, h / w * 8.0 - 4.0);
}