import * as THREE from 'three';
import { SCENE } from '../constants.js';

export class ScrollManager {
  constructor() {
    this.scrollPercent = 0.0;
    this.scrollTarget = 0.0;
    this.previousPercent = 0.0;
    this.scrollSpeed = 0.0;
    this.disabled = false;

    // touch
    this._xDown = null;
    this._yDown = null;
  }

  center(scrollBox) {
    scrollBox.scrollTop = SCENE.SCROLL_CENTER;
    scrollBox.scrollLeft = SCENE.SCROLL_CENTER;
    this.previousPercent = 50.0;
    this.scrollPercent = 50.0;
  }

  onScroll(scrollBox) {
    if (!this.disabled && scrollBox.scrollTop && window.innerWidth > 768) {
      this.scrollPercent = (scrollBox.scrollTop / (scrollBox.scrollHeight - document.documentElement.clientHeight)) * 100.0;
    }
  }

  onTouchStart(evt) {
    this._xDown = evt.touches[0].clientX;
    this._yDown = evt.touches[0].clientY;
  }

  onTouchMove(evt) {
    if (!this._xDown || !this._yDown) return;
    const xDiff = this._xDown - evt.touches[0].clientX;
    const yDiff = this._yDown - evt.touches[0].clientY;
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      this.scrollPercent = Math.min(100, Math.max(0, this.scrollPercent + (xDiff > 0 ? 20 : -20)));
    }
    this._xDown = null;
    this._yDown = null;
  }

  update(cameraSocket, introDone) {
    if (!introDone || this.disabled) return;

    const raw = (this.scrollPercent - 50) * SCENE.SCROLL_SCALE;
    const snapped = Math.round(raw / SCENE.SNAP_STEP) * SCENE.SNAP_STEP;
    this.scrollTarget = THREE.MathUtils.lerp(this.scrollTarget, snapped, 0.1);
    cameraSocket.position.x = this.scrollTarget;

    const speedDiff = this.scrollPercent - this.previousPercent;
    this.scrollSpeed = THREE.MathUtils.lerp(this.scrollSpeed, speedDiff, 0.1);
    cameraSocket.rotation.set(0, -this.scrollSpeed * 0.1, 0);

    this.previousPercent = this.scrollPercent;
  }
}