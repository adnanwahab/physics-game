import { createFloor } from './utils/createFloor.js';
import { createBox } from './utils/createBox.js';
import { addToScene } from './utils/addToScene.js';
import { getThreeObjectForBody } from './utils/getThreeObjectForBody.js';
import { createPenguin } from './utils/createPenguin.js';
import * as THREE from 'three';
/**
 * Sets up your environment and character logic. Creates floors, walls, 
 * a simple "character" body, etc. Also provides the onExampleUpdate() function 
 * that drives character motion each frame.
 * 
 * @param {Object} Jolt - Your Jolt WASM object
 * @param {Object} bodyInterface - The result from initPhysics()
 * @param {THREE.Scene} scene 
 * @param {Array} dynamicObjects - Array to push newly created objects
 * @param {Function} onExampleUpdateRef - An empty object with { fn: null } so we can assign .fn 
 * @param {string} levelID - The ID of the current level
 */
export function setupExample(Jolt, bodyInterface, scene, dynamicObjects, onExampleUpdateRef, levelID) {
  console.log('Setting up level with ID:', levelID);
  
  // For collision layers
  const LAYER_NON_MOVING = 0;
  const LAYER_MOVING = 1;



  const floorMat = new THREE.MeshStandardMaterial( {
    roughness: 0.8,
    color: 0xffffff,
    metalness: 0.2,
    bumpScale: 1
  } );
  const textureLoader = new THREE.TextureLoader();
  
  // Load diffuse texture
  textureLoader.load( 
    '/textures/floor/hardwood2_diffuse.jpg', 
    function ( map ) {
      console.log('Diffuse texture loaded:', map);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set( 10, 24 );
      map.colorSpace = THREE.SRGBColorSpace;
      floorMat.map = map;
      floorMat.needsUpdate = true;
    },
    undefined, // onProgress
    function ( error ) {
      console.error('Error loading diffuse texture:', error);
    }
  );
  
  // Load bump texture
  textureLoader.load( 
    '/textures/floor/hardwood2_bump.jpg', 
    function ( map ) {
      console.log('Bump texture loaded:', map);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set( 10, 24 );
      floorMat.bumpMap = map;
      floorMat.needsUpdate = true;
    },
    undefined, // onProgress
    function ( error ) {
      console.error('Error loading bump texture:', error);
    }
  );
  
  // Load roughness texture
  textureLoader.load( 
    '/textures/floor/hardwood2_roughness.jpg', 
    function ( map ) {
      console.log('Roughness texture loaded:', map);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set( 10, 24 );
      floorMat.roughnessMap = map;
      floorMat.needsUpdate = true;
    },
    undefined, // onProgress
    function ( error ) {
      console.error('Error loading roughness texture:', error);
    }
  );

  // 1) Basic floor
  createFloor(Jolt, bodyInterface, (body) => {
    addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody, floorMat);
  }, 50);

  // 2) Simple walls
  const halfExtendWall = new Jolt.Vec3(0.5, 2, 45);
  const rotationIdentity = Jolt.Quat.prototype.sIdentity();
  createBox(
    Jolt,
    bodyInterface,
    (body) => addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody),
    new Jolt.RVec3(-45, 1, 0),
    rotationIdentity,
    halfExtendWall,
    Jolt.EMotionType_Static,
    LAYER_NON_MOVING,

  );
  createBox(
    Jolt,
    bodyInterface,
    (body) => addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody),
    new Jolt.RVec3(45, 1, 0),
    rotationIdentity,
    halfExtendWall,
    Jolt.EMotionType_Static,
    LAYER_NON_MOVING,

  );

  // 3) Simple character - Penguin!
  //    Create a dynamic box for physics, then replace the visual with a penguin
  const halfExtentChar = new Jolt.Vec3(0.5, 0.75, 0.5);
  const charBody = createBox(
    Jolt,
    bodyInterface,
    (body) => {
      const charThreeObject = addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody);
      
      // Replace the green cube with a penguin
      const penguin = createPenguin(1.0);
      
      // Copy position and rotation from the original cube
      penguin.position.copy(charThreeObject.position);
      penguin.quaternion.copy(charThreeObject.quaternion);
      
      // Transfer the body reference to the penguin group
      penguin.userData.body = charThreeObject.userData.body;
      
      // Remove the old cube from scene and dynamicObjects
      scene.remove(charThreeObject);
      const index = dynamicObjects.indexOf(charThreeObject);
      if (index > -1) {
        dynamicObjects[index] = penguin;
      }
      
      // Add the penguin to the scene
      scene.add(penguin);
    },
    new Jolt.RVec3(0, 5, 0),
    rotationIdentity,
    halfExtentChar,
    Jolt.EMotionType_Dynamic,
    LAYER_MOVING,

  );

  // 4) A reference to the update function:
  onExampleUpdateRef.fn = (time, deltaTime, inputState) => {
    // Get the body ID once at the start
    const bodyID = charBody.GetID();

    if (inputState.forwardPressed) {
      const currentPos = bodyInterface.GetPosition(bodyID);
      currentPos.SetZ(currentPos.GetZ() - 0.1);
      bodyInterface.SetPosition(bodyID, currentPos);
    }
    if (inputState.backwardPressed) {
      const currentPos = bodyInterface.GetPosition(bodyID);
      currentPos.SetZ(currentPos.GetZ() + 0.1);
      bodyInterface.SetPosition(bodyID, currentPos);
    }

    if (inputState.leftPressed) {
      const currentPos = bodyInterface.GetPosition(bodyID);
      currentPos.SetX(currentPos.GetX() - 0.1);
      bodyInterface.SetPosition(bodyID, currentPos);
    }

    if (inputState.rightPressed) {
      const currentPos = bodyInterface.GetPosition(bodyID);
      currentPos.SetX(currentPos.GetX() + 0.1);
      bodyInterface.SetPosition(bodyID, currentPos);
    }

    if (inputState.jumpPressed) {
      const currentPos = bodyInterface.GetPosition(bodyID);
      currentPos.SetY(currentPos.GetY() + 0.1);
      bodyInterface.SetPosition(bodyID, currentPos);
    }

  };

  return charBody;
} 