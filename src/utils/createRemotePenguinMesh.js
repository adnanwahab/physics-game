
import * as THREE from "three";
function createRemotePenguinMesh(color = 0x2299ff) {
    const geom = new THREE.SphereGeometry(0.6, 16, 12);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
}

export default createRemotePenguinMesh;