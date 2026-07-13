import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Hardcoded fallback presets since they weren't fully defined in the UI
const SHOT_PRESETS = {
  wide: { fov: 45, height: 3, distance: 7 },
  close_up: { fov: 30, height: 1.5, distance: 3 },
  medium_two_shot: { fov: 40, height: 2, distance: 5 },
};

function kelvinToColor(kelvin) {
  const temp = kelvin / 100;
  let r, g, b;
  if (temp <= 66) {
    r = 255;
    g = 99.47 * Math.log(temp) - 161.12;
  } else {
    r = 329.7 * Math.pow(temp - 60, -0.13);
    g = 288.12 * Math.pow(temp - 60, -0.0755);
  }
  b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.52 * Math.log(temp - 10) - 305.04;
  return new THREE.Color(
    THREE.MathUtils.clamp(r, 0, 255) / 255,
    THREE.MathUtils.clamp(g, 0, 255) / 255,
    THREE.MathUtils.clamp(b, 0, 255) / 255,
  );
}

export default class ViewerEngine {
  constructor(canvasRef, dalaranObj, options = {}) {
    this.myData = options.myData;
    this.maxTime = options.maxTime || 10;
    this.onTimeUpdate = options.onTimeUpdate || (() => {});

    // State mirroring values that update frame-by-frame
    this.state = {
      isPlaying: true,
      currentTime: 0,
      speed: 1,
      mode: "auto",
    };

    this.participantMeshes = {};
    this.disposed = false;
    this.lastTimeStamp = performance.now();
    this.lastEntry = null;
    this.init(canvasRef, dalaranObj, options.myData);
  }

  async init(canvasRef, dalaranObj, myData) {
    this.renderer = new THREE.WebGPURenderer({ canvas: canvasRef });
    //await renderer.init();
    console.log(myData, "hi");
    if (this.disposed || !canvasRef) return;

    const width = 500;
    const height = 500;
    //this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    const initialCamPos = this.myData.camera?.position ?? [0, 1.6, 4];
    const initialLookAt = this.myData.camera?.lookAt ?? [0, 1, 0];

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(...initialCamPos);
    this.camera.lookAt(...initialLookAt);

    // this.controls = new OrbitControls(this.camera, canvasRef);
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.05;
    // this.controls.target.set(...initialLookAt);

    // Setup Lighting
    const { lighting } = this.myData.setting ?? {};
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(-3, 4, 2);
    if (lighting?.colorTemp) keyLight.color = kelvinToColor(lighting.colorTemp);
    this.scene.add(keyLight);
    this.scene.add(new THREE.AmbientLight(0x404040, 0.6));

    // Floor Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
    this.cube = new THREE.Mesh(cubeGeo, cubeMat);
    this.cube.position.set(0, 0.5, 0);
    this.scene.add(this.cube);
    this.renderer.init();

    this.renderer.render(this.scene, this.camera);

    // (
    //     // Setup Participants
    //     this.myData.participants ?? [],
    //   )
    //   .forEach((p, i) => {
    //     const geo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    //     const mat = new THREE.MeshStandardMaterial({
    //       color: p.role === "therapist" ? 0x5577aa : 0xaa7755,
    //     });
    //     const mesh = new THREE.Mesh(geo, mat);
    //     mesh.position.set(i === 0 ? -1 : 1, 0.9, 0);
    //     mesh.name = p.id;
    //     this.scene.add(mesh);
    //     this.participantMeshes[p.id] = mesh;
    //   });

    // Handle Resize
    // this.resizeObserver = new ResizeObserver((entries) => {
    //   const { width, height } = entries[0].contentRect;
    //   if (width === 0 || height === 0) return;
    //   this.camera.aspect = width / height;
    //   this.camera.updateProjectionMatrix();
    //   this.renderer.setSize(width, height);
    // });
    // this.resizeObserver.observe(this.mount);

    // Start Loop
    //this.animate();
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

  animate = () => {
    if (this.disposed) return;

    const now = performance.now();
    const delta = (now - this.lastTimeStamp) / 1000;
    this.lastTimeStamp = now;

    if (this.state.isPlaying) {
      let nextTime = this.state.currentTime + delta * this.state.speed;
      if (nextTime > this.maxTime) nextTime = 0;
      this.state.currentTime = nextTime;
    }

    const timeline = this.myData.timeline ?? [];
    const active = [...timeline]
      .reverse()
      .find((e) => e.t <= this.state.currentTime);

    if (active && active !== this.lastEntry) {
      this.lastEntry = active;
      if (this.state.mode === "auto") {
        this.applyShot(active);
      }
    }

    // Direct callback loop to tell React UI to sync its rendering variables
    this.onTimeUpdate(this.state.currentTime, active);

    if (this.state.mode === "orbit") {
      this.controls.update();
    }

    this.renderer
      .renderAsync(this.scene, this.camera)
      .catch((err) => console.error("render error:", err));

    this.frameId = requestAnimationFrame(this.animate);
  };

  getCurrentCameraConfig() {
    return {
      position: this.camera.position.clone().toArray(),
      target: this.controls
        ? this.controls.target.clone().toArray()
        : [0, 1, 0],
    };
  }

  jumpToCameraConfig(camPosition, camTarget) {
    this.camera.position.fromArray(camPosition);
    this.controls.target.fromArray(camTarget);
    this.camera.updateProjectionMatrix();
  }

  takeScreenshot(logName) {
    const canvas = this.mount?.querySelector("canvas");
    if (!canvas) return console.error("Canvas element not found.");
    try {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `logview_${logName || "capture"}_${this.state.currentTime.toFixed(2)}s.png`;
      link.href = imgData;
      link.click();
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  }

  dispose() {
    this.disposed = true;
    if (this.resizeObserver) this.resizeObserver.disconnect();
    cancelAnimationFrame(this.frameId);
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      //this.renderer.dispose();
    }
  }
}
