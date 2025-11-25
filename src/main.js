import './style.css'

import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap/gsap-core';

const pageSize = 7000;

let introDone = false;
let screenTouched = false;
let scrollPercent = 0;
let volumeMuted = false;
let projectShown = "";

// let ambienceLights = [];
let projectLights = [];
let videosPlayers = [];

// Create 3D renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg') });

// Create 2D HTLM renderer
const flatRenderer = new CSS2DRenderer();
document.body.appendChild(flatRenderer.domElement);
flatRenderer.domElement.id = "flat-renderer"

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8)

// Add post-processing
const composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );
const fxaaPass = new FXAAPass();
composer.addPass( fxaaPass );
const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
const bloomPass = new UnrealBloomPass( resolution, 0.5, 0.4, 0.7 );
composer.addPass( bloomPass );
const outputPass = new OutputPass();
composer.addPass(outputPass);

updateSreenSize();

// Setup and play animations.gltf
const loader = new GLTFLoader();
const animLoaded = await loader.loadAsync( '/animations.glb' );
const loadingMesh = animLoaded.scene
const mixer = new THREE.AnimationMixer( loadingMesh );
scene.add( loadingMesh );
const mask = loadingMesh.getObjectByName("Mask");
const Windows = loadingMesh.getObjectByName("Windows");
const fireliveScreen = loadingMesh.getObjectByName("Firelive");
Windows.visible = false;
Windows.frustumCulled = false;
const loading_anim = play_clip(animLoaded, mixer, "loading", false);

const textureLoader = new THREE.TextureLoader();

// Enter Text Label
const enterTextP = document.createElement("p");
enterTextP.textContent = "click to enter my portfolio";
enterTextP.id = "enter-text";
const enterTextLabel = new CSS2DObject(enterTextP);
scene.add(enterTextLabel);
enterTextLabel.position.set(0, -3, 2);

// Name Label
// newText("Jonas Amrouche", "name-text", 0, 0, -147, 0.01)
// newText("Developper", "dev-title-text", 0, -2, -149, 0.01)
// newText("Interactive Experience", "dev-title-text", 0, 2, -149, 0.01)

function newText(text, id, x, y, z, size){
  const p = document.createElement("p");
  p.textContent = text;
  p.id = id;
  const Label = new CSS2DObject(p);
  scene.add(Label);
  Label.position.set(x, y, z);
  Label.scale.set(size, size, size);
  Label.visible = true;
  return Label
}

// Create glowy quad-ring
const geometry = new THREE.RingGeometry( 2, 3, 4 );
const rectangleColor = new THREE.Color( 'rgba(255, 255, 255, 1)' );
const material = new THREE.MeshStandardMaterial( { color: 0xffffff, emissive: rectangleColor, emissiveIntensity: 1});
const torus = new THREE.Mesh(geometry, material);
torus.position.set(0, 0, -2)
scene.add(torus);

// Create animated wireframe tunel
const pageGridGeometry = new THREE.CylinderGeometry( 5, 5, 60, 50, 100, true);
const pageGridVertexShader = document.getElementById('tunnelVertexShader').textContent;
const pageGridFragmentShader = document.getElementById('tunnelFragmentShader').textContent;
const pageGridMaterial = new THREE.ShaderMaterial( {
  vertexShader:pageGridVertexShader,
  fragmentShader:pageGridFragmentShader,
  wireframe:true,
  uniforms : {
    uTime:0.0,
    uOpacity:0.0
  }});
const pageGrid = new THREE.Mesh(pageGridGeometry, pageGridMaterial);
pageGrid.position.set(0, 0, -130.0)
pageGrid.rotation.set(Math.PI/2.0, 0, 0)
scene.add(pageGrid);

// Setup sounds
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
camera.add( listener );

// Setup base ambient sound
const ambientSound = new THREE.Audio( listener );
audioLoader.load( '/note_b_loop.ogg', function( buffer ) {
  ambientSound.setBuffer( buffer );
  ambientSound.setLoop( true );
  ambientSound.setVolume( 0.0 );
});

// Setup loading sound
const loadingSound = new THREE.Audio( listener );
audioLoader.load( '/loading_loop.ogg', function( buffer ) {
  loadingSound.setBuffer( buffer );
  loadingSound.setLoop( true );
  loadingSound.setVolume( 2.0 );
  loadingSound.play();
});

// Setup intro sound
const introSound = new THREE.Audio( listener );
audioLoader.load( '/intro_sound.ogg', function( buffer ) {
  introSound.setBuffer( buffer );
  introSound.setLoop( false );
  introSound.setVolume( 1.0 );
});

// Pointless Point light
const pointLight = new THREE.PointLight(0xffffff, 100, 10);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);

// Create clock for animations
const clock = new THREE.Clock();

projectLights.push([projectLight("/flashreel.webm", 0, 0, 0), 100])

projectLights.push([projectLight("/firelive_screen1_blured.jpg", -20, 0, 0), 500])

