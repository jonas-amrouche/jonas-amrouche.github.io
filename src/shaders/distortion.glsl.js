import * as THREE from 'three';

export const distortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    sphereRadius: { value: 0.0 },
    sphereCenter: { value: new THREE.Vector3(0, 0, 0) },
    eventHorizonRadius: { value: 0.0 },
    gravityStrength: { value: 0.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
    uniform float time;
    uniform vec2 resolution;
    uniform float sphereRadius;
    uniform vec3 sphereCenter;
    uniform float eventHorizonRadius;
    uniform float gravityStrength;
    varying vec2 vUv;

    void main() {
      vec2 centeredUv = (vUv - 0.5) * 2.0;
      centeredUv.x *= resolution.x / resolution.y;

      vec2 screenSpaceCenter = sphereCenter.xy;
      float distToCenter = length(centeredUv - screenSpaceCenter);

      vec2 finalUv = vUv;

      float outerRadius = sphereRadius;
      float innerRadius = eventHorizonRadius > 0.0 ? eventHorizonRadius : 0.001;

      if (distToCenter < outerRadius) {
        float normalizedDist = 1.0 - (distToCenter / outerRadius);
        float distortionFactor = pow(smoothstep(0.0, 1.0, normalizedDist), 2.0);

        vec2 toCenter    = screenSpaceCenter - centeredUv;
        vec2 dirToCenter = normalize(toCenter);
        float pullStrength = distortionFactor * (gravityStrength > 0.0 ? gravityStrength : 0.5);

        float angle    = atan(toCenter.y, toCenter.x);
        float rotation = distortionFactor * distortionFactor * 0.5;
        vec2 rotatedDir = vec2(
          cos(angle + rotation) * length(toCenter),
          sin(angle + rotation) * length(toCenter)
        );

        vec2 distortion = dirToCenter * pullStrength * 0.3
                        + (rotatedDir - toCenter) * distortionFactor * 0.2;
        vec2 aspectRatio = vec2(resolution.x / resolution.y, 1.0);
        finalUv = vUv + distortion / aspectRatio * 0.5;

        if (distToCenter < innerRadius) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
      }

      finalUv = clamp(finalUv, 0.0, 1.0);
      vec4 color = texture2D(tDiffuse, finalUv);

      if (distToCenter < outerRadius && distToCenter > innerRadius) {
        float edgeDist = (distToCenter - innerRadius) / (outerRadius - innerRadius);
        color.rgb *= mix(0.3, 1.0, smoothstep(0.0, 0.5, edgeDist));
      }

      gl_FragColor = color;
    }
  `,
};