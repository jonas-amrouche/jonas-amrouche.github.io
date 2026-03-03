import * as THREE from 'three';

export function createProjectScreens(loadingMesh, textureLoader, alphaMap, hoverMap) {
  const configs = [
    { name: 'Firelive', map: '/firelive_screen_emi.jpg' },
    { name: 'Elumin', map: '/elumin_screenshot2.jpg' },
    { name: 'ServerMeshing', map: '/server_meshing_screenshot_1.png' },
    { name: 'Metronim', map: '/metronim_screenshot1.jpg' },
  ];

  configs.forEach(({ name, map }) => {
    const mesh = loadingMesh.getObjectByName(name);
    mesh.material = new THREE.MeshStandardMaterial({
      map: textureLoader.load(map),
      emissive: 0xffffff,
      emissiveMap: hoverMap,
      emissiveIntensity: 0.0,
      alphaMap,
      transparent: true,
      alphaTest: true,
    });
  });
}

export function setScreenHover(loadingMesh, name, hovered) {
  const mesh = loadingMesh.getObjectByName(name);
  if (mesh) mesh.material.emissiveIntensity = hovered ? 1.0 : 0.0;
}

export function clearAllHovers(loadingMesh, projects) {
  projects.forEach(name => setScreenHover(loadingMesh, name, false));
}