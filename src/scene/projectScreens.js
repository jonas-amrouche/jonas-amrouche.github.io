import * as THREE from 'three';
import { PROJECTS_DATA } from '../scenes.js';

/**
 * Assigns screen textures to board meshes from scenes.js config.
 * Mesh names in the GLTF must match PROJECTS_DATA[i].id exactly.
 */
export function createProjectScreens(loadingMesh, textureLoader, alphaMap, hoverMap) {
  PROJECTS_DATA.forEach(({ id, screenMap }) => {
    const mesh = loadingMesh.getObjectByName(id);
    if (!mesh) {
      console.warn(`projectScreens: mesh "${id}" not found in GLTF`);
      return;
    }
    mesh.material = new THREE.MeshStandardMaterial({
      map:              textureLoader.load(screenMap),
      emissive:         0xffffff,
      emissiveMap:      hoverMap,
      emissiveIntensity: 0.0,
      alphaMap,
      transparent:      true,
      alphaTest:        0.99,
    });
  });
}

export function setScreenHover(loadingMesh, id, hovered) {
  // Hover now handled by _setScreenHoverAnim in main.js via GSAP
}

export function clearAllHovers(loadingMesh) {
  // No-op — GSAP animations in main.js handle un-hover
}