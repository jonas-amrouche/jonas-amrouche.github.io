import * as THREE from 'three';

export const cursorDistortionShader = {
  uniforms: {
    tDiffuse:   { value: null },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    mouseUV:    { value: new THREE.Vector2(-1.0, -1.0) },
    trailUV:    { value: Array.from({ length: 8 }, () => new THREE.Vector2(-1.0, -1.0)) },
    strength:   { value: 0.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2      resolution;
    uniform vec2      mouseUV;
    uniform vec2      trailUV[8];
    uniform float     strength;
    varying vec2      vUv;

    vec2 trailOffset(vec2 center, float r, float pullStr) {
      vec2  aspect  = vec2(resolution.x / resolution.y, 1.0);
      vec2  delta   = (vUv - center) * aspect;
      float dist    = length(delta);
      float inRange = float(center.x >= 0.0 && dist < r && dist > 0.0001);
      float t       = clamp(1.0 - dist / r, 0.0, 1.0);
      float pull    = t * t * pullStr;
      vec2  dir     = delta / max(dist, 0.0001);
      return -dir * pull / aspect * inRange;
    }

    void main() {
      vec2  aspect   = vec2(resolution.x / resolution.y, 1.0);
      bool  inactive = (strength < 0.001 || mouseUV.x < 0.0);

      float outerR   = 0.04 + strength * 0.10;
      float horizonR = 0.005 + strength * 0.007;
      float trailR   = outerR * 0.65;
      float s        = strength * 0.4;

      vec2 totalOffset = vec2(0.0);
      totalOffset += trailOffset(trailUV[0], trailR, s * 0.12);
      totalOffset += trailOffset(trailUV[1], trailR, s * 0.18);
      totalOffset += trailOffset(trailUV[2], trailR, s * 0.25);
      totalOffset += trailOffset(trailUV[3], trailR, s * 0.34);
      totalOffset += trailOffset(trailUV[4], trailR, s * 0.44);
      totalOffset += trailOffset(trailUV[5], trailR, s * 0.58);
      totalOffset += trailOffset(trailUV[6], trailR, s * 0.74);
      totalOffset += trailOffset(trailUV[7], trailR, s * 0.90);

      vec2 trailUV_sample = clamp(vUv + totalOffset * float(!inactive), 0.0, 1.0);
      vec4 base = texture2D(tDiffuse, trailUV_sample);

      vec2  delta      = (vUv - mouseUV) * aspect;
      float dist       = length(delta);
      bool  outside    = (dist > outerR);
      bool  inHorizon  = (!inactive && dist <= horizonR);
      bool  inDistort  = (!inactive && !outside && !inHorizon);

      float t      = clamp(1.0 - dist / outerR, 0.0, 1.0);
      float pull   = pow(t, 2.5) * strength * 0.15;
      float angle  = atan(delta.y, delta.x);
      float swirl  = pull * pull * 0.35;
      vec2  rot    = vec2(cos(angle + swirl) * dist, sin(angle + swirl) * dist) / aspect;
      vec2  dir    = delta / max(dist, 0.0001);
      vec2  warpUV = clamp(mouseUV + rot - dir * pull / aspect, 0.0, 1.0);

      float edgeFade = smoothstep(0.0, 0.4, (dist - horizonR) / max(outerR - horizonR, 0.0001));
      vec4  warped   = texture2D(tDiffuse, warpUV);
      warped.rgb    *= mix(0.08, 1.0, edgeFade);

      vec4 result = base;
      result = mix(result, warped,                    float(inDistort));
      result = mix(result, vec4(0.0, 0.0, 0.0, 1.0), float(inHorizon));

      gl_FragColor = result;
    }
  `,
};