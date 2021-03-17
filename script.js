import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/build/three.module.js'
import { GUI } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/libs/dat.gui.module.js'

let pickedObj = null;
window.pickedObj = pickedObj

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 60;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 30;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');
  scene.updateMatrixWorld(true);

  // put the camera on a pole (parent it to an object)
  // so we can spin the pole to move the camera around the scene
  const cameraPole = new THREE.Object3D();
  scene.add(cameraPole);
  cameraPole.add(camera);

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    camera.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + (max - min) * Math.random();
  }

  function randomColor() {
    return `hsl(${rand(360) | 0}, ${rand(50, 100) | 0}%, 50%)`;
  }

  const numObjects = 100;
  for (let i = 0; i < numObjects; ++i) {
    const material = new THREE.MeshPhongMaterial({
      color: randomColor(),
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
    cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
    cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let clicked = false;

  class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
        this.pickedObject = undefined;
      }

      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
        // save its color
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        //setting up the object to be GUI'd
        return this.pickedObject
      }
    }
  }

  const pickPosition = {x: 0, y: 0};
  const pickHelper = new PickHelper();
  clearPickPosition();

  function render(time) {
    time *= 0.000;  // convert to seconds;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cameraPole.rotation.y = time * .1;

    if (clicked && !hoverGui) {
      var pickedObject = pickHelper.pick(pickPosition, scene, camera, time);
      updateGui( pickedObject );
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }

  function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
  }

  function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
  }

  // let pickedObj = null;
  let position = new THREE.Vector3()
  const gui = new GUI().addFolder("Position")
  gui.add(position, "x", -20.0, 20.0, 0.001).onChange( moveObject ).listen()
  gui.add(position, "y", -20.0, 20.0, 0.001).onChange( moveObject ).listen()
  gui.add(position, "z", -20.0, 20.0, 0.001).onChange( moveObject ).listen()
  gui.open()

  function updateGui( obj ) {
    if ( obj ) {
      if ( obj !== pickedObj ) { // we have clicked on a new object
        position.setFromMatrixPosition( obj.matrixWorld )
        pickedObj = obj
        window.pickedObj = pickedObj
        console.log( 'copy old position', position.x, position.y, position.z)
      }
    }
  }

  function moveObject() {
    if (pickedObj) pickedObj.position.set( position )
    window.pickedObj = pickedObj
    console.log('set new position', position.x, position.y, position.z)
  }

  // are we over the gui?
  let hoverGui = false;

  function mouseOverGui() {
    hoverGui = true
    // console.log('hovering over gui')
  }

  function mouseOutGui() {
    hoverGui = false
    // console.log('hovering over scene')
  }
  // we're over the gui if the mouse leaves the scene
  renderer.domElement.addEventListener('mouseout', mouseOverGui)
  renderer.domElement.addEventListener('mousedown', mouseOutGui)

  function mouseDown() {
    clicked = true;
  }
  function mouseUp() {
    clicked = false;
  }

  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);
  window.addEventListener('mousedown', mouseDown);
  window.addEventListener('mouseup', mouseUp);



  window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, {passive: false});

  window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
  });

  window.addEventListener('touchend', clearPickPosition);
}

main();
