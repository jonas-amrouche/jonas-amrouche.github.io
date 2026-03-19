/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  scenes.js — single source of truth for all scene configuration     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ── HOW TO ADD A NEW PROJECT ──────────────────────────────────────────
 *
 *  1. Add its content entry to PROJECTS (title, hook, screenshots, etc.)
 *
 *  2. Add its Blender stop to WORLD_STOPS in physical left→right order.
 *
 *  3. Add a projector entry to PROJECTORS keyed by the same id.
 *
 *  4. Insert the id into NAV_ORDER where the user should encounter it.
 *     Welcome must stay first.
 *
 *  5. Name the board mesh in Blender exactly the id string.
 *
 *  New scenes go between Elumin and ServerMeshing in the world — place
 *  them physically between ServerMeshingDummy and Elumin in Blender,
 *  and insert them between ServerMeshing and Elumin in NAV_ORDER.
 *
 * ── WRAP SEAM ─────────────────────────────────────────────────────────
 *
 *  Physical world (left → right):
 *    ServerMeshingDummy → Elumin → Firelive → Welcome → Metronim → ServerMeshing → EluminDummy
 *
 *  Nav order (what user experiences scrolling right from Welcome):
 *    Welcome → Metronim → ServerMeshing → [seam] → Elumin → Firelive → (back to Welcome)
 *
 *  Two dummies bridge the one seam:
 *    Going right (ServerMeshing→Elumin):  teleport to ServerMeshingDummy (left of Elumin),  slide right into Elumin.
 *    Going left  (Elumin→ServerMeshing):  teleport to EluminDummy        (right of ServerMeshing), slide left into ServerMeshing.
 */

// ═══════════════════════════════════════════════════════════════════════
// 1. PROJECT CONTENT  (id = exact GLTF mesh name)
// ═══════════════════════════════════════════════════════════════════════

export const PROJECTS = {

  Firelive: {
    title:       'Firelive',
    hook:        'Live mixing and producing software with loop buffers, fully customizable and mappable to any controller. Built and performed with in a week.',
    tags:        ['Godot Engine', 'C++', 'Git'],
    icons:       ['/godot_logo.svg', '/cpp_logo.svg', '/git_logo.svg'],
    screenshots: ['/firelive_screen1.jpg', '/firelive_screenshot1.jpg', '/firelive_screenshot2.jpg'],
    screenMap:   '/firelive_screen_emi.jpg',
    link:        null, linkLabel: null,
    arrival:     'Live mixing software — loop buffers, fully controller-mappable.',
  },

  Elumin: {
    title:       'Elumin',
    hook:        'Atmospheric exploration game — 4 years, custom Blender tooling for VRAM/draw call issues. Has a Steam page.',
    tags:        ['Godot Engine', 'Blender', 'Krita', 'LMMS'],
    icons:       ['/godot_logo.svg', '/blender_logo.png', '/krita_logo.png', '/lmms_logo.webp'],
    screenshots: ['/elumin_screenshot1.png', '/elumin_screenshot2.png', '/elumin_screenshot3.png'],
    screenMap:   '/elumin_screenshot2.jpg',
    link:        'https://store.steampowered.com/app/2684580/Elumin/', linkLabel: 'Steam page',
    arrival:     'Atmospheric exploration game — 4 years in the making.',
  },

  ServerMeshing: {
    title:       'Server Meshing',
    hook:        'Distributed multiplayer architecture with server-to-server meshing, proximity VOIP via a custom C++ Opus extension, and player load balancing.',
    tags:        ['Godot Engine', 'C++', 'Opus'],
    icons:       ['/godot_logo.svg', '/cpp_logo.svg', '/opus_logo.svg'],
    screenshots: ['/meshing_windows.png', '/server_meshing_screenshot_1.png', '/server_meshing_screenshot_2.png'],
    screenMap:   '/server_meshing_scene_2.png',
    link:        null, linkLabel: null,
    arrival:     'Distributed multiplayer with proximity VOIP and server meshing.',
  },

  Metronim: {
    title:       'Metronim',
    hook:        'Multiplayer browser game where players are metro stations firing explosive trains. Built with Node.js + Socket.io, hosted live for months.',
    tags:        ['Node.js', 'Socket.io', 'Git'],
    icons:       ['/nodejs_logo.svg', '/socketio_logo.svg', '/git_logo.svg'],
    screenshots: ['/metronim_screenshot2.jpg', '/metronim_screenshot3.jpg', '/metronim_screenshot4.jpg'],
    screenMap:   '/metronim_screenshot1.jpg',
    link:        null, linkLabel: null,
    arrival:     'Multiplayer browser game — metro stations firing trains.',
  },

  // Dummy screens need screen textures too so they look correct during the teleport flash.
  // These are NOT interactive — no panel, no arrival card, not in PROJECT_IDS.
  ServerMeshingDummy: {
    screenMap: '/server_meshing_scene_2.png',  // same as ServerMeshing
  },
  EluminDummy: {
    screenMap: '/elumin_screenshot2.jpg',       // same as Elumin
  },

};