projectLights.push([projectLight("/elumin_screen_blurred_1.png", 20, 0, 0), 500])

projectLights.push([projectLight("/firelive_screen1_blured.jpg", -20, 0, -20.3), 500])

projectLights.push([projectLight("/elumin_screen_blurred_1.png", 20, 0, 20.3), 500])

// Project lights
function projectLight(texture_path, x_pos, z_pos, x_target) {
  let texture;
  if (texture_path.split('.')[texture_path.split('.').length-1] == "webm"){
    // Create video and play
    const textureVid = document.createElement("video")
    textureVid.src = texture_path; // transform gif to mp4
    textureVid.loop = true;
    videosPlayers.push(textureVid);

    // Load video texture
    const videoTexture = new THREE.VideoTexture(textureVid);
    videoTexture.format = THREE.RGBFormat;
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.generateMipmaps = false;
    texture = videoTexture;
  }else{
    texture = textureLoader.load(texture_path);
  }
  const projectLight = new THREE.SpotLight(0xffffff, 0, 200, Math.PI/4, 1.0);
  scene.add(projectLight);
  projectLight.map = texture;
  projectLight.position.set(x_pos, z_pos, -170);
  projectLight.target.position.set(x_target, 0, -177);
  scene.add(projectLight.target);

  return projectLight
}

// function ambienceLight(color, dist, intensity, x, y, z){
//   const light = new THREE.PointLight(color, 0, dist);
//   scene.add(light);
//   light.position.set(x, y, z);
//   ambienceLights.push([light, intensity])
// }

// const ambienceLight1 = new THREE.PointLight(0xff0000, 10, 20);
// scene.add(ambienceLight1);
// ambienceLight1.position.set(-21, -0.2, -172);

// ambienceLight(0xffffff, 10, 7, 0, 2, -172)

// const ambienceLight2 = new THREE.PointLight(0xffffff, 10, 7);
// scene.add(ambienceLight2);
// ambienceLight2.position.set(0, 2, -172);
// const ambienceLight3 = new THREE.PointLight(0x00ddbb, 10, 10);
// scene.add(ambienceLight3);
// ambienceLight3.position.set(21, -0.2, -172);

const raycaster = new THREE.Raycaster();

const fireliveScreenMaterial = new THREE.MeshStandardMaterial( { map: textureLoader.load("/firelive_screen_emi.jpg"), emissive:0xffffff, emissiveMap: textureLoader.load("/hologram_hover.jpg"), emissiveIntensity:0.0, alphaMap: textureLoader.load("/hologram_alpha.jpg"), transparent:true, alphaTest:true } );
fireliveScreen.material = fireliveScreenMaterial;

document.getElementById("bg").addEventListener("mousemove", (event) => {
  const coords = new THREE.Vector2(event.clientX / renderer.domElement.clientWidth * 2 - 1, -(event.clientY / renderer.domElement.clientHeight * 2 - 1));
  raycaster.setFromCamera(coords, camera);
  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0){
    updateHover3D(intersections[0].object.name);
  }
 })

function updateHover3D(targetName){
  if (targetName === "Firelive"){
    fireliveScreen.material.emissiveIntensity = 1.0;
    document.body.style.cursor = "pointer";
  } else{
    fireliveScreen.material.emissiveIntensity = 0.0
    document.body.style.cursor = "default";

  }
}

// Dev only
let skipIntro = true;
if (skipIntro){
  camera.position.set(0, 0, -167);
  camera.fov = 50.0;
  camera.updateProjectionMatrix();
  play_clip(animLoaded, mixer, "floating", false)
  torus.visible = false;
  mask.visible = false;
  Windows.visible = true;

  for(var i=0; i<projectLights.length; i++){
    projectLights[i][0].intensity = projectLights[i][1];
  }

  // for(var i=0; i<ambienceLights.length; i++){
  //   ambienceLights[i][0].intensity = ambienceLights[i][1];
  // }

  var elements = document.querySelectorAll('.project-ui');
  for(var i=0; i<elements.length; i++){
    elements[i].style.opacity = "100%";
  }
  pageGrid.material.uniforms.uOpacity = {value : 1.0}
  introDone = true;
  document.querySelector('body').style.height = pageSize.toString() + "px";
  // window.scrollTo(0, pageSize/2 - window.innerHeight/2);
}

function animate() {
  requestAnimationFrame(animate);

  // Updates animations times
  mixer.update(clock.getDelta());
  pageGrid.material.uniforms.uTime = {value : clock.elapsedTime};

  updateScroll();

  triggerEnter();
  
  // Render scene
  flatRenderer.render(scene, camera);
  composer.render();
}

function updateScroll(){
  if (introDone){
    camera.position.set((scrollPercent-50), camera.position.y, camera.position.z);
  }
}

function play_clip(gltfLoad, mixer, clipName, oneShot) {
  const clips = gltfLoad.animations;
  const clip = THREE.AnimationClip.findByName( clips, clipName );
  const animation = mixer.clipAction( clip );
  animation.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat)
  animation.play();
  return animation
}

