import { OBJLoader } from 'three/addons/loaders/OBJLoader';

export function loadOBJModel(path) {
    return new Promise((resolve, reject) => {
        const loader = new OBJLoader();
        loader.load(path, resolve, undefined, reject);
    });
}
