import * as THREE from 'three';
import { PROJECTOR_CONFIGS, DUMMY_PROJECTOR_CONFIGS, FLASHREEL_CONFIG, SCENE_STOPS } from '../scenes.js';

export function createProjectLights(scene, textureLoader) {
  const videosPlayers = [];
  const lights        = [];

  // Central flashreel at Welcome
  const flashTex   = _createVideoTexture(FLASHREEL_CONFIG.path, videosPlayers);
  const flashLight = _makeSpot(flashTex, FLASHREEL_CONFIG.x, FLASHREEL_CONFIG.zPos, FLASHREEL_CONFIG.xTarget, FLASHREEL_CONFIG.intensity);
  scene.add(flashLight);
  scene.add(flashLight.target);
  lights.push({ light: flashLight, maxIntensity: FLASHREEL_CONFIG.intensity });

  // Real project lights (SCENE_STOPS[2..N-2])
  PROJECTOR_CONFIGS.forEach((projList, projectIdx) => {
    const stopX = SCENE_STOPS[projectIdx + 2].x; // +2 skips DummyRight + Welcome
    projList.forEach(cfg => {
      const spot = _makeSpot(
        textureLoader.load(cfg.blurredMap),
        stopX + cfg.xOffset,
        cfg.zPos,
        stopX + cfg.xTarget,
        cfg.intensity,
      );
      scene.add(spot);
      scene.add(spot.target);
      lights.push({ light: spot, maxIntensity: cfg.intensity });
    });
  });

  // Dummy stop lights (DummyRight at index 0, DummyLeft at last index)
  DUMMY_PROJECTOR_CONFIGS.forEach(({ stopPhysIndex, lights: cfgList }) => {
    const stopX = SCENE_STOPS[stopPhysIndex].x;
    cfgList.forEach(cfg => {
      const spot = _makeSpot(
        textureLoader.load(cfg.blurredMap),
        stopX + cfg.xOffset,
        cfg.zPos,
        stopX + cfg.xTarget,
        cfg.intensity,
      );
      scene.add(spot);
      scene.add(spot.target);
      lights.push({ light: spot, maxIntensity: cfg.intensity });
    });
  });

  return { lights, videosPlayers };
}

function _makeSpot(texture, x, zPos, xTarget, intensity) {
  const light = new THREE.SpotLight(0xffffff, 0, 200, Math.PI / 4, 1.0);
  light.map = texture;
  light.position.set(x, 0, zPos);
  light.target.position.set(xTarget, 0, zPos - 10);
  light.castShadow = true;
  light.shadow.mapSize.width  = 512;
  light.shadow.mapSize.height = 512;
  light.shadow.camera.near    = 0.1;
  light.shadow.camera.far     = 20;
  light.shadow.camera.fov     = 30;
  return light;
}

function _createVideoTexture(path, videosPlayers) {
  const video       = document.createElement('video');
  video.src         = path;
  video.loop        = true;
  videosPlayers.push(video);
  const tex         = new THREE.VideoTexture(video);
  tex.format        = THREE.RGBFormat;
  tex.minFilter     = THREE.NearestFilter;
  tex.magFilter     = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function setLightsIntensity(lights, factor) {
  lights.forEach(({ light, maxIntensity }) => {
    light.intensity = maxIntensity * factor;
  });
}