// ═══════════════════════════════════════════════════════════════════════
// 2. PHYSICAL WORLD  (left → right Blender order)
//    !! Update x values to match your Blender scene !!
// ═══════════════════════════════════════════════════════════════════════

export const WORLD_STOPS = [
  { id: 'ServerMeshingDummy', x: -60, y: 0, isDummy: true  },
  { id: 'Elumin',             x: -40, y: 0                 },
  { id: 'Firelive',           x: -20, y: 0                 },
  { id: 'Welcome',            x:   0, y: 0                 },
  { id: 'Metronim',           x:  20, y: 0                 },
  { id: 'ServerMeshing',      x:  40, y: 0                 },
  { id: 'EluminDummy',        x:  60, y: 0, isDummy: true  },
];

// ═══════════════════════════════════════════════════════════════════════
// 3. NAV ORDER  (user-facing sequence, Welcome first, no dummies)
// ═══════════════════════════════════════════════════════════════════════

export const NAV_ORDER = [
  'Welcome',
  'Metronim',
  'ServerMeshing',
  'Elumin',
  'Firelive',
];

// ═══════════════════════════════════════════════════════════════════════
// 4. PROJECTORS  (keyed by stop id, xOffset relative to stop.x)
// ═══════════════════════════════════════════════════════════════════════

const Z = -170; // projector Z — adjust to match Blender

export const PROJECTORS = {
  Firelive:           [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/firelive_screen1_blured.jpg' }],
  Elumin:             [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/elumin_screen_blurred_2.png' }],
  Metronim:           [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/metronim_screenshot4_blurred.jpg' }],
  ServerMeshing:      [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/server_meshing_scene_blurred.png' }],
  ServerMeshingDummy: [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/server_meshing_scene_blurred.png' }],
  EluminDummy:        [{ xOffset: 0, zPos: Z, xTarget: 0, intensity: 200, blurredMap: '/elumin_screen_blurred_2.png' }],
};

export const FLASHREEL = {
  videoPath: '/flashreel.webm',
  x: 0, zPos: Z, xTarget: 0, intensity: 100,
};

// ═══════════════════════════════════════════════════════════════════════
// 5. DERIVED  (auto-computed — do not edit)
// ═══════════════════════════════════════════════════════════════════════

export const WORLD_MAP  = Object.fromEntries(WORLD_STOPS.map(s => [s.id, s]));
export const PROJECT_IDS = NAV_ORDER.filter(id => id !== 'Welcome');
export const NAV_LENGTH  = NAV_ORDER.length;

// Find the single seam: the consecutive NAV_ORDER pair not physically adjacent.
function _findSeam() {
  const worldIds = WORLD_STOPS.map(s => s.id);
  for (let i = 0; i < NAV_ORDER.length; i++) {
    const a    = NAV_ORDER[i];
    const b    = NAV_ORDER[(i + 1) % NAV_ORDER.length];
    const idxA = worldIds.indexOf(a);
    const idxB = worldIds.indexOf(b);
    if (Math.abs(idxA - idxB) !== 1) {
      return { fromId: a, toId: b, seamNavIdx: i };
      // seamNavIdx: the nav index BEFORE the seam (going right crosses seam at seamNavIdx → seamNavIdx+1)
    }
  }
  return null;
}
export const SEAM = _findSeam();

// For each crossing direction, find the dummy adjacent to the DESTINATION.
// Going right (seam.fromId → seam.toId): dummy must be left of toId (lower world index).
// Going left  (seam.toId → seam.fromId): dummy must be right of fromId (higher world index).
function _findDummies() {
  if (!SEAM) return { rightDummy: null, leftDummy: null };
  const worldIds = WORLD_STOPS.map(s => s.id);

  // Going right: land on toId. Need dummy just left of toId.
  const toIdx      = worldIds.indexOf(SEAM.toId);
  const rightDummy = WORLD_STOPS[toIdx - 1]?.isDummy ? WORLD_STOPS[toIdx - 1] : null;

  // Going left: land on fromId. Need dummy just right of fromId.
  const fromIdx    = worldIds.indexOf(SEAM.fromId);
  const leftDummy  = WORLD_STOPS[fromIdx + 1]?.isDummy ? WORLD_STOPS[fromIdx + 1] : null;

  return { rightDummy, leftDummy };
}
export const { rightDummy: SEAM_DUMMY_RIGHT, leftDummy: SEAM_DUMMY_LEFT } = _findDummies();