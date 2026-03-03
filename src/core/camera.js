import * as THREE from 'three';
import { SCENE } from '../constants.js';

export function createCamera() {
  const cameraSocket = new THREE.Object3D();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  cameraSocket.add(camera);
  cameraSocket.position.set(0, 0, SCENE.CAMERA_START_Z);
  return { camera, cameraSocket };
}