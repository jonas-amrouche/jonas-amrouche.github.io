import { gsap } from 'gsap/gsap-core';
import { SCENE } from '../constants.js';

export function runIntro({
  mixer, camera, cameraSocket,
  torus, mask, Windows, tunnelMesh,
  projectStar, props,
  lights, videosPlayers,
  audio, playClip,
  scrollManager, scrollBox,
}) {
  return new Promise((resolve) => {
    audio.play('intro');
    audio.stop('loading');

    gsap.to(mixer, {
      timeScale: 5.575,
      duration:  6.0,
      ease:      'power2.inOut',
      onComplete: () => {
        mixer.timeScale = 1.0;
        _expandTorus(torus, () => {
          _cameraBlast({ camera, playClip, torus, mask, Windows, tunnelMesh }, () => {
            _flythrough({ camera, cameraSocket, tunnelMesh, lights, videosPlayers, props, playClip, scrollManager, scrollBox, audio }, resolve);
          });
        });
      },
    });
  });
}

function _expandTorus(torus, onComplete) {
  gsap.to(torus.scale, {
    x: 10, y: 10, z: 10,
    duration: 0.5,
    ease: 'power2.in',
    onComplete,
  });
}

function _cameraBlast({ camera, playClip, torus, mask, Windows, tunnelMesh }, onComplete) {
  torus.visible   = false;
  mask.visible    = false;
  Windows.visible = true;
  tunnelMesh.material.uniforms.uOpacity = { value: 0.0 };

  playClip('intro', true);

  gsap.to(camera, {
    fov:      100,
    duration: 0.5,
    ease:     'power2.inOut',
    onUpdate:   () => camera.updateProjectionMatrix(),
    onComplete,
  });
}

function _flythrough({ camera, cameraSocket, tunnelMesh, lights, videosPlayers, props, playClip, scrollManager, scrollBox, audio }, resolve) {
  audio.play('ambient');

  // Ambient volume ramp
  gsap.to({}, {
    duration: 4.0,
    ease:     'expo.in',
    onUpdate: function () { audio.setVolume('ambient', this.progress() * 2.0); },
  });

  // Project lights fade in
  gsap.to({}, {
    delay:    4.0,
    duration: 2.0,
    ease:     'power2.inOut',
    onUpdate: function () {
      lights.forEach(({ light, maxIntensity }) => {
        light.intensity = maxIntensity * this.progress();
      });
    },
  });

  // Tunnel fade in
  gsap.to(tunnelMesh.material.uniforms.uOpacity, {
    delay:    2.5,
    value:    1.0,
    duration: 2.0,
    ease:     'power2.out',
  });

  // FOV back to normal
  gsap.to(camera, {
    delay:    2.5,
    fov:      50.0,
    duration: 1.0,
    ease:     'power2.out',
    onUpdate: () => camera.updateProjectionMatrix(),
  });

  // Camera fly to final position
  gsap.to(cameraSocket.position, {
    x: 0, y: 0, z: SCENE.CAMERA_END_Z,
    duration: 5.0,
    ease:     'power2.inOut',
    onComplete: () => { props.visible = true; },
  });

  // Camera rotation + finalize
  gsap.to(cameraSocket.rotation, {
    x: 0, y: 0, z: Math.PI * 2.0,
    duration: 4.0,
    ease:     'power2.inOut',
    onComplete: () => {
      videosPlayers.forEach(v => v.play());
      playClip('floating', false);
      scrollBox.style.overflow = 'scroll';
      tunnelMesh.visible = false;
      scrollManager.center(scrollBox);
      resolve();
    },
  });
}