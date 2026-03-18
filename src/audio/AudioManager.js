import * as THREE from 'three';
import { AUDIO } from '../constants.js';

export class AudioManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.loader = new THREE.AudioLoader();
    this.sounds = {};
    this.muted  = false;
  }

  load(name, path, { loop = false, volume = 1.0, autoPlay = false } = {}) {
    const sound = new THREE.Audio(this.listener);
    this.loader.load(path, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(loop);
      sound.setVolume(this.muted ? 0 : volume);
      if (autoPlay) sound.play();
    });
    this.sounds[name] = { sound, defaultVolume: volume };
    return sound;
  }

  play(name) {
    const entry = this.sounds[name];
    if (!entry) return;
    // Don't restart if already playing
    if (!entry.sound.isPlaying) entry.sound.play();
  }

  stop(name) {
    this.sounds[name]?.sound.stop();
  }

  setVolume(name, volume) {
    const entry = this.sounds[name];
    if (entry) {
      entry.defaultVolume = volume;
      entry.sound.setVolume(this.muted ? 0 : volume);
    }
  }

  /** Hard-mute all sounds (called before first interaction for autoplay policy). */
  muteAll() {
    this.muted = true;
    Object.values(this.sounds).forEach(({ sound }) => sound.setVolume(0));
  }

  /** Restore all sounds to their default volumes. */
  unmuteAll() {
    this.muted = false;
    Object.values(this.sounds).forEach(({ sound, defaultVolume }) => {
      sound.setVolume(defaultVolume);
    });
  }

  /** Toggle mute state — returns new muted boolean. */
  toggleMute() {
    this.muted ? this.unmuteAll() : this.muteAll();
    return this.muted;
  }

  loadAll(skipIntro) {
    this.load('loading',        '/loading_loop.ogg',  { loop: true,  volume: AUDIO.LOADING, autoPlay: !skipIntro });
    this.load('blackHole',      '/black_hole_1.ogg',  { loop: false, volume: AUDIO.FX });
    this.load('reverseBlackHole','/black_hole_2.ogg', { loop: false, volume: AUDIO.FX });
    this.load('intro',          '/intro_sound.ogg',   { loop: false, volume: AUDIO.FX });
  }
}