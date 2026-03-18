import { gsap } from 'gsap';
import { SCENE } from '../constants.js';
import { setLightsIntensity } from '../scene/projectLights.js';

/**
 * Intro sequence — torus/mask removed, everything else preserved exactly.
 *
 * Flow (same as original minus Phase 1 torus expand):
 *   1. Camera FOV blast to 100 + intro clip plays   (0.5s)
 *   2. Flythrough: camera Z (5s), full spin (4s),
 *      tunnel at 2.5s, FOV back at 2.5s,
 *      lights at 4s, ambient ramp, star glow
 */
export function runIntro({
  mixer, camera, cameraSocket,
  mask, Windows, tunnelMesh,
  props,
  lights, videosPlayers,
  audio, playClip, loadingAction,
  scrollManager, scrollBox,
  onProjectChange,
}) {
  return new Promise((resolve) => {

    audio.stop('loading');
    audio.play('intro');

    if (mask) mask.visible = false;
    _cameraBlast();

    function _cameraBlast() {
      Windows.visible = true;
      tunnelMesh.material.uniforms.uOpacity = { value: 0.0 };
      if (loadingAction) loadingAction.stop();
      playClip('intro', true);

      gsap.to(camera, {
        fov: 100,
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => _flythrough(),
      });
    }

    function _flythrough() {
      // Project lights fade in
      gsap.to({}, {
        delay: 4.0,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: function () {
          setLightsIntensity(lights, this.progress());
        },
      });

      // Tunnel fade in at 2.5s
      gsap.to(tunnelMesh.material.uniforms.uOpacity, {
        delay: 2.5,
        value: 1.0,
        duration: 2.0,
        ease: 'power2.out',
      });

      // FOV back to 50 at 2.5s
      gsap.to(camera, {
        delay: 2.5,
        fov: 50.0,
        duration: 1.0,
        ease: 'power2.out',
        onUpdate: () => camera.updateProjectionMatrix(),
      });

      // Camera Z fly to final position
      gsap.to(cameraSocket.position, {
        x: 0, y: 0, z: SCENE.CAMERA_END_Z,
        duration: 5.0,
        ease: 'power2.inOut',
        onComplete: () => { props.visible = true; },
      });

      // Camera full rotation — then finalize
      gsap.to(cameraSocket.rotation, {
        x: 0, y: 0, z: Math.PI * 2.0,
        duration: 4.0,
        ease: 'power2.inOut',
        onComplete: () => {
          videosPlayers.forEach(v => v.play());
          playClip('floating', false);
          tunnelMesh.visible = false;
          // Enable wheel/key navigation after intro
          onProjectChange(0);
          resolve();
        },
      });


    }
  });
}