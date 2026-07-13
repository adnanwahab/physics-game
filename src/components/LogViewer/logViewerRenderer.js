import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};

export default class LogDirectorEngine {
  constructor(container, myData, callbacks) {
    this.container = container;
    this.myData = myData;
    this.callbacks = callbacks; // { onTimeUpdate, onLineUpdate }

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.frameId = null;
    this.disposed = false;
    this.lastTimeStamp = performance.now();
    this.lastEntry = null;

    // Direct access mutable configurations to avoid React lag in requestAnimationFrame
    this.state = {
      isPlaying: true,
      currentTime: 0,
      speed: 1,
      mode: "auto",
      maxTime: 10,
    };

    this.participantMeshes = {};
    this.init();
  }

  async init() {
    this.renderer = new THREE.WebGPURenderer({ antialias: true });
    await this.renderer.init();
    if (this.disposed) return;

    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const initialCamPos = this.myData.camera?.position ?? [0, 1.6, 4];
    const initialLookAt = this.myData.camera?.lookAt ?? [0, 1, 0];
    this.camera.position.set(...initialCamPos);
    this.camera.lookAt(...initialLookAt);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(...initialLookAt);

    this.setupLighting();
    this.setupEnvironment();
    this.buildScene();

    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    this.resizeObserver.observe(this.container);

    this.animate();
  }

  setupLighting() {
    const { lighting } = this.myData.setting ?? {};
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(-3, 4, 2);
    if (lighting?.colorTemp) {
      keyLight.color = this.kelvinToColor(lighting.colorTemp);
    }
    this.scene.add(keyLight);
    this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
  }

  setupEnvironment() {
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  buildScene() {
    // 1. Build Participants
    (this.myData.participants ?? []).forEach((p, i) => {
      const geo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: p.role === "therapist" ? 0x5577aa : 0xaa7755,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i === 0 ? -1 : 1, 0.9, 0);
      mesh.name = p.id;
      this.scene.add(mesh);
      this.participantMeshes[p.id] = mesh;
    });

    // 2. Build Static level objects
    (this.myData.objects ?? []).forEach((obj) => {
      const mesh = this.createPlaceholder(obj.type, obj.size);
      if (obj.position) mesh.position.set(...obj.position);
      if (obj.rotation) {
        mesh.rotation.set(
          THREE.MathUtils.degToRad(obj.rotation[0] || 0),
          THREE.MathUtils.degToRad(obj.rotation[1] || 0),
          THREE.MathUtils.degToRad(obj.rotation[2] || 0),
        );
      }
      this.scene.add(mesh);
    });
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
  }

  applyShot(entry) {
    const preset =
      SHOT_PRESETS[entry.camera?.shot] ?? SHOT_PRESETS.medium_two_shot;
    const focusMesh = this.participantMeshes[entry.camera?.focus];
    const focusPos = focusMesh
      ? focusMesh.position
      : new THREE.Vector3(0, 0.9, 0);

    this.camera.fov = preset.fov;
    this.camera.position.set(focusPos.x, preset.height, preset.distance);
    this.controls.target.copy(focusPos);
    this.camera.lookAt(focusPos.x, focusPos.y, focusPos.z);
    this.camera.updateProjectionMatrix();
  }

  jumpToCamera(position, target) {
    this.camera.position.fromArray(position);
    this.controls.target.fromArray(target);
    this.camera.updateProjectionMatrix();
  }

  animate = () => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = (now - this.lastTimeStamp) / 1000;
    this.lastTimeStamp = now;

    if (this.state.isPlaying) {
      let nextTime = this.state.currentTime + delta * this.state.speed;
      if (nextTime > this.state.maxTime) nextTime = 0; // Loop timeline
      this.state.currentTime = nextTime;
      this.callbacks.onTimeUpdate(nextTime);
    }

    // Process Timeline cuts
    const timeline = this.myData.timeline ?? [];
    const active = [...timeline]
      .reverse()
      .find((e) => e.t <= this.state.currentTime);

    if (active && active !== this.lastEntry) {
      this.lastEntry = active;
      this.callbacks.onLineUpdate(active);
      if (this.state.mode === "auto") {
        this.applyShot(active);
      }
    }

    if (this.state.mode === "orbit" && this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.renderAsync(this.scene, this.camera).catch((err) => {
        console.error("Render failure:", err);
      });
    }
  };

  createPlaceholder(type, size = [1, 1, 1]) {
    let geometry = new THREE.BoxGeometry(...size);
    let material;
    switch (type) {
      case "desk":
        material = new THREE.MeshStandardMaterial({
          color: 0x2a3038,
          roughness: 0.6,
          metalness: 0.2,
        });
        break;
      case "monitor":
        material = new THREE.MeshStandardMaterial({ color: 0x111316 });
        break;
      case "screen":
        material = new THREE.MeshBasicMaterial({ color: 0x22c7ff });
        break;
      case "chair":
        material = new THREE.MeshStandardMaterial({
          color: 0x4a5568,
          roughness: 0.6,
          metalness: 0.15,
        });
        break;
      case "person_body":
        material = new THREE.MeshStandardMaterial({ color: 0x3a5a8c });
        break;
      case "head":
        geometry = new THREE.SphereGeometry(size[0], 12, 12);
        material = new THREE.MeshStandardMaterial({ color: 0xd8a878 });
        break;
      case "flag":
        material = new THREE.MeshStandardMaterial({ color: 0xb22234 });
        break;
      case "panel":
        material = new THREE.MeshStandardMaterial({ color: 0x161a20 });
        break;
      case "light":
        material = new THREE.MeshBasicMaterial({ color: 0xcfe8ff });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }
    return new THREE.Mesh(geometry, material);
  }

  kelvinToColor(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;
    if (temp <= 66) {
      r = 255;
      g = 99.47 * Math.log(temp) - 161.12;
    } else {
      r = 329.7 * Math.pow(temp - 60, -0.13);
      g = 288.12 * Math.pow(temp - 60, -0.0755);
    }
    b =
      temp >= 66 ? 255 : temp <= 19 ? 0 : 138.52 * Math.log(temp - 10) - 305.04;
    return new THREE.Color(
      THREE.MathUtils.clamp(r, 0, 255) / 255,
      THREE.MathUtils.clamp(g, 0, 255) / 255,
      THREE.MathUtils.clamp(b, 0, 255) / 255,
    );
  }

  destroy() {
    this.disposed = true;
    if (this.resizeObserver) this.resizeObserver.disconnect();
    cancelAnimationFrame(this.frameId);
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}

// Placeholder mesh factory for static level geometry (e.g. mission_control.json's "objects" array)
// function createPlaceholder(type, size = [1, 1, 1]) {
//   let geometry;
//   let material;
//   const [w, h, d] = size;

//   switch (type) {
//     case "desk":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({
//         color: 0x2a3038,
//         roughness: 0.6,
//         metalness: 0.2,
//       });
//       break;
//     case "monitor":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({ color: 0x111316 });
//       break;
//     case "screen":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshBasicMaterial({ color: 0x22c7ff });
//       break;
//     case "chair":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({
//         color: 0x4a5568,
//         roughness: 0.6,
//         metalness: 0.15,
//       });
//       break;
//     case "person_body":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({ color: 0x3a5a8c });
//       break;
//     case "head":
//       geometry = new THREE.SphereGeometry(w, 12, 12); // size[0] doubles as radius
//       material = new THREE.MeshStandardMaterial({ color: 0xd8a878 });
//       break;
//     case "flag":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({ color: 0xb22234 });
//       break;
//     case "panel":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({ color: 0x161a20 });
//       break;
//     case "light":
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshBasicMaterial({ color: 0xcfe8ff });
//       break;
//     default:
//       geometry = new THREE.BoxGeometry(w, h, d);
//       material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
//   }

//   return new THREE.Mesh(geometry, material);
// }
