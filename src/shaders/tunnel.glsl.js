export const tunnelVertexShader = /* glsl */`
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;

  float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    float noise1 = noise(position.yz * 4.0 + (uTime * vec2(0.3,  1.2)));
    float noise2 = noise(position.yz * 2.0 + (uTime * vec2(-0.9, -0.3)));
    vec3 newPosition = position - normal * noise1 * noise2 * 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    vNormal   = normal;
    vPosition = newPosition;
  }
`;

export const tunnelFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vPosition;
  varying vec3 vNormal;

  const vec3 cColor = vec3(1.0, 1.0, 1.0);

  void main() {
    vec3 depthColor = cColor * clamp(distance(vPosition.zx, vec2(0.0)) * 5.0 - 24.5, 0.0, 1.0);
    gl_FragColor = vec4(depthColor * uOpacity, 1.0);
  }
`;