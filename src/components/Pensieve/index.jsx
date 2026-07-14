import { useEffect, useRef } from "react";
import * as THREE from "three";

// ————— helpers —————

function makeGlowSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(230,240,255,1)");
  grad.addColorStop(0.3, "rgba(180,205,255,0.55)");
  grad.addColorStop(1, "rgba(120,150,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// procedural angular glyphs arranged in a ring (rune-like, drawn by hand so no font needed)
function makeRuneRingTexture() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.clearRect(0, 0, S, S);
  g.strokeStyle = "rgba(190,215,255,0.9)";
  g.lineWidth = 5;
  g.lineCap = "round";
  const N = 26;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed & 0xffff) / 0xffff;
  };
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    g.save();
    g.translate(
      S / 2 + Math.cos(ang) * S * 0.42,
      S / 2 + Math.sin(ang) * S * 0.42,
    );
    g.rotate(ang + Math.PI / 2);
    const strokes = 3 + Math.floor(rnd() * 3);
    g.beginPath();
    let x = -10 + rnd() * 8,
      y = -20 + rnd() * 6;
    g.moveTo(x, y);
    for (let s = 0; s < strokes; s++) {
      x = -16 + rnd() * 32;
      y = -22 + rnd() * 44;
      g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  }
  return new THREE.CanvasTexture(c);
}

// subtle stone bump texture
function makeStoneTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#5a5f6a";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const v = 70 + Math.random() * 60;
    g.fillStyle = `rgba(${v},${v + 4},${v + 10},${Math.random() * 0.22})`;
    const r = Math.random() * 2.2;
    g.fillRect(Math.random() * S, Math.random() * S, r, r);
  }
  // faint veins
  g.strokeStyle = "rgba(30,32,40,0.25)";
  for (let i = 0; i < 24; i++) {
    g.beginPath();
    let x = Math.random() * S,
      y = Math.random() * S;
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.5) * 90;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const LIQUID_VERT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 p = position;
    float r = length(uv * 2.0 - 1.0);
    p.z += sin(r * 18.0 - uTime * 2.0) * 0.012 * (1.0 - r);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const LIQUID_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRippleOrigin;
  uniform float uRippleTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float ang = atan(p.y, p.x);

    // vortex: faster twist toward the center
    float twist = (1.0 - r) * 3.2 + uTime * 0.22;
    ang += twist;

    vec2 sw = vec2(cos(ang), sin(ang)) * r;

    float n = fbm(sw * 3.4 + vec2(uTime * 0.12, -uTime * 0.07));
    float strands = sin(ang * 7.0 + r * 26.0 - uTime * 1.6 + n * 6.0);
    strands = smoothstep(0.15, 0.95, strands);

    float n2 = fbm(sw * 7.0 - vec2(uTime * 0.05, uTime * 0.09));

    vec3 deep   = vec3(0.05, 0.08, 0.16);
    vec3 mid    = vec3(0.42, 0.52, 0.70);
    vec3 silver = vec3(0.88, 0.94, 1.0);

    vec3 col = mix(deep, mid, n);
    col = mix(col, silver, strands * (0.35 + 0.4 * n2));

    // luminous core
    float core = smoothstep(0.55, 0.0, r);
    col += silver * core * (0.55 + 0.25 * sin(uTime * 1.3));

    // sparkles
    float sp = step(0.986, hash(floor(sw * 60.0) + floor(uTime * 3.0)));
    col += silver * sp * 0.6 * (1.0 - r);

    // click ripple
    float dt = uTime - uRippleTime;
    if (dt < 2.5) {
      float d = distance(vUv, uRippleOrigin);
      float ring = abs(d - dt * 0.35);
      col += silver * smoothstep(0.05, 0.0, ring) * (1.0 - dt / 2.5) * 0.9;
    }

    // soft edge into the stone
    float edge = smoothstep(1.0, 0.92, r);
    gl_FragColor = vec4(col, edge);
  }