let introTriggered
function triggerEnter(){
  if (loading_anim.time < 0.1 && screenTouched && !introTriggered){
    screenTouched = false
    introTriggered = true
    enter()
  }
}

function enter(){
  if (skipIntro){ return; }

  introSound.play();
  loadingSound.stop();
    gsap.to(mixer, {
      timeScale: 5.575,
      duration: 6.0,
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
            torus.visible = false;
            mask.visible = false;
            Windows.visible = true;
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
                ambientSound.play();
                let soundObj = { value: 0 };
                gsap.to(soundObj, {
                  value: 2.0,
                  duration: 4.0,
                  ease: "expo.in",
                  onUpdate: () => {
                    ambientSound.setVolume(soundObj.value);
                  }
                });

                // let ambienceObj = { value: 0 };
                // gsap.to(ambienceObj, {
                //   value: 1.0,
                //   delay:3.0,
                //   duration: 5.0,
                //   ease: "expo.in",
                //   onUpdate: () => {
                //     for(var i=0; i<ambienceLights.length; i++){
                //       ambienceLights[i][0].intensity = ambienceLights[i][1] * ambienceObj.value;
                //     }
                //   }
                // });

                let projectorsObj = { value: 0 };
                gsap.to(projectorsObj, {
                  value: 1.0,
                  delay:4.0,
                  duration: 2,
                  ease: "power2.inOut",
                  onUpdate: () => {
                    for(var i=0; i<projectLights.length; i++){
                      projectLights[i][0].intensity = projectLights[i][1] * projectorsObj.value;
                    }
                  }
                });
                    
                gsap.to(pageGrid.material.uniforms.uOpacity, {
                  delay: 2.5,
                  value: 1.0,
                  duration: 2.0,
                  ease: "power2.out",
                });
                gsap.to(camera, {
                  delay: 2.5,
                  fov: 50.0,
                  duration: 1.0,
                  ease: "power2.out",
                  onUpdate: () => {
                    camera.updateProjectionMatrix();
                  },
                });
                gsap.to(camera.position, {
                  x: 0,
                  y: 0,
                  z: -167,
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
                    for(var i=0; i<videosPlayers.length; i++){
                      videosPlayers[i].play()
                    }
                    introDone = true;
                    play_clip(animLoaded, mixer, "floating", false)
                    document.querySelector('body').style.height = pageSize.toString() + "px";
                    window.scrollTo(0, pageSize/2 - window.innerHeight/2);
                  }
                });
              }
            });
          }
        });
      }
    });
}

window.addEventListener('resize', function(){
  updateSreenSize();
})

function updateSreenSize(){
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight)
  flatRenderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

const backContainer = document.getElementById('backContainer')

backContainer.addEventListener('click', () =>{
  closeProject()
})

document.getElementById("bg").addEventListener("click", () => {
  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections[0].object.name === "Firelive"){
    showProject("Firelive")
  }

  if (skipIntro){
    for(var i=0; i<videosPlayers.length; i++){
      videosPlayers[i].play()
    }
    return;
  }

  screenTouched = true
  enterTextLabel.visible = false
  ambientSound.play();
});

function showProject(projectName){
  console.log
  closeProject(projectShown)
  document.querySelector('body').style.overflow = "hidden";
  document.getElementById('bg').style.pointerEvents= "none";
  document.getElementById('backContainer').style.visibility = "visible";
  document.getElementById(projectName).style.visibility = "visible";
  document.getElementById(projectName).scrollTo(0, 0);
  projectShown = projectName;
  updateHover3D("");
}

function closeProject(){
  if (projectShown !== ""){
    document.querySelector('body').style.overflow = "auto";
    document.getElementById('bg').style.pointerEvents= "all";
    document.getElementById('backContainer').style.visibility = "hidden";
    document.getElementById(projectShown).style.visibility = "hidden";
    projectShown = "";
  }
}

document.getElementById("toggleSoundButton").addEventListener("click", () => {
  if (volumeMuted){
    ambientSound.setVolume(2.0)
    introSound.setVolume(1.0);
    document.getElementById("not-muted-icon").style.visibility = "visible";
    document.getElementById("muted-icon").style.visibility = "hidden";
  }else{
    ambientSound.setVolume(0.0);
    introSound.setVolume(0.0);
    document.getElementById("not-muted-icon").style.visibility = "hidden";
    document.getElementById("muted-icon").style.visibility = "visible";
  }
  volumeMuted = !volumeMuted;
});

document.getElementById("devInfoButton").addEventListener("click", () => {
  if (projectShown === "DevInfos"){
    closeProject();
  }else{
    showProject("DevInfos");
  }
});

document.body.onscroll = () => {
    scrollPercent = ((document.documentElement.scrollTop || document.body.scrollTop) / ((document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight)) * 100;
}

animate()