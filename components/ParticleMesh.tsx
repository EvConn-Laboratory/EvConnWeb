"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 400;
const CONNECTION_DISTANCE = 8;

export function ParticleMesh() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 30;

    // ── Particles ─────────────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: number[][] = [];
    const HALF = 20;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * HALF * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * HALF * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * HALF;
      velocities.push([
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.001,
      ]);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x2abfbf,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Lines geometry (rebuilt each frame for close pairs) ───────────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2abfbf,
      transparent: true,
      opacity: 0.08,
    });
    const lineGeo = new THREE.BufferGeometry();
    const maxLines = PARTICLE_COUNT * 4;
    const linePositions = new Float32Array(maxLines * 6);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ───────────────────────────────────────────────────────
    let targetX = 0;
    let targetY = 0;

    function onMouseMove(e: MouseEvent) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 3;
      targetY = (e.clientY / window.innerHeight - 0.5) * 3;
    }
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ───────────────────────────────────────────────────────────────
    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    // ── Animation ────────────────────────────────────────────────────────────
    let frameId: number;

    function animate() {
      frameId = requestAnimationFrame(animate);

      // Move particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3 + 0] += velocities[i][0];
        positions[i * 3 + 1] += velocities[i][1];
        positions[i * 3 + 2] += velocities[i][2];

        // Wrap around bounds
        if (positions[i * 3 + 0] > HALF) positions[i * 3 + 0] = -HALF;
        if (positions[i * 3 + 0] < -HALF) positions[i * 3 + 0] = HALF;
        if (positions[i * 3 + 1] > HALF) positions[i * 3 + 1] = -HALF;
        if (positions[i * 3 + 1] < -HALF) positions[i * 3 + 1] = HALF;
        if (positions[i * 3 + 2] > HALF / 2) positions[i * 3 + 2] = -HALF / 2;
        if (positions[i * 3 + 2] < -HALF / 2) positions[i * 3 + 2] = HALF / 2;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Rebuild connection lines
      let lineCount = 0;
      for (let i = 0; i < PARTICLE_COUNT && lineCount < maxLines - 1; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT && lineCount < maxLines - 1; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < CONNECTION_DISTANCE) {
            linePositions[lineCount * 6 + 0] = positions[i * 3];
            linePositions[lineCount * 6 + 1] = positions[i * 3 + 1];
            linePositions[lineCount * 6 + 2] = positions[i * 3 + 2];
            linePositions[lineCount * 6 + 3] = positions[j * 3];
            linePositions[lineCount * 6 + 4] = positions[j * 3 + 1];
            linePositions[lineCount * 6 + 5] = positions[j * 3 + 2];
            lineCount++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineCount * 2);
      lineGeo.attributes.position.needsUpdate = true;

      // Camera parallax
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (-targetY - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      particleGeo.dispose();
      lineGeo.dispose();
      particleMat.dispose();
      lineMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
