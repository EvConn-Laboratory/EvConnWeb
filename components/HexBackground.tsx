"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_COLORS = [0x2abfbf, 0x1dd9d9, 0x00e676, 0x3b82c4, 0x2563a8];
const NODE_COUNT = 100;
const CONNECTION_DISTANCE = 15;

export function HexBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 40;

    // ── Hex nodes ────────────────────────────────────────────────────────────
    const hexGeo = new THREE.CylinderGeometry(1, 1, 0.2, 6);
    const group = new THREE.Group();
    scene.add(group);

    const nodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodePhases: number[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 + Math.random() * 0.4 });
      const mesh = new THREE.Mesh(hexGeo, mat);

      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
      );
      mesh.position.copy(pos);
      mesh.rotation.x = Math.PI / 2;
      const scale = 0.3 + Math.random() * 0.9;
      mesh.scale.setScalar(scale);

      group.add(mesh);
      nodePositions.push(pos);
      nodeMeshes.push(mesh);
      nodePhases.push(Math.random() * Math.PI * 2);
    }

    // ── Connection lines ─────────────────────────────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2abfbf, transparent: true, opacity: 0.1 });
    const linePoints: THREE.Vector3[] = [];

    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < CONNECTION_DISTANCE) {
          linePoints.push(nodePositions[i].clone(), nodePositions[j].clone());
        }
      }
    }

    if (linePoints.length > 0) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      group.add(lines);
    }

    // ── Mouse parallax ───────────────────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;

    function onMouseMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
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
    let time = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);
      time += 0.005;

      group.rotation.y += 0.0003;
      group.rotation.x += 0.0001;

      // Smooth camera parallax
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Node pulsing
      for (let i = 0; i < nodeMeshes.length; i++) {
        const s = 1 + Math.sin(time * 0.8 + nodePhases[i]) * 0.05;
        nodeMeshes[i].scale.setScalar((0.3 + (nodePhases[i] % 0.9)) * s);
        nodeMeshes[i].position.y =
          nodePositions[i].y + Math.sin(time + nodePhases[i]) * 0.2;
      }

      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      hexGeo.dispose();
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
