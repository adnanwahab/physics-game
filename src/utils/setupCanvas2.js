import * as THREE from 'three';

export function setupCanvas2(canvas2, isMountedRef, cleanupFunctions, setPointCloudCount) {
    const rect2 = canvas2.getBoundingClientRect();
    const renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, alpha: true, antialias: true });
    renderer2.setSize(rect2.width, rect2.height, false);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene2 = new THREE.Scene();
    const camera2 = new THREE.PerspectiveCamera(45, rect2.width / rect2.height, 0.1, 100);
    camera2.position.z = 30;
    scene2.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(10, 20, 20);
    scene2.add(dirLight);

    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const seatWidth = 8, seatDepth = 8, legHeight = 10, legRadius = 0.5, backrestHeight = 10, backrestThickness = 0.7;
    let n = 0;
    const place = (x, y, z) => { if (n < particleCount) { positions[n*3]=x; positions[n*3+1]=y; positions[n*3+2]=z; n++; } };

    for (let i = 0; i < 1100; i++) {
        place(THREE.MathUtils.lerp(-seatWidth/2, seatWidth/2, Math.random()), THREE.MathUtils.lerp(-0.7, 0.7, Math.random()), THREE.MathUtils.lerp(-seatDepth/2, seatDepth/2, Math.random()));
    }
    for (let leg = 0; leg < 4; leg++) {
        const lx = leg < 2 ? -seatWidth/2 + 0.8 : seatWidth/2 - 0.8;
        const lz = (leg % 2 === 0) ? -seatDepth/2 + 0.8 : seatDepth/2 - 0.8;
        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2;
            place(lx + Math.cos(angle) * legRadius * Math.sqrt(Math.random()), -1.5 - Math.random() * legHeight, lz + Math.sin(angle) * legRadius * Math.sqrt(Math.random()));
        }
    }
    for (let i = 0; i < 800; i++) {
        place(THREE.MathUtils.lerp(-seatWidth/2, seatWidth/2, Math.random()), THREE.MathUtils.lerp(1.5, 1.5+backrestHeight, Math.random()), seatDepth/2 + backrestThickness * THREE.MathUtils.randFloat(-0.2, 1.2));
    }
    for (let i = 0; i < 400; i++) {
        place(THREE.MathUtils.lerp(-seatWidth/2+0.1, seatWidth/2-0.1, Math.random()), THREE.MathUtils.lerp(7.5, 9+backrestHeight, Math.random()), seatDepth/2 + 0.7);
    }

    const geometry2 = new THREE.BufferGeometry();
    geometry2.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    setPointCloudCount(n);

    const spriteMap = (() => {
        const size = 64, c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        g.addColorStop(0.1, '#fff'); g.addColorStop(0.25, '#dddddd'); g.addColorStop(1, '#bbbbbb00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
        return new THREE.CanvasTexture(c);
    })();

    const silverColor = new THREE.Color(0xeaeaea);
    const pinkColor = new THREE.Color(0xff69b4);
    const material2 = new THREE.PointsMaterial({ color: silverColor, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.86, map: spriteMap, alphaTest: 0.13, depthWrite: false });
    const pointCloud = new THREE.Points(geometry2, material2);
    scene2.add(pointCloud);

    const onEnter = () => { material2.color.copy(pinkColor); material2.needsUpdate = true; };
    const onLeave = () => { material2.color.copy(silverColor); material2.needsUpdate = true; };
    canvas2.addEventListener('mouseenter', onEnter);
    canvas2.addEventListener('mouseleave', onLeave);

    let animFrameId;
    const animate = () => {
        if (!isMountedRef.current) return;
        animFrameId = requestAnimationFrame(animate);
        pointCloud.rotation.x += 0.003;
        pointCloud.rotation.y += 0.005;
        renderer2.render(scene2, camera2);
    };
    animate();

    cleanupFunctions.push(() => {
        canvas2.removeEventListener('mouseenter', onEnter);
        canvas2.removeEventListener('mouseleave', onLeave);
        cancelAnimationFrame(animFrameId);
        geometry2.dispose();
        material2.dispose();
        renderer2.dispose();
    });

    return { renderer2, camera2 };
}
