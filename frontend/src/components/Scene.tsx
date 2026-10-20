'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Scene() {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setUnavailable(true); return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const resize = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resize.observe(container);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    renderer.setAnimationLoop(() => {
      if (!reduceMotion.matches) { mesh.rotation.y += 0.004; mesh.rotation.x += 0.002; }
      renderer.render(scene, camera);
    });
    return () => {
      resize.disconnect();
      renderer.setAnimationLoop(null);
      geometry.dispose(); material.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className="scene" ref={host} role="img" aria-label="Three.js wireframe preview">{unavailable && <p>3D preview requires WebGL.</p>}</div>;
}
