import { gsap } from 'gsap';
import { NAV_ORDER, NAV_LENGTH, WORLD_MAP, SEAM, SEAM_DUMMY_RIGHT, SEAM_DUMMY_LEFT } from '../scenes.js';

/**
 * ProjectNavigator
 *
 * seqIndex = position in NAV_ORDER. Navigation is seqIndex ± 1 (mod NAV_LENGTH).
 *
 * At the seam, before animating, the camera teleports to the appropriate dummy:
 *   Going right (seam.seamNavIdx → seamNavIdx+1): teleport to SEAM_DUMMY_RIGHT (left of destination)
 *   Going left  (seamNavIdx+1 → seamNavIdx):       teleport to SEAM_DUMMY_LEFT  (right of destination)
 * Both produce a short one-step slide in the correct direction.
 */

export class ProjectNavigator {
  constructor({ cameraSocket, onProjectChange }) {
    this.cameraSocket    = cameraSocket;
    this.onProjectChange = onProjectChange;
    this.seqIndex        = 0;
    this.isAnimating     = false;
    this.disabled        = false;
    this._touchStartX    = null;
    this._lastScroll     = 0;
    this.onScrollWhileDisabled = null; // called when scroll fires while disabled

    this._onWheel      = this._onWheel.bind(this);
    this._onKeyDown    = this._onKeyDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd   = this._onTouchEnd.bind(this);

    window.addEventListener('wheel',      this._onWheel,      { passive: false });
    window.addEventListener('keydown',    this._onKeyDown);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend',   this._onTouchEnd,   { passive: true });
  }

  _snapTo(stopId) {
    const s = WORLD_MAP[stopId];
    if (!s) return;
    this.cameraSocket.position.x = s.x;
    this.cameraSocket.position.y = s.y;
  }

  _animateTo(seqIdx) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.seqIndex    = seqIdx;

    const s = WORLD_MAP[NAV_ORDER[seqIdx]];
    this.onProjectChange(seqIdx);

    gsap.to(this.cameraSocket.position, {
      x: s.x, y: s.y,
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => { this.isAnimating = false; },
    });
  }

  goTo(logicalIndex, instant = false) {
    if (logicalIndex < 0 || logicalIndex >= NAV_LENGTH) return;
    if (instant) {
      this.seqIndex = logicalIndex;
      this._snapTo(NAV_ORDER[logicalIndex]);
      this.onProjectChange(logicalIndex);
      return;
    }
    this._animateTo(logicalIndex);
  }

  next() {
    if (this.disabled || this.isAnimating) return;
    const nextSeq = (this.seqIndex + 1) % NAV_LENGTH;

    // Crossing seam going right?
    if (SEAM && this.seqIndex === SEAM.seamNavIdx && SEAM_DUMMY_RIGHT) {
      this._snapTo(SEAM_DUMMY_RIGHT.id);
    }

    this._animateTo(nextSeq);
  }

  prev() {
    if (this.disabled || this.isAnimating) return;
    const prevSeq = (this.seqIndex - 1 + NAV_LENGTH) % NAV_LENGTH;

    // Crossing seam going left? (from seamNavIdx+1 back to seamNavIdx)
    const seamRight = (SEAM.seamNavIdx + 1) % NAV_LENGTH;
    if (SEAM && this.seqIndex === seamRight && SEAM_DUMMY_LEFT) {
      this._snapTo(SEAM_DUMMY_LEFT.id);
    }

    this._animateTo(prevSeq);
  }

  _onWheel(e) {
    e.preventDefault();
    if (this.disabled) {
      // While panel is open: close it and let the scroll fire navigation
      if (this.onScrollWhileDisabled) this.onScrollWhileDisabled();
      return;
    }
    const now = Date.now();
    if (now - this._lastScroll < 300) return;
    this._lastScroll = now;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta > 0) this.next();
    else this.prev();
  }

  _onKeyDown(e) {
    if (this.disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.prev();
  }

  _onTouchStart(e) { this._touchStartX = e.touches[0].clientX; }

  _onTouchEnd(e) {
    if (this._touchStartX === null) return;
    // On mobile, swipe does nothing while panel is open (user must close explicitly)
    if (!this.disabled) {
      const dx = this._touchStartX - e.changedTouches[0].clientX;
      // dx > 0: finger moved left (swipe left) = scroll right = next()
      // dx < 0: finger moved right (swipe right) = scroll left = prev()
      if (Math.abs(dx) > 40) dx > 0 ? this.next() : this.prev();
    }
    this._touchStartX = null;
  }

  destroy() {
    window.removeEventListener('wheel',      this._onWheel);
    window.removeEventListener('keydown',    this._onKeyDown);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchend',   this._onTouchEnd);
  }
}