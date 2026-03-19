import * as THREE from 'three';
import { PROJECTS, WORLD_STOPS } from '../scenes.js';

export function createProjectScreens(loadingMesh, textureLoader, alphaMap, hoverMap) {
  const allIds = WORLD_STOPS.map(s => s.id).filter(id => PROJECTS[id]?.screenMap);

  allIds.forEach(id => {
    const mesh = loadingMesh.getObjectByName(id);
    if (!mesh) { console.warn(`projectScreens: mesh "${id}" not found`); return; }

    mesh.material = new THREE.MeshStandardMaterial({
      map:               textureLoader.load(PROJECTS[id].screenMap),
      emissive:          new THREE.Color(0xffffff),
      emissiveMap:       hoverMap,
      emissiveIntensity: 0.0,
      alphaMap,
      transparent:       true,
      alphaTest:         0.99,
    });
  });
}

export function setScreenHover() {}
export function clearAllHovers() {}