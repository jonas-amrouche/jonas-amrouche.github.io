import * as THREE from 'three';
import { gsap } from 'gsap/gsap-core';
import { SCENE_STOPS } from '../scenes.js';

/**
 * ProjectNavigator — reads stop positions from scenes.js.
 *
 * SCENE_STOPS[0]   = DummyRight (rightmost, clone of last project)
 * SCENE_STOPS[1]   = Welcome
 * SCENE_STOPS[2..] = Projects
 * SCENE_STOPS[N-1] = DummyLeft (leftmost, clone of Welcome)
 *
 * Wrap right (past last project): teleport to DummyRight → animate to Welcome
 * Wrap left  (before Welcome):    teleport to DummyLeft  → animate to last project
 */

const DUMMY_RIGHT = 0;
const DUMMY_LEFT  = SCENE_STOPS.length - 1;
const REAL_FIRST  = 1;                      // Welcome
const REAL_LAST   = SCENE_STOPS.length - 2; // Last project

export class ProjectNavigator {
  constructor({ cameraSocket, onProjectChange }) {
    this.cameraSocket    = cameraSocket;
    this.onProjectChange = onProjectChange;
    this.physIndex       = REAL_FIRST; // start at Welcome
    this.isAnimating     = false;
    this.disabled        = false;
    this._touchStartX    = null;

    this._onWheel      = this._onWheel.bind(this);
    this._onKeyDown    = this._onKeyDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd   = this._onTouchEnd.bind(this);

    window.addEventListener('wheel',      this._onWheel,      { passive: false });
    window.addEventListener('keydown',    this._onKeyDown);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend',   this._onTouchEnd,   { passive: true });
  }

  _stopData(i)    { return SCENE_STOPS[i]; }
  _logicalOf(i)   { return i - REAL_FIRST; } // physical → logical (0 = Welcome)

  _teleport(i) {
    const s = this._stopData(i);
    this.cameraSocket.position.set(s.x, s.y, this.cameraSocket.position.z);
    this.physIndex = i;
  }

  _animateTo(i) {
    if (this.isAnimating) return;
    const s = this._stopData(i);
    this.physIndex   = i;
    this.isAnimating = true;
    this.onProjectChange(this._logicalOf(i));

    gsap.to(this.cameraSocket.position, {
      x: s.x, y: s.y,
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => { this.isAnimating = false; },
    });
  }

  // Navigate to a logical index (0 = Welcome)
  goTo(logicalIndex, instant = false) {
    const phys = logicalIndex + REAL_FIRST;
    if (phys < REAL_FIRST || phys > REAL_LAST) return;
    if (instant) {
      this._teleport(phys);
      this.onProjectChange(logicalIndex);
      return;
    }
    this._animateTo(phys);
  }

  next() {
    if (this.disabled || this.isAnimating) return;
    const next = this.physIndex + 1;
    if (next > REAL_LAST) {
      // Past last project → wrap: teleport to DummyRight, animate to Welcome
      this._teleport(DUMMY_RIGHT);
      this._animateTo(REAL_FIRST);
    } else {
      this._animateTo(next);
    }
  }

  prev() {
    if (this.disabled || this.isAnimating) return;
    const prev = this.physIndex - 1;
    if (prev < REAL_FIRST) {
      // Before Welcome → wrap: teleport to DummyLeft, animate to last project
      this._teleport(DUMMY_LEFT);
      this._animateTo(REAL_LAST);
    } else {
      this._animateTo(prev);
    }
  }

  _onWheel(e) {
    if (this.disabled) return;
    e.preventDefault();
    // Vertical scroll: down=next, up=prev (matches dot nav top-to-bottom order)
    // Horizontal scroll: right=next, left=prev (matches world left layout)
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    // Scroll up (delta < 0) = move left in world = prev
    // Scroll down (delta > 0) = move right in world = next
    if (delta < 0) this.next();
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
    const dx = this._touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) dx > 0 ? this.prev() : this.next();
    this._touchStartX = null;
  }

  destroy() {
    window.removeEventListener('wheel',      this._onWheel);
    window.removeEventListener('keydown',    this._onKeyDown);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchend',   this._onTouchEnd);
  }
}