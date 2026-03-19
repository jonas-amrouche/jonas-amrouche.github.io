import * as THREE from 'three';
import { PROJECTORS, FLASHREEL, WORLD_STOPS, WORLD_MAP } from '../scenes.js';

export function createProjectLights(scene, textureLoader) {
  const videosPlayers = [];
  const lights        = [];

  // Flashreel video light at Welcome
  const flashTex = _makeVideoTexture(FLASHREEL.videoPath, videosPlayers);
  const flash    = _makeSpot(flashTex, FLASHREEL.x, FLASHREEL.zPos, FLASHREEL.xTarget, FLASHREEL.intensity);
  scene.add(flash, flash.target);
  lights.push({ light: flash, maxIntensity: FLASHREEL.intensity });

  // One spotlight per stop that has a PROJECTORS entry
  WORLD_STOPS.forEach(stop => {
    const cfgs = PROJECTORS[stop.id];
    if (!cfgs) return;
    cfgs.forEach(cfg => {
      const spot = _makeSpot(
        textureLoader.load(cfg.blurredMap),
        stop.x + cfg.xOffset,
        cfg.zPos,
        stop.x + cfg.xTarget,
        cfg.intensity,
      );
      scene.add(spot, spot.target);
      lights.push({ light: spot, maxIntensity: cfg.intensity });
    });
  });

  return { lights, videosPlayers };
}

export function setLightsIntensity(lights, factor) {
  lights.forEach(({ light, maxIntensity }) => { light.intensity = maxIntensity * factor; });
}

function _makeSpot(texture, x, zPos, xTarget, intensity) {
  const light = new THREE.SpotLight(0xffffff, 0, 200, Math.PI / 4, 1.0);
  light.map = texture;
  light.position.set(x, 0, zPos);
  light.target.position.set(xTarget, 0, zPos - 10);
  light.castShadow = false; // projectors don't cast shadows — saves 6 shadow map samplers
  return light;
}

function _makeVideoTexture(path, videosPlayers) {
  const video         = document.createElement('video');
  video.src           = path;
  video.loop          = true;
  videosPlayers.push(video);
  const tex           = new THREE.VideoTexture(video);
  tex.format          = THREE.RGBFormat;
  tex.minFilter       = THREE.NearestFilter;
  tex.magFilter       = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}