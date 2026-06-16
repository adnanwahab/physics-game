import * as THREE from 'three';

/**
 * Creates a penguin group using Three.js primitives
 * @param {number} scale - Scale factor for the penguin (default: 1)
 * @returns {THREE.Group} - A group containing all penguin parts
 */
export function createPenguin(scale = 1) {
  const penguin = new THREE.Group();

  // Materials
  const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
  const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const orangeMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c42 });
  const yellowMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });

  // Body (main torso - ellipsoid using scaled sphere)
  // This code does not cause a 404 error. 
  // If you are seeing a '404 Not Found' error in your devtools (see image), 
  // it is usually caused by a missing file (e.g., an image, script, or resource your app tries to load).
  // This code is fine for defining and adding the penguin's body:
  const bodyGeometry = new THREE.SphereGeometry(0.4 * scale, 16, 16);
  bodyGeometry.scale(1, 1.2, 0.8); // Make it more penguin-shaped
  const body = new THREE.Mesh(bodyGeometry, blackMaterial);
  body.position.y = 0.3 * scale;
  penguin.add(body);

  // White belly (front part)
  const bellyGeometry = new THREE.SphereGeometry(0.35 * scale, 16, 16);
  bellyGeometry.scale(1, 1.1, 0.6);
  const belly = new THREE.Mesh(bellyGeometry, whiteMaterial);
  belly.position.set(0, 0.3 * scale, 0.25 * scale);
  penguin.add(belly);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.3 * scale, 16, 16);
  const head = new THREE.Mesh(headGeometry, blackMaterial);
  head.position.set(0, 0.9 * scale, 0.1 * scale);
  penguin.add(head);

  // White face patch
  const faceGeometry = new THREE.SphereGeometry(0.25 * scale, 16, 16);
  const face = new THREE.Mesh(faceGeometry, whiteMaterial);
  face.position.set(0, 0.9 * scale, 0.2 * scale);
  penguin.add(face);

  // Beak
  const beakGeometry = new THREE.ConeGeometry(0.08 * scale, 0.15 * scale, 8);
  const beak = new THREE.Mesh(beakGeometry, orangeMaterial);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.85 * scale, 0.35 * scale);
  penguin.add(beak);

  // Left wing
  const wingGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.5 * scale, 8);
  const leftWing = new THREE.Mesh(wingGeometry, blackMaterial);
  leftWing.rotation.z = Math.PI / 2;
  leftWing.rotation.y = -Math.PI / 6;
  leftWing.position.set(-0.5 * scale, 0.4 * scale, 0);
  penguin.add(leftWing);

  // Right wing
  const rightWing = new THREE.Mesh(wingGeometry, blackMaterial);
  rightWing.rotation.z = -Math.PI / 2;
  rightWing.rotation.y = Math.PI / 6;
  rightWing.position.set(0.5 * scale, 0.4 * scale, 0);
  penguin.add(rightWing);

  // Left foot
  const footGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.12 * scale, 0.15 * scale, 8);
  const leftFoot = new THREE.Mesh(footGeometry, orangeMaterial);
  leftFoot.rotation.x = Math.PI / 2;
  leftFoot.position.set(-0.15 * scale, -0.1 * scale, 0.1 * scale);
  penguin.add(leftFoot);

  // Right foot
  const rightFoot = new THREE.Mesh(footGeometry, orangeMaterial);
  rightFoot.rotation.x = Math.PI / 2;
  rightFoot.position.set(0.15 * scale, -0.1 * scale, 0.1 * scale);
  penguin.add(rightFoot);

  // Left eye
  const eyeGeometry = new THREE.SphereGeometry(0.05 * scale, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeometry, blackMaterial);
  leftEye.position.set(-0.1 * scale, 0.95 * scale, 0.25 * scale);
  penguin.add(leftEye);

  // Right eye
  const rightEye = new THREE.Mesh(eyeGeometry, blackMaterial);
  rightEye.position.set(0.1 * scale, 0.95 * scale, 0.25 * scale);
  penguin.add(rightEye);

  // Enable shadows
  penguin.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return penguin;
}

