import './style.css'

import * as THREE from 'three'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap/gsap-core';

const scene = new THREE.Scene();
// const backgroundColor = new THREE.Color( 'rgba(179, 221, 223, 1)' );
// scene.background = backgroundColor;

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

let scrollPercent = 0;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 0, 8)

const geometry = new THREE.RingGeometry( 2, 3, 4 );
const rectangleColor = new THREE.Color( 'rgba(255, 255, 255, 1)' );
const material = new THREE.MeshStandardMaterial( { color: 0xffffff, emissive: rectangleColor, emissiveIntensity: 1});
const torus = new THREE.Mesh(geometry, material);
torus.position.set(0, 0, -2)

scene.add(torus);

const pageGridGeometry = new THREE.PlaneGeometry( 10, 50, 50, 250 );
const pageGridVertexShader = document.getElementById('buttonVertexShader').textContent;
const pageGridFragmentShader = document.getElementById('buttonFragmentShader').textContent;
const pageGridMaterial = new THREE.ShaderMaterial( {
  vertexShader:pageGridVertexShader,
  fragmentShader:pageGridFragmentShader,
  wireframe:true,
});
pageGridMaterial.uniforms.uTime = {value : 0.0};
pageGridMaterial.uniforms.uOpacity = {value : 0.0};

const pageGrid = new THREE.Mesh(pageGridGeometry, pageGridMaterial);
pageGrid.position.set(0, -20, -102.0)

scene.add(pageGrid);

const loader = new GLTFLoader();

const animLoaded = await loader.loadAsync( '/animations.glb' );
const loadingMesh = animLoaded.scene
const mixer = new THREE.AnimationMixer( loadingMesh );
scene.add( loadingMesh );
const mask = loadingMesh.getObjectByName("Mask");
const Windows = loadingMesh.getObjectByName("Windows");
Windows.frustumCulled = false;

play_clip(animLoaded, mixer, "loading", false)

const pointLight = new THREE.PointLight(0xffffff, 100)
pointLight.position.set(0, 0, 3)

scene.add(pointLight);

const composer = new EffectComposer( renderer );

const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
const bloomPass = new UnrealBloomPass( resolution, 1, 0.4, 0.7 );
composer.addPass( bloomPass );

const clock = new THREE.Clock();
let introPlayed = false;

// camera.position.set(0, 0, -100);
function animate() {
  requestAnimationFrame(animate);

  mixer.update(clock.getDelta());

  pageGrid.material.uniforms.uTime = {value : clock.elapsedTime};

  if (clock.elapsedTime > 1.0 && !introPlayed){
    introPlayed = true;
    gsap.to(mixer, {
      timeScale: 5.0,
      duration: 3.0,
      ease: "power2.inOut",
      onComplete: () => {
        mixer.timeScale = 1.0;
        gsap.to(torus.scale, {
          x: 10,
          y: 10,
          z: 10,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            torus.visible = false
            mask.visible = false
            pageGrid.material.uniforms.uOpacity = {value : 0.0}
            play_clip(animLoaded, mixer, "intro", true)
            gsap.to(camera, {
              fov: 100,
              duration: 0.5,
              ease: "power2.inOut",
              onUpdate: () => {
                camera.updateProjectionMatrix();
              },
              onComplete: () => {
                
                gsap.to(camera.position, {
                  x: 0,
                  y: 0,
                  z: -100,
                  duration: 5,
                  ease: "power2.inOut",
                });
                gsap.to(camera.rotation, {
                  x: 0,
                  y: 0,
                  z: Math.PI*2.0,
                  duration: 4,
                  ease: "power2.inOut",
                  onComplete: () => {
                    gsap.to(pageGrid.material.uniforms.uOpacity, {
                      value: 1.0,
                      duration: 6.0,
                      ease: "power2.In",
                    });
                    document.querySelector('body').style.height = "5000px";
                    window.scrollTo(0, 0);
                  }
                });
              }
            });
          }
        });
      }
    });
    
  }
  camera.position.set(camera.position.x, -scrollPercent*0.4, camera.position.z);

  composer.render();
}

document.body.onscroll = () => {
    //calculate the current scroll progress as a percentage
    scrollPercent = ((document.documentElement.scrollTop || document.body.scrollTop) / ((document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight)) * 100;
}

function play_clip(gltfLoad, mixer, clipName, oneShot) {
  const clips = gltfLoad.animations;
  const clip = THREE.AnimationClip.findByName( clips, clipName );
  const animation = mixer.clipAction( clip );
  animation.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat)
  animation.play();
}

// function load_gltf(path) {
//   const loader = new GLTFLoader();
//   return 
// }

animate()