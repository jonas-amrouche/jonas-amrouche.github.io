import * as THREE from 'three';

const LIGHT_CONFIGS = [
  { path: '/flashreel.webm', x: 0, xTarget: 0, intensity: 100 },
  { path: '/firelive_screen1_blured.jpg', x: -20, xTarget: 0, intensity: 200 },
  { path: '/elumin_screen_blurred_1.png', x: 20,  xTarget: 0, intensity: 200 },
  { path: '/firelive_screen1_blured.jpg', x: -20, xTarget: -20.3, intensity: 500 },
  { path: '/elumin_screen_blurred_2.png', x: 20,  xTarget: 20.3, intensity: 200 },
  { path: '/metronim_screenshot4_blurred.jpg', x: 40,  xTarget: 40.3, intensity: 200 },
  { path: '/server_meshing_screenshot_2_blurred.png', x: -40, xTarget: -40.3, intensity: 200 },
];

export function createProjectLights(scene, textureLoader) {
  const videosPlayers = [];

  const lights = LIGHT_CONFIGS.map(({ path, x, xTarget, intensity }) => {
    const texture = isVideo(path) ? createVideoTexture(path, videosPlayers) : textureLoader.load(path);

    const light = new THREE.SpotLight(0xffffff, 0, 200, Math.PI / 4, 1.0);
    light.map = texture;
    light.position.set(x, 0, -170);
    light.target.position.set(xTarget, 0, -177);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 20;
    light.shadow.camera.fov = 30;

    scene.add(light);
    scene.add(light.target);

    return { light, maxIntensity: intensity };
  });

  return { lights, videosPlayers };
}

function isVideo(path) {
  return path.split('.').pop() === 'webm';
}

function createVideoTexture(path, videosPlayers) {
  const video = document.createElement('video');
  video.src = path;
  video.loop = true;
  videosPlayers.push(video);

  const texture = new THREE.VideoTexture(video);
  texture.format = THREE.RGBFormat;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  return texture;
}

export function setLightsIntensity(lights, factor) {
  lights.forEach(({ light, maxIntensity }) => {
    light.intensity = maxIntensity * factor;
  });
}