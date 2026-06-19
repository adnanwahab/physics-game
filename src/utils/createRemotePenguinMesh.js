import * as THREE from 'three';

function createRemotePenguinMesh(color) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 28), new THREE.MeshStandardMaterial({ color }));

    const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 'white' }));
    face.position.set(0, 0.07, 0.26);
    mesh.add(face);

    const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 'black' });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.045, 0.11, 0.33);
    rightEye.position.set(0.045, 0.11, 0.33);
    mesh.add(leftEye, rightEye);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.10, 8), new THREE.MeshStandardMaterial({ color: '#ffc800' }));
    nose.position.set(0, 0.06, 0.40);
    nose.rotation.x = Math.PI / 2;
    mesh.add(nose);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export default createRemotePenguinMesh;
