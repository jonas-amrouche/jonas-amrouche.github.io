import * as THREE from 'three';
import { AUDIO } from '../constants.js';

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    this.loader = new THREE.AudioLoader();
    this.sounds = {};
    this.muted = false;
  }

  load(name, path, { loop = false, volume = 1.0, autoPlay = false } = {}) {
    const sound = new THREE.Audio(this.listener);
    this.loader.load(path, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(loop);
      sound.setVolume(volume);
      if (autoPlay) sound.play();
    });
    this.sounds[name] = { sound, defaultVolume: volume };
    return sound;
  }

  play(name) {
    const entry = this.sounds[name];
    if (entry && !this.muted) entry.sound.play();
  }

  stop(name) {
    this.sounds[name]?.sound.stop();
  }

  setVolume(name, volume) {
    const entry = this.sounds[name];
    if (entry) entry.sound.setVolume(this.muted ? 0 : volume);
  }

  toggleMute() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach(({ sound, defaultVolume }) => {
      sound.setVolume(this.muted ? 0 : defaultVolume);
    });
    return this.muted;
  }

  loadAll(skipIntro) {
    this.load('ambient', '/note_b_loop.ogg', { loop: true,  volume: AUDIO.AMBIENT });
    this.load('loading', '/loading_loop.ogg', { loop: true,  volume: AUDIO.LOADING, autoPlay: !skipIntro });
    this.load('blackHole', '/black_hole_1.ogg', { loop: false, volume: AUDIO.FX });
    this.load('reverseBlackHole','/black_hole_2.ogg', { loop: false, volume: AUDIO.FX });
    this.load('intro', '/intro_sound.ogg', { loop: false, volume: AUDIO.FX });
  }
}