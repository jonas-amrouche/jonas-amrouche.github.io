import * as THREE from 'three';
import { TUNNEL } from '../constants.js';
import { tunnelVertexShader, tunnelFragmentShader } from '../shaders/tunnel.glsl.js';

export function createTunnel() {
  const geometry = new THREE.CylinderGeometry(
    TUNNEL.RADIUS, TUNNEL.RADIUS, TUNNEL.HEIGHT,
    TUNNEL.RADIAL_SEGMENTS, TUNNEL.HEIGHT_SEGMENTS, true
  );

  const material = new THREE.ShaderMaterial({
    vertexShader: tunnelVertexShader,
    fragmentShader: tunnelFragmentShader,
    wireframe: true,
    uniforms: {
      uTime:    { value: 0.0 },
      uOpacity: { value: 0.0 },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, TUNNEL.POSITION_Z);
  mesh.rotation.set(Math.PI / 2.0, 0, 0);

  return mesh;
}