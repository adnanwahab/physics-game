import * as THREE from 'three';

/**
 * Expanding rings that pulse outward from a point, like sound waves.
 * @param {Object} options
 * @param {THREE.Vector3} [options.position] - Local offset for the ring origin
 * @param {number} [options.ringCount]
 * @param {number} [options.maxRadius]
 * @param {number} [options.speed] - Expansion speed in units per second
 * @param {number} [options.color]
 */
export function createSoundWaveRings({
  position = new THREE.Vector3(0, 0.01, 0),
  ringCount = 6,
  maxRadius = 4,
  speed = 1.2,
  color = 0x44ccff,
} = {}) {
  const group = new THREE.Group();
  group.position.copy(position);

  const cycleDuration = maxRadius / speed;
  const geometry = new THREE.RingGeometry(0.92, 1, 64);
  const rings = [];

  for (let i = 0; i < ringCount; i++) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    group.add(mesh);
    rings.push({
      mesh,
      offset: (i / ringCount) * cycleDuration,
    });
  }

  let elapsed = 0;

  function update(deltaTime) {
    elapsed += deltaTime;

    for (const ring of rings) {
      const progress = ((elapsed + ring.offset) % cycleDuration) / cycleDuration;
      const scale = Math.max(0.05, progress * maxRadius);
      ring.mesh.scale.set(scale, scale, 1);
      ring.mesh.material.opacity = 0.7 * (1 - progress);
    }
  }

  function dispose() {
    geometry.dispose();
    for (const ring of rings) {
      ring.mesh.material.dispose();
    }
    group.removeFromParent();
  }

  return { group, update, dispose };
}