`;

export default function Pensieve() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = () => mount.clientWidth;
    const H = () => mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060c);
    scene.fog = new THREE.FogExp2(0x04060c, 0.055);

    const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 100);

    // ————— lights —————
    scene.add(new THREE.AmbientLight(0x2a3350, 0.9));
    const basinLight = new THREE.PointLight(0x9fc4ff, 1.6, 14, 2);
    basinLight.position.set(0, 1.9, 0);
    scene.add(basinLight);
    const rim = new THREE.DirectionalLight(0x35446e, 0.7);
    rim.position.set(-4, 6, -5);
    scene.add(rim);

    // ————— stone basin —————
    const stoneTex = makeStoneTexture();
    stoneTex.repeat.set(3, 1);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6b7078,
      roughness: 0.85,
      metalness: 0.08,
      map: stoneTex,
      bumpMap: stoneTex,
      bumpScale: 0.02,
    });

    const profile = [];
    profile.push(new THREE.Vector2(0.0, 0.55));
    profile.push(new THREE.Vector2(1.1, 0.6));
    profile.push(new THREE.Vector2(1.7, 0.78));
    profile.push(new THREE.Vector2(2.0, 1.0));
    profile.push(new THREE.Vector2(2.12, 1.18));
    profile.push(new THREE.Vector2(2.3, 1.24)); // lip out
    profile.push(new THREE.Vector2(2.34, 1.34));
    profile.push(new THREE.Vector2(2.2, 1.38)); // lip top
    profile.push(new THREE.Vector2(1.95, 1.3)); // inner rim
    profile.push(new THREE.Vector2(1.6, 1.12));
    profile.push(new THREE.Vector2(1.0, 0.98));
    profile.push(new THREE.Vector2(0.0, 0.92)); // inner bowl floor
    const basin = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 64),
      stoneMat,
    );
    scene.add(basin);

    // pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 1.15, 0.6, 48),
      stoneMat,
    );
    pedestal.position.y = 0.3;
    scene.add(pedestal);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.5, 0.18, 48),
      stoneMat,
    );
    base.position.y = 0.09;
    scene.add(base);

    // ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b0e16, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ————— liquid —————
    const liquidUniforms = {
      uTime: { value: 0 },
      uRippleOrigin: { value: new THREE.Vector2(0.5, 0.5) },
      uRippleTime: { value: -10 },
    };
    const liquid = new THREE.Mesh(
      new THREE.CircleGeometry(1.92, 96),
      new THREE.ShaderMaterial({
        vertexShader: LIQUID_VERT,
        fragmentShader: LIQUID_FRAG,
        uniforms: liquidUniforms,
        transparent: true,
      }),
    );
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.y = 1.14;
    scene.add(liquid);

    // under-glow from the liquid
    const glowTex = makeGlowSprite();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xaaccff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(6.5, 3.4, 1);
    glow.position.y = 1.5;
    scene.add(glow);

    // ————— rune ring —————
    const runeTex = makeRuneRingTexture();
    const runeRing = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 5.6),
      new THREE.MeshBasicMaterial({
        map: runeTex,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    runeRing.rotation.x = -Math.PI / 2;
    runeRing.position.y = 1.42;
    scene.add(runeRing);

    // ————— memory wisps (rising particles) —————
    const WISPS = 500;
    const wispGeo = new THREE.BufferGeometry();
    const wPos = new Float32Array(WISPS * 3);
    const wData = []; // {radius, angle, speed, rise, phase, life}
    for (let i = 0; i < WISPS; i++) {
      wData.push({
        radius: 0.2 + Math.random() * 1.6,
        angle: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.9,
        rise: 0.15 + Math.random() * 0.45,
        y: 1.15 + Math.random() * 2.5,
        burst: 0,
      });
    }
    wispGeo.setAttribute("position", new THREE.BufferAttribute(wPos, 3));
    const wisps = new THREE.Points(
      wispGeo,
      new THREE.PointsMaterial({
        map: glowTex,
        color: 0xcfe0ff,
        size: 0.09,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(wisps);

    // drifting dust in the chamber
    const DUST = 250;
    const dustGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 22;
      dPos[i * 3 + 1] = Math.random() * 7;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        map: glowTex,
        color: 0x5f7cb8,
        size: 0.05,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    // ————— memory strands (glowing spiral ribbons) —————
    const strandGroup = new THREE.Group();
    for (let s = 0; s < 3; s++) {
      const pts = [];
      const a0 = (s / 3) * Math.PI * 2;
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const rr = 0.25 + t * 1.1;
        const aa = a0 + t * Math.PI * 3.0;
        pts.push(
          new THREE.Vector3(
            Math.cos(aa) * rr,
            1.18 + t * 1.6,
            Math.sin(aa) * rr,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 0.012, 6, false),
        new THREE.MeshBasicMaterial({
          color: 0xdce9ff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      strandGroup.add(tube);
    }
    scene.add(strandGroup);

    // ————— camera controls (drag orbit, wheel zoom) —————
    const target = new THREE.Vector3(0, 1.2, 0);
    let theta = 0.7,
      phi = 1.12,
      radius = 7.2;
    let thetaT = theta,
      phiT = phi,
      radiusT = radius;
    let dragging = false,
      px = 0,
      py = 0,
      lastInteract = 0;

    const onDown = (e) => {
      dragging = true;
      px = e.clientX ?? e.touches?.[0]?.clientX;
      py = e.clientY ?? e.touches?.[0]?.clientY;
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      thetaT -= (x - px) * 0.006;
      phiT = Math.min(1.45, Math.max(0.45, phiT - (y - py) * 0.004));
      px = x;
      py = y;
      lastInteract = clock.elapsedTime;
    };
    const onUp = () => (dragging = false);
    const onWheel = (e) => {
      radiusT = Math.min(13, Math.max(4, radiusT + e.deltaY * 0.005));
      lastInteract = clock.elapsedTime;
    };

    // click → ripple + wisp burst
    const raycaster = new THREE.Raycaster();
    const mouseV = new THREE.Vector2();
    let downAt = 0;
    const onPointerDown = () => (downAt = performance.now());
    const onClickSurface = (e) => {
      if (performance.now() - downAt > 220) return; // it was a drag
      const rect = renderer.domElement.getBoundingClientRect();
      mouseV.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseV.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseV, camera);
      const hit = raycaster.intersectObject(liquid)[0];
      if (hit) {
        liquidUniforms.uRippleOrigin.value.copy(hit.uv);
        liquidUniforms.uRippleTime.value = clock.elapsedTime;
        for (let i = 0; i < WISPS; i++)
          if (Math.random() < 0.25) wData[i].burst = 1.6;
      }
    };

    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("mousedown", onPointerDown);
    el.addEventListener("mouseup", onClickSurface);

    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    // ————— animate —————
    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta() + 0.016, 0.05);

      liquidUniforms.uTime.value = t;

      // idle auto-orbit
      if (!dragging && t - lastInteract > 3) thetaT += 0.0016;

      theta += (thetaT - theta) * 0.08;
      phi += (phiT - phi) * 0.08;
      radius += (radiusT - radius) * 0.08;
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(target);

      // light flicker like candlelight off water
      basinLight.intensity =
        1.5 + Math.sin(t * 2.1) * 0.15 + Math.sin(t * 5.7) * 0.08;
      glow.material.opacity = 0.42 + Math.sin(t * 1.7) * 0.08;

      runeRing.rotation.z = -t * 0.05;
      runeRing.material.opacity = 0.45 + Math.sin(t * 0.9) * 0.12;

      strandGroup.rotation.y = t * 0.18;
      strandGroup.children.forEach((m, i) => {
        m.material.opacity =
          0.22 + 0.18 * Math.abs(Math.sin(t * 0.6 + i * 2.1));
      });

      // wisps spiral upward, fade, recycle
      for (let i = 0; i < WISPS; i++) {
        const w = wData[i];
        const boost = 1 + w.burst;
        w.angle += w.speed * dt * (0.6 + (2.0 - w.radius) * 0.5) * boost;
        w.y += w.rise * dt * boost;
        w.radius += dt * 0.03 * boost;
        if (w.burst > 0) w.burst = Math.max(0, w.burst - dt * 1.2);
        if (w.y > 4.6 || w.radius > 2.6) {
          w.y = 1.15;
          w.radius = 0.15 + Math.random() * 1.4;
          w.angle = Math.random() * Math.PI * 2;
        }
        wPos[i * 3] = Math.cos(w.angle) * w.radius;
        wPos[i * 3 + 1] = w.y;
        wPos[i * 3 + 2] = Math.sin(w.angle) * w.radius;
      }
      wispGeo.attributes.position.needsUpdate = true;

      // dust drifts slowly
      for (let i = 0; i < DUST; i++) {
        dPos[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0008;
        dPos[i * 3] += Math.cos(t * 0.2 + i * 1.7) * 0.0008;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onPointerDown);
      el.removeEventListener("mouseup", onClickSurface);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#04060c",
        overflow: "hidden",
      }}
    >
      <div
        ref={mountRef}
        style={{ position: "absolute", inset: 0, cursor: "grab" }}
      />
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
          fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
          color: "#cdd9f2",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: "0.35em",
            textShadow: "0 0 24px rgba(140,170,255,0.5)",
          }}
        >
          THE PENSIEVE
        </div>
        <div
          style={{
            fontSize: 13,
            marginTop: 8,
            opacity: 0.55,
            letterSpacing: "0.12em",
          }}
        >
          drag to orbit · scroll to lean closer · touch the surface to stir a
          memory
        </div>
      </div>
    </div>
  );
}
