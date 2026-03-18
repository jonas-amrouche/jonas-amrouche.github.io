/**
 * scenes.js — single source of truth for all scene configuration.
 *
 * To add a project:
 *   1. Add a new entry to PROJECTS_DATA
 *   2. Add a matching entry to SCENE_STOPS (with your Blender X/Y positions)
 *   3. Place the board mesh in Blender at those coordinates
 *   4. Done — projectors, screens, nav, panel all update automatically
 *
 * SCENE_STOPS layout:
 *   Index 0          = DummyRight (clone of last project, placed right of Welcome)
 *   Index 1          = Welcome page
 *   Index 2..N+1     = Projects (matching PROJECTS_DATA order)
 *   Index N+2        = DummyLeft (clone of Welcome, placed left of last project)
 *
 * Projector config:
 *   Each project has 1–2 SpotLights. xOffset is relative to the stop's X position.
 *   yOffset and zPos are absolute world positions matching your Blender light placement.
 *   blurredMap: the blurred background texture for the light cone.
 */

// ─── Project content ──────────────────────────────────────────────────────────

export const PROJECTS_DATA = [
  {
    id: 'Firelive',
    // Screen texture (the image shown on the hologram board mesh)
    screenMap: '/firelive_screen_emi.jpg',
    // Panel content
    title: 'Firelive',
    hook: 'Live mixing and producing software with loop buffers, fully customizable and mappable to any controller. Built and performed with in a week.',
    tags: ['Godot Engine', 'C++', 'Git'],
    icons: ['/godot_logo.svg', '/cpp_logo.svg', '/git_logo.svg'],
    screenshots: ['/firelive_screen1.jpg', '/firelive_screenshot1.jpg', '/firelive_screenshot2.jpg'],
    link: null,
    linkLabel: null,
    // Arrival card
    arrivalHook: 'Live mixing software with loop buffers and custom controller support.',
  },
  {
    id: 'Elumin',
    screenMap: '/elumin_screenshot2.jpg',
    title: 'Elumin',
    hook: 'Atmospheric exploration game — 4 years, custom Blender tooling for VRAM/draw call issues. Has a Steam page.',
    tags: ['Godot Engine', 'Blender', 'Krita', 'LMMS'],
    icons: ['/godot_logo.svg', '/blender_logo.png', '/krita_logo.png', '/lmms_logo.webp'],
    screenshots: ['/elumin_screenshot1.png', '/elumin_screenshot2.png', '/elumin_screenshot3.png'],
    link: 'https://store.steampowered.com/app/2684580/Elumin/',
    linkLabel: 'Steam page',
    arrivalHook: 'Atmospheric exploration game — 4 years in the making.',
  },
  {
    id: 'ServerMeshing',
    screenMap: '/server_meshing_screenshot_1.png',
    title: 'Server Meshing',
    hook: 'Distributed multiplayer architecture with server-to-server meshing, proximity VOIP via a custom C++ Opus extension, and player load balancing.',
    tags: ['Godot Engine', 'C++', 'Opus'],
    icons: ['/godot_logo.svg', '/cpp_logo.svg', '/opus_logo.svg'],
    screenshots: ['/meshing_windows.png', '/server_meshing_screenshot_1.png', '/server_meshing_screenshot_2.png'],
    link: null,
    linkLabel: null,
    arrivalHook: 'Distributed multiplayer architecture with proximity VOIP.',
  },
  {
    id: 'Metronim',
    screenMap: '/metronim_screenshot1.jpg',
    title: 'Metronim',
    hook: 'Multiplayer browser game where players are metro stations firing explosive trains. Built with Node.js + Socket.io, hosted live for months.',
    tags: ['Node.js', 'Socket.io', 'Git'],
    icons: ['/nodejs_logo.svg', '/socketio_logo.svg', '/git_logo.svg'],
    screenshots: ['/metronim_screenshot2.jpg', '/metronim_screenshot3.jpg', '/metronim_screenshot4.jpg'],
    link: null,
    linkLabel: null,
    arrivalHook: 'Multiplayer browser game — metro stations firing trains.',
  },
];

