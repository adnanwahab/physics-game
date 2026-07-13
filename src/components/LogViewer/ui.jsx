import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // Standard Three.js addon import
import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, Outlet } from "react-router-dom";

export default UI;
const levelModules = import.meta.glob("/src/logs/*.json", { eager: true });

// Kelvin Color Parser Utility unchanged
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
function UI() {
  let { log_id } = useParams();
  const navigate = useNavigate();

  const pathSegments = window.location.pathname.split("/");
  const logName = pathSegments[pathSegments.length - 1] || "onyxia";

  // States
  const [myData, setMyData] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [debugTarget, setDebugTarget] = useState(null);

  // Playback & Edit UI States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState("auto"); // "auto" or "orbit"
  const [annotations, setAnnotations] = useState([]);
  const [noteText, setNoteText] = useState("");

  // Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const targetsRef = useRef([]);
  const controlsRef = useRef(null);

  // Sync playback refs to prevent React lifecycle race conditions in the animation loop
  const playbackStateRef = useRef({
    isPlaying: true,
    currentTime: 0,
    speed: 1,
    mode: "auto",
  });

  useEffect(() => {
    playbackStateRef.current = {
      isPlaying,
      currentTime,
      speed: playbackSpeed,
      mode: cameraMode,
    };
  }, [isPlaying, currentTime, playbackSpeed, cameraMode]);

  // useEffect(() => {
  //   const mount = mountRef.current;
  //   if (!mount) return;

  //   const renderer = new THREE.WebGPURenderer({ antialias: true });
  //   mount.appendChild(renderer.domElement);
  //   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  //   renderer.setSize(mount.clientWidth, mount.clientHeight);
  //   renderer.toneMapping = THREE.ACESFilmicToneMapping;
  //   renderer.toneMappingExposure = 1.15;

  //   const scene = new THREE.Scene();
  //   //scene.fog = new THREE.FogExp2(FOG_COLOR, 0.016);
  //   console.log("OBJ LOADER NEXT");

  //   // objLoader.load(
  //   //   dalaranUrl,
  //   //   function (obj) {
  //   //     console.log(obj);
  //   //     obj.traverse((child) => {
  //   //       if (child.isMesh)
  //   //         child.material = new THREE.MeshStandardMaterial({
  //   //           color: 0x888888,
  //   //         });
  //   //     });
  //   //     scene.add(obj);
  //   //   },
  //   //   undefined,
  //   //   (err) => console.error(err),
  //   // );

  //   const camera = new THREE.PerspectiveCamera(
  //     55,
  //     mount.clientWidth / mount.clientHeight,
  //     0.1,
  //     500,
  //   );

  //   // ————— Sky: directional gradient, purple upper-left → warm glow right
  //   const skyMat = new THREE.ShaderMaterial(
  //     {
  //       side: THREE.BackSide,
  //       depthWrite: false,
  //       fog: false,
  //       uniforms: {
  //         topColor: { value: new THREE.Color(0x6f6494) }, // dusk purple
  //         midColor: { value: new THREE.Color(0xb98a95) }, // pink haze
  //         botColor: { value: new THREE.Color(0xd9a37e) }, // horizon amber
  //         sunColor: { value: new THREE.Color(0xffe3b0) },
  //         sunDir: { value: new THREE.Vector3(0.75, 0.22, -0.35).normalize() },
  //       },
  //       vertexShader: `
  //       varying vec3 vDir;
  //       void main() {
  //         vDir = normalize(position);
  //         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //       }
  //     `,
  //       fragmentShader: `
  //       varying vec3 vDir;
  //       uniform vec3 topColor, midColor, botColor, sunColor, sunDir;
  //       void main() {
  //         float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
  //         vec3 col = mix(botColor, midColor, smoothstep(0.35, 0.55, h));
  //         col = mix(col, topColor, smoothstep(0.55, 0.95, h));
  //         float sun = pow(max(dot(vDir, sunDir), 0.0), 5.0);
  //         float core = pow(max(dot(vDir, sunDir), 0.0), 60.0);
  //         col += sunColor * sun * 0.55 + vec3(1.0, 0.93, 0.8) * core * 1.4;
  //         gl_FragColor = vec4(col, 1.0);
  //       }
  //     `,
  //     },
  //     [],
  //   );
  //   scene.add(new THREE.Mesh(new THREE.SphereGeometry(240, 32, 24), skyMat));

  //   // ————— Lights: warm key from the sun side, cool violet fill
  //   const sun = new THREE.DirectionalLight(0xffd9a3, 2.1);
  //   sun.position.set(60, 25, -28);
  //   scene.add(sun);
  //   scene.add(new THREE.HemisphereLight(0x8a7bb0, 0x5c4636, 0.55));
  //   const bounce = new THREE.DirectionalLight(0x9b7ec4, 0.35);
  //   bounce.position.set(-40, 10, 30);
  //   scene.add(bounce);

  //   // ————— Materials
  //   const stone = new THREE.MeshStandardMaterial({
  //     color: SAND,
  //     roughness: 0.95,
  //     metalness: 0.0,
  //     flatShading: true,
  //   });
  //   const stoneLit = new THREE.MeshStandardMaterial({
  //     color: SAND_LIT,
  //     roughness: 0.9,
  //     metalness: 0.0,
  //     flatShading: true,
  //   });

  //   // Roughen a geometry so towers read as weathered rock, not lathe work
  //   function crumble(geo, amount) {
  //     const pos = geo.attributes.position;
  //     const v = new THREE.Vector3();
  //     for (let i = 0; i < pos.count; i++) {
  //       v.fromBufferAttribute(pos, i);
  //       const n =
  //         Math.sin(v.x * 2.1 + v.y * 0.9) * Math.cos(v.z * 1.7 + v.y * 0.5);
  //       pos.setXYZ(i, v.x + n * amount, v.y, v.z + n * amount * 0.8);
  //     }
  //     geo.computeVertexNormals();
  //     return geo;
  //   }

  //   // A tapered, weathered tower topped with a spire
  //   function tower({ h = 20, r = 2.2, spire = 6, mat = stone, rough = 0.25 }) {
  //     const g = new THREE.Group();
  //     const body = new THREE.Mesh(
  //       crumble(new THREE.CylinderGeometry(r * 0.55, r, h, 10, 8), rough),
  //       mat,
  //     );
  //     body.position.y = h / 2;
  //     g.add(body);
  //     if (spire > 0) {
  //       const tip = new THREE.Mesh(
  //         crumble(new THREE.ConeGeometry(r * 0.6, spire, 9, 4), rough * 0.5),
  //         mat,
  //       );
  //       tip.position.y = h + spire / 2 - 0.2;
  //       g.add(tip);
  //     }
  //     return g;
  //   }

  //   const city = new THREE.Group();
  //   scene.add(city);

  //   // Left: craggy twin-peaked mass
  //   const leftA = tower({ h: 26, r: 3.4, spire: 7, rough: 0.5 });
  //   leftA.position.set(-16, 0, 2);
  //   const leftB = tower({ h: 18, r: 2.6, spire: 5, rough: 0.55 });
  //   leftB.position.set(-13, 0, 6);
  //   city.add(leftA, leftB);

  //   // Center: great dome with a small turret, backed by the tallest spire
  //   const domeBase = new THREE.Mesh(
  //     crumble(new THREE.CylinderGeometry(7.5, 8.5, 9, 14, 4), 0.2),
  //     stone,
  //   );
  //   domeBase.position.set(0, 4.5, 0);
  //   const dome = new THREE.Mesh(
  //     crumble(
  //       new THREE.SphereGeometry(7.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  //       0.12,
  //     ),
  //     stoneLit,
  //   );
  //   dome.position.set(0, 9, 0);
  //   const domeTurret = tower({
  //     h: 4.5,
  //     r: 1.0,
  //     spire: 4,
  //     mat: stoneLit,
  //     rough: 0.1,
  //   });
  //   domeTurret.position.set(-2.5, 13.5, 1);
  //   const grandSpire = tower({ h: 30, r: 2.4, spire: 10, rough: 0.35 });
  //   grandSpire.position.set(3.5, 0, -3);
  //   city.add(domeBase, dome, domeTurret, grandSpire);

  //   // Right: slender minaret, then the huge sunlit mass near the glow
  //   const minaret = tower({
  //     h: 21,
  //     r: 1.3,
  //     spire: 6,
  //     mat: stoneLit,
  //     rough: 0.18,
  //   });
  //   minaret.position.set(15, 0, -1);
  //   const sunMass = tower({
  //     h: 24,
  //     r: 5.5,
  //     spire: 5,
  //     mat: stoneLit,
  //     rough: 0.6,
  //   });
  //   sunMass.position.set(25, 0, -6);
  //   const sunMassB = tower({
  //     h: 14,
  //     r: 3.2,
  //     spire: 0,
  //     mat: stoneLit,
  //     rough: 0.6,
  //   });
  //   sunMassB.position.set(28, 0, 0);
  //   city.add(minaret, sunMass, sunMassB);

  //   // Low connective rubble so the skyline reads as one city
  //   for (let i = 0; i < 9; i++) {
  //     const b = new THREE.Mesh(
  //       crumble(
  //         new THREE.CylinderGeometry(
  //           1.5 + Math.random() * 2,
  //           2.5 + Math.random() * 2,
  //           4 + Math.random() * 4,
  //           8,
  //           3,
  //         ),
  //         0.4,
  //       ),
  //       stone,
  //     );
  //     b.position.set(
  //       -20 + i * 5.5 + (Math.random() - 0.5) * 3,
  //       1.5,
  //       4 + (Math.random() - 0.5) * 6,
  //     );
  //     city.add(b);
  //   }

  //   // Ground fading into fog
  //   const ground = new THREE.Mesh(
  //     new THREE.CylinderGeometry(90, 90, 1, 40),
  //     new THREE.MeshStandardMaterial({ color: 0x8a6b52, roughness: 1 }),
  //   );
  //   ground.position.y = -0.5;
  //   scene.add(ground);

  //   // Drifting haze layers for the soft-focus feel
  //   const hazeMat = new THREE.MeshBasicMaterial({
  //     color: 0xe8b9a0,
  //     transparent: true,
  //     opacity: 0.1,
  //     depthWrite: false,
  //     fog: false,
  //   });
  //   const hazes = [];
  //   for (let i = 0; i < 5; i++) {
  //     const p = new THREE.Mesh(new THREE.PlaneGeometry(120, 45), hazeMat);
  //     p.position.set((Math.random() - 0.5) * 40, 8 + i * 5, 18 + i * 7);
  //     hazes.push(p);
  //     scene.add(p);
  //   }

  //   // ————— Custom orbit (OrbitControls isn't available in r128 here)
  //   const target = new THREE.Vector3(2, 12, 0);
  //   let theta = Math.PI * 0.52; // start looking from the front-low angle of the still
  //   let phi = Math.PI * 0.44;
  //   let radius = 46;
  //   let dragging = false;
  //   let lastX = 0,
  //     lastY = 0;
  //   let idle = 0;

  //   function updateCamera() {
  //     const sp = Math.sin(phi),
  //       cp = Math.cos(phi);
  //     camera.position.set(
  //       target.x + radius * sp * Math.cos(theta),
  //       target.y + radius * cp,
  //       target.z + radius * sp * Math.sin(theta),
  //     );
  //     camera.lookAt(target);
  //     hazes.forEach((h) => h.lookAt(camera.position));
  //   }

  //   const onDown = (e) => {
  //     dragging = true;
  //     lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  //     lastY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  //   };
  //   const onMove = (e) => {
  //     if (!dragging) return;
  //     const x = e.clientX ?? e.touches?.[0]?.clientX ?? lastX;
  //     const y = e.clientY ?? e.touches?.[0]?.clientY ?? lastY;
  //     theta += (x - lastX) * 0.005;
  //     phi = Math.min(
  //       Math.PI * 0.52,
  //       Math.max(Math.PI * 0.2, phi + (y - lastY) * 0.004),
  //     );
  //     lastX = x;
  //     lastY = y;
  //     idle = 0;
  //   };
  //   const onUp = () => (dragging = false);
  //   const onWheel = (e) => {
  //     e.preventDefault();
  //     radius = Math.min(90, Math.max(22, radius + e.deltaY * 0.04));
  //     idle = 0;
  //   };

  //   const el = renderer.domElement;
  //   el.style.cursor = "grab";
  //   el.addEventListener("pointerdown", onDown);
  //   window.addEventListener("pointermove", onMove);
  //   window.addEventListener("pointerup", onUp);
  //   el.addEventListener("wheel", onWheel, { passive: false });

  //   const onResize = () => {
  //     camera.aspect = mount.clientWidth / mount.clientHeight;
  //     camera.updateProjectionMatrix();
  //     renderer.setSize(mount.clientWidth, mount.clientHeight);
  //   };
  //   window.addEventListener("resize", onResize);

  //   // ————— Loop
  //   let raf;
  //   const clock = new THREE.Clock();
  //   function animate() {
  //     raf = requestAnimationFrame(animate);
  //     const dt = clock.getDelta();
  //     idle += dt;
  //     if (!dragging && idle > 2.5) theta += dt * 0.045; // gentle drift after idle
  //     hazes.forEach((h, i) => {
  //       h.position.x += Math.sin(clock.elapsedTime * 0.08 + i) * 0.008;
  //     });
  //     updateCamera();
  //     renderer.render(scene, camera);
  //   }
  //   updateCamera();
  //   animate();

  //   return () => {
  //     cancelAnimationFrame(raf);
  //     window.removeEventListener("resize", onResize);
  //     window.removeEventListener("pointermove", onMove);
  //     window.removeEventListener("pointerup", onUp);
  //     el.removeEventListener("pointerdown", onDown);
  //     el.removeEventListener("wheel", onWheel);
  //     renderer.dispose();
  //     scene.traverse((o) => {
  //       if (o.geometry) o.geometry.dispose();
  //       if (o.material) {
  //         (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
  //           m.dispose(),
  //         );
  //       }
  //     });
  //     mount.removeChild(el);
  //   };
  // }, []);

  // Load JSON
  useEffect(() => {
    // Replace with your real fallback or endpoint logic

    //
    //
    //
    setMyData({
      name: "dalaran",
      description:
        "Cozy dusk living room: a cat trots in, faceplants, and is consoled by a friend. Geometry mapped to createPlaceholder types.",
      setting: {
        lighting: {
          colorTemp: 3400,
        },
      },
      camera: {
        position: [7, 4.5, 9.5],
        lookAt: [0, 1, 0],
      },
      objects: [
        {
          type: "city",
          path: "/dalaran.obj",
          size: [16, 0.1, 12],
          position: [0, -0.05, 0],
        },
      ],
    });

    import(`../../logs/${logName}.json`)
      .then((logDataModule) => {
        const raw = logDataModule.default;
        const data = Array.isArray(raw) ? raw[0] : raw; // unwrap [ { objects, camera } ] shape
        setMyData(data);
        console.log("data", data);
        if (data.timeline && data.timeline.length > 0) {
          setMaxTime(data.timeline[data.timeline.length - 1].t + 2);
        } else if (data.objects) {
          // Static level scene (no dialogue timeline) - start in free-fly instead of
          // sitting on a frozen "auto" camera waiting for cuts that will never come.
          setCameraMode("orbit");
        }
      })
      .catch((err) => {
        console.error("Failed to load log data:", err);
        // Fallback fallback data for standalone debugging
        const fallback = {
          setting: { lighting: { colorTemp: 5500 } },
          participants: [
            { id: "p1", role: "therapist" },
            { id: "p2", role: "patient" },
          ],
          timeline: [
            {
              t: 0,
              speaker: "System",
              line: "Scene Initialized.",
              camera: { shot: "wide", focus: "p1" },
            },
            {
              t: 3,
              speaker: "Therapist",
              line: "Hello, how are we doing today?",
              camera: { shot: "close_up", focus: "p1" },
            },
            {
              t: 7,
              speaker: "Patient",
              line: "I'm feeling a bit anxious about this session.",
              camera: { shot: "medium_two_shot", focus: "p2" },
            },
          ],
        };
        setMyData(fallback);
        setMaxTime(9);
      });
  }, [logName]);

  // Three.js Engine & Loop
  useEffect(() => {
    if (!myData) return;

    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    let frameId;
    let disposed = false;

    function init() {
      renderer = new THREE.WebGPURenderer({ antialias: true });

      renderer.init().then(() => {
        if (disposed) return;

        const width = mount.clientWidth || 1;
        const height = mount.clientHeight || 1;
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
          45,
          width / height,
          0.1,
          100,
        );

        // Respect a level-authored camera (e.g. mission_control.json's
        // { position, lookAt }); fall back to the original hardcoded framing.
        const initialCamPos = myData.camera?.position ?? [0, 1.6, 4];
        const initialLookAt = myData.camera?.lookAt ?? [0, 1, 0];
        camera.position.set(...initialCamPos);
        camera.lookAt(...initialLookAt);
        cameraRef.current = camera;

        // Initialize OrbitControls (Blender style viewport rotation/pan/zoom)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(...initialLookAt);
        controlsRef.current = controls;

        const { lighting } = myData.setting ?? {};
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(-3, 4, 2);
        if (lighting?.colorTemp)
          keyLight.color = kelvinToColor(lighting.colorTemp);
        scene.add(keyLight);
        scene.add(new THREE.AmbientLight(0x404040, 0.6));

        // Grid floor helper like Blender layout mode
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

        const participantMeshes = {};
        (myData.participants ?? []).forEach((p, i) => {
          const geo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
          const mat = new THREE.MeshStandardMaterial({
            color: p.role === "therapist" ? 0x5577aa : 0xaa7755,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(i === 0 ? -1 : 1, 0.9, 0);
          mesh.name = p.id;
          scene.add(mesh);
          participantMeshes[p.id] = mesh;
        });
        //console.log("mydata", myData.timeline, Array.isArray(myData.timeline));
        // myData.timeline
        //   .forEach(function (event) {
        //     if (event.cat_moves) {
        //     }
        //   })(
        //     // Static level geometry, e.g. mission_control.json's "objects" array
        //     myData.objects ?? [],
        //   )
        //   .forEach((obj) => {
        //     const mesh = createPlaceholder(obj.type, obj.size);
        //     if (obj.position) mesh.position.set(...obj.position);
        //     if (obj.rotation) {
        //       mesh.rotation.set(
        //         THREE.MathUtils.degToRad(obj.rotation[0] || 0),
        //         THREE.MathUtils.degToRad(obj.rotation[1] || 0),
        //         THREE.MathUtils.degToRad(obj.rotation[2] || 0),
        //       );
        //     }
        //     scene.add(mesh);
        //   });

        targetsRef.current = scene.children.filter((obj) => obj.isMesh);

        const timeline = myData.timeline ?? [];
        let lastTimeStamp = performance.now();

        function applyShot(entry) {
          const preset =
            SHOT_PRESETS[entry.camera?.shot] ?? SHOT_PRESETS.medium_two_shot;
          const focusMesh = participantMeshes[entry.camera?.focus];
          const focusPos = focusMesh
            ? focusMesh.position
            : new THREE.Vector3(0, 0.9, 0);

          camera.fov = preset.fov;
          camera.position.set(focusPos.x, preset.height, preset.distance);
          controls.target.copy(focusPos);
          camera.lookAt(focusPos.x, focusPos.y, focusPos.z);
          camera.updateProjectionMatrix();
        }

        function animate() {
          const now = performance.now();
          const delta = (now - lastTimeStamp) / 1000;
          lastTimeStamp = now;

          const state = playbackStateRef.current;

          if (state.isPlaying) {
            let nextTime = state.currentTime + delta * state.speed;
            if (nextTime > maxTime) nextTime = 0; // Loop timeline
            setCurrentTime(nextTime);
            playbackStateRef.current.currentTime = nextTime;
          }

          // Active timeline logging logic
          const active = [...timeline]
            .reverse()
            .find((e) => e.t <= state.currentTime);
          if (active && active !== animate.lastEntry) {
            animate.lastEntry = active;
            setCurrentLine(active);
            if (state.mode === "auto") {
              applyShot(active);
            }
          }

          if (state.mode === "orbit") {
            controls.update(); // Only run interactive matrix changes when user takes manual tracking
          }

          renderer
            .renderAsync(scene, camera)
            .catch((err) => console.error("render error:", err));
          frameId = requestAnimationFrame(animate);
        }

        animate();

        const resizeObserver = new ResizeObserver((entries) => {
          const { width, height } = entries[0].contentRect;
          if (width === 0 || height === 0) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        });
        resizeObserver.observe(mount);

        init.cleanup = () => {
          resizeObserver.disconnect();
          cancelAnimationFrame(frameId);
          controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
        };
      });
    }

    init();

    return () => {
      disposed = true;
      init.cleanup?.();
    };
  }, [myData, maxTime]);

  const addAnnotation = () => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const newNote = {
      id: Date.now(),
      time: currentTime.toFixed(2),
      text: noteText || "Manual Bookmark",
      camPosition: cam.position.clone().toArray(),
      camTarget: controlsRef.current
        ? controlsRef.current.target.clone().toArray()
        : [0, 1, 0],
    };
    setAnnotations([...annotations, newNote]);
    setNoteText("");
  };

  const jumpToAnnotation = (ann) => {
    setCameraMode("orbit");
    setCurrentTime(parseFloat(ann.time));
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.fromArray(ann.camPosition);
      controlsRef.current.target.fromArray(ann.camTarget);
      cameraRef.current.updateProjectionMatrix();
    }
  };

  if (!myData) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading log dataset engine...
      </div>
    );
  }
  const handleTakeScreenshot = () => {
    // 1. Get the canvas element created by Three.js inside the mount div
    const canvas = mountRef.current?.querySelector("canvas");
    if (!canvas) {
      console.error("Canvas element not found.");
      return;
    }

    try {
      // 2. Convert the current frame on the canvas to a Data URL
      const imgData = canvas.toDataURL("image/png");

      // 3. Create a temporary anchor element to trigger the download
      const link = document.createElement("a");

      // Naming convention using the current route's log name and timestamp
      link.download = `logview_${logName || "capture"}_${currentTime.toFixed(2)}s.png`;
      link.href = imgData;

      // 4. Force programmatic click to execute save dialog
      link.click();
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  };
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#111",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div>
        {" "}
        <div
          style={{
            width: 320,
            background: "#1e1e1e",
            borderLeft: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            color: "#e0e0e0",
            paddingTop: "100px",
          }}
        >
          <input type="range" />
          <button
            onClick={handleTakeScreenshot}
            style={{
              background: "#4a6fa5",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              margin: "4px 0",
            }}
          >
            📸 Export Screenshot
          </button>
          {/* update reactively both variables*/}
          <button>associate</button>

          {Object.entries(levelModules).map(([key, value]) => (
            <div key={key} onMouseEnter={() => navigate(`/view/therapy`)}>
              {key}
            </div>
          ))}
          {/* <div onMouseEnter={() => navigate(`/view/onyxia`)}>scene 1</div>
         <div onMouseEnter={() => navigate(`/view/therapy`)}>scene 2</div>
         <div onMouseEnter={() => navigate(`/view/algalon`)}>scene 3</div>*/}
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <div
            onMouseEnter={() =>
              navigate(`/view/mission_control_initiative_space_force`)
            }
          >
            scene 1
          </div>
          <div onMouseEnter={() => navigate(`/view/z__petting_cat`)}>
            cat pet
          </div>
        </div>
      </div>
      {/* 3D Viewport mount area */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Viewport Subtitle Overlays */}
        {currentLine && (
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "12px 24px",
              background: "rgba(0,0,0,0.85)",
              border: "1px solid #333",
              color: "white",
              borderRadius: 8,
              fontFamily: "sans-serif",
              textAlign: "center",
              minWidth: 300,
            }}
          >
            <strong style={{ color: "#e05555" }}>{currentLine.speaker}</strong>:{" "}
            {currentLine.line}
          </div>
        )}

        {/* Timeline Timeline Deck scrubbing bar */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "rgba(25, 25, 25, 0.9)",
            border: "1px solid #3c3c3c",
            borderRadius: 8,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "monospace",
            color: "#ccc",
          }}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: "6px 12px",
              background: isPlaying ? "#e05555" : "#44aa55",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
          </button>

          <div style={{ minWidth: 60 }}>{currentTime.toFixed(2)}s</div>

          <input
            type="range"
            min={0}
            max={maxTime}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(parseFloat(e.target.value));
            }}
            style={{ flex: 1, accentColor: "#e05555" }}
          />

          <div style={{ minWidth: 50 }}>{maxTime.toFixed(1)}s</div>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid #444",
              padding: 4,
              borderRadius: 4,
            }}
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1.0x Speed</option>
            <option value={2}>2.0x Speed</option>
          </select>
        </div>
      </div>

      {/* Right Sidebar Control Dock (Blender / Director Suite) */}
      <div
        style={{
          width: 320,
          background: "#1e1e1e",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          color: "#e0e0e0",
        }}
      >
        {/* Module Title */}
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #333",
            fontWeight: "bold",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#888",
          }}
        >
          🎬 Director Rig Control
        </div>

        {/* Camera Logic Switcher */}
        <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
          <label
            style={{
              fontSize: 12,
              display: "block",
              marginBottom: 8,
              color: "#aaa",
            }}
          >
            CAMERA MODE
          </label>
          <div
            style={{
              display: "flex",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #444",
            }}
          >
            <button
              onClick={() => setCameraMode("auto")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                cursor: "pointer",
                background: cameraMode === "auto" ? "#3a3a3a" : "#252525",
                color: cameraMode === "auto" ? "#fff" : "#888",
                fontWeight: cameraMode === "auto" ? "bold" : "normal",
              }}
            >
              🤖 Auto Cut
            </button>
            <button
              onClick={() => setCameraMode("orbit")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                cursor: "pointer",
                background: cameraMode === "orbit" ? "#4a6fa5" : "#252525",
                color: cameraMode === "orbit" ? "#fff" : "#888",
                fontWeight: cameraMode === "orbit" ? "bold" : "normal",
              }}
            >
              🖱 Manual (Blender)
            </button>
          </div>
          {cameraMode === "orbit" && (
            <p
              style={{
                fontSize: 11,
                color: "#888",
                marginTop: 6,
                marginLeave: 0,
              }}
            >
              💡 Use <strong>Left Mouse</strong> to Orbit,{" "}
              <strong>Right Mouse / Shift+Left</strong> to Pan,{" "}
              <strong>Scroll</strong> to zoom.
            </p>
          )}
        </div>

        {/* Annotations & Editing Bench */}
        <div
          style={{
            padding: 16,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label
            style={{
              fontSize: 12,
              display: "block",
              marginBottom: 8,
              color: "#aaa",
            }}
          >
            SCENE ANNOTATION & BOOKMARKS
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Type note or keyframe description..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{
                flex: 1,
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: 4,
                padding: "6px 10px",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <button
              onClick={addAnnotation}
              style={{
                background: "#4a6fa5",
                color: "white",
                border: "none",
                padding: "0 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              📌 Add
            </button>
          </div>

          {/* Keyframe List */}
          <div
            style={{
              flex: 1,
              background: "#151515",
              borderRadius: 6,
              border: "1px solid #2d2d2d",
              overflowY: "auto",
              padding: 6,
            }}
          >
            {annotations.length === 0 ? (
              <div
                style={{
                  color: "#555",
                  fontSize: 12,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No custom camera annotations pinned yet.
              </div>
            ) : (
              annotations.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => jumpToAnnotation(ann)}
                  style={{
                    padding: "8px 10px",
                    background: "#222",
                    border: "1px solid #2d2d2d",
                    borderRadius: 4,
                    marginBottom: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#4a6fa5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#2d2d2d")
                  }
                >
                  <span
                    style={{
                      color: "#eee",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                    }}
                  >
                    {ann.text}
                  </span>
                  <span style={{ color: "#8a6fcf", fontFamily: "monospace" }}>
                    @{ann.time}s
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