// Derived: just the mesh names for raycasting
export const PROJECT_IDS = PROJECTS_DATA.map(p => p.id);

// ─── Camera stops ─────────────────────────────────────────────────────────────
// !! Set X/Y to match your Blender positions !!
// Y = camera height to reach board (matches Z offset you set in Blender)

export const SCENE_STOPS = [
  // Physical[0]: DummyRight — clone of Metronim, placed right of Welcome
  { x: 20, y: 0,  isDummy: true },
  // Physical[1]: Welcome page
  { x: 0, y: 0,    isDummy: false, logicalIndex: 0 },
  // Physical[2..5]: Projects — same order as PROJECTS_DATA
  { x: -20, y: 0,    isDummy: false, logicalIndex: 1 },  // Firelive
  { x: -40, y: 0,  isDummy: false, logicalIndex: 2 },  // Elumin
  { x: -60, y: 0,  isDummy: false, logicalIndex: 3 },  // ServerMeshing
  { x: -80, y: 0,  isDummy: false, logicalIndex: 4 },  // Metronim
  // Physical[6]: DummyLeft — clone of Welcome, placed left of Metronim
  { x: -100, y: 0,    isDummy: true },
];

// ─── Projector (SpotLight) configuration ──────────────────────────────────────
// Each entry matches a project by index (same order as PROJECTS_DATA).
// xOffset: relative to the stop's X world position.
// yPos, zPos: absolute world Y and Z.
// intensity: SpotLight intensity.
// blurredMap: blurred texture for the light cone projection.

export const PROJECTOR_CONFIGS = [
  // Firelive — SCENE_STOPS[2].x = -20
  [
    { xOffset:  0,    yPos: 0, zPos: -170, xTarget: 0,   intensity: 200, blurredMap: '/firelive_screen1_blured.jpg' },
  ],
  // Elumin — SCENE_STOPS[3].x = -40
  [
    { xOffset: 0, yPos: 0, zPos: -170, xTarget: 0, intensity: 200, blurredMap: '/elumin_screen_blurred_2.png' },
  ],
  // ServerMeshing — SCENE_STOPS[4].x = -60
  [
    { xOffset:  0,    yPos: 0, zPos: -170, xTarget: 0,   intensity: 200, blurredMap: '/server_meshing_screenshot_2_blurred.png' },
  ],
  // Metronim — SCENE_STOPS[5].x = -80
  [
    { xOffset:  0,    yPos: 0, zPos: -170, xTarget: 0,   intensity: 200, blurredMap: '/metronim_screenshot4_blurred.jpg' },
  ],
];

// Dummy stop projector configs — mirrors of edge projects so they look correct during wrap teleport.
// DummyRight (index 0) mirrors Metronim's lights.
// DummyLeft  (index 6) mirrors Firelive's lights.
// !! Set xBase to match your actual Blender dummy stop X positions !!
export const DUMMY_PROJECTOR_CONFIGS = [
  // DummyRight — clone of Metronim (SCENE_STOPS[0].x)
  {
    stopPhysIndex: 0,
    lights: [
      { xOffset: 0, yPos: 0, zPos: -170, xTarget: 0, intensity: 200, blurredMap: '/metronim_screenshot4_blurred.jpg' },
    ],
  },
  // DummyLeft — clone of Firelive (SCENE_STOPS[6].x)
  {
    stopPhysIndex: 6,
    lights: [
      { xOffset: 0, yPos: 0, zPos: -170, xTarget: 0, intensity: 200, blurredMap: '/firelive_screen1_blured.jpg' },
    ],
  },
];

// Central flashreel light (sits at Welcome, always on)
export const FLASHREEL_CONFIG = {
  path: '/flashreel.webm',
  x: 0, zPos: -170, xTarget: 0, intensity: 100,
};