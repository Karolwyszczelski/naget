// src/app/components/DrewutnieModel.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type InfillType = "palisada" | "standup";

type Props = {
  colorHex: string;
  /**
   * Typ wypełnienia:
   * - "palisada" – poziome palisady
   * - "standup"  – pionowe profile (rytm STAND UP)
   */
  infill?: InfillType;
};

export default function DrewutniaModel({
  colorHex,
  infill = "palisada",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || width * 0.75;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f5);

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Światła
    const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
    light1.position.set(3, 5, 4);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
    light2.position.set(-3, 4, -2);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // Podłoże
    const floorGeo = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.9,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Kolor ramy
    const frameColor = new THREE.Color(colorHex || "#383E4A");

    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      metalness: 0.7,
      roughness: 0.35,
    });

    const frameGroup = new THREE.Group();
    scene.add(frameGroup);

    // Wymiary bazowe drewutni (w metrach)
    const frameWidth = 2.0;
    const frameDepth = 0.65;
    const frameHeight = 2.0;
    const profile = 0.06;

    const addPost = (x: number, z: number) => {
      const geo = new THREE.BoxGeometry(profile, frameHeight, profile);
      const mesh = new THREE.Mesh(geo, frameMat);
      mesh.position.set(x, frameHeight / 2, z);
      frameGroup.add(mesh);
    };

    // Słupki narożne
    addPost(-frameWidth / 2, -frameDepth / 2);
    addPost(frameWidth / 2, -frameDepth / 2);
    addPost(-frameWidth / 2, frameDepth / 2);
    addPost(frameWidth / 2, frameDepth / 2);

    // Górne rygle
    const beamGeoFront = new THREE.BoxGeometry(frameWidth, profile, profile);
    const beamFront = new THREE.Mesh(beamGeoFront, frameMat);
    beamFront.position.set(0, frameHeight, -frameDepth / 2);
    frameGroup.add(beamFront);

    const beamBack = beamFront.clone();
    beamBack.position.z = frameDepth / 2;
    frameGroup.add(beamBack);

    const beamGeoSide = new THREE.BoxGeometry(frameDepth, profile, profile);
    const beamLeft = new THREE.Mesh(beamGeoSide, frameMat);
    beamLeft.rotation.y = Math.PI / 2;
    beamLeft.position.set(-frameWidth / 2, frameHeight, 0);
    frameGroup.add(beamLeft);

    const beamRight = beamLeft.clone();
    beamRight.position.x = frameWidth / 2;
    frameGroup.add(beamRight);

    // Dach – prosta płyta
    const roofGeo = new THREE.BoxGeometry(
      frameWidth + 0.1,
      0.04,
      frameDepth + 0.1
    );
    const roofMat = new THREE.MeshStandardMaterial({
      color: frameColor.clone().offsetHSL(0, 0, 0.1),
      metalness: 0.9,
      roughness: 0.25,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, frameHeight + 0.07, 0);
    roof.rotation.x = THREE.MathUtils.degToRad(-3);
    frameGroup.add(roof);

    // Wypełnienie
    const slatsGroup = new THREE.Group();
    scene.add(slatsGroup);

    const isStandup = infill === "standup";

    const slatThickness = isStandup ? 0.06 : 0.02;
    const slatDepth = frameDepth - 0.1;
    const slatCount = isStandup ? 6 : 10;

    for (let i = 0; i < slatCount; i++) {
  const t = i / (slatCount - 1);
  const x = -frameWidth / 2 + 0.1 + t * (frameWidth - 0.2);

      const geo = isStandup
        ? new THREE.BoxGeometry(slatThickness, frameHeight - 0.25, 0.03)
        : new THREE.BoxGeometry(0.03, slatThickness, slatDepth);

      const mesh = new THREE.Mesh(geo, frameMat);

      if (isStandup) {
        // pionowe profile – Stand Up
        mesh.position.set(x, frameHeight / 2 - 0.1, 0);
      } else {
        // poziome palisady
        const y = 0.3 + t * (frameHeight - 0.5);
        mesh.position.set(0, y, 0);
        mesh.rotation.y = Math.PI / 2;
      }

      slatsGroup.add(mesh);
    }

    frameGroup.position.y = 0.02;
    slatsGroup.position.y = 0.02;

    const target = new THREE.Vector3(0, 1.0, 0);

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const t = performance.now() * 0.00015;
      camera.position.x = Math.cos(t) * 3.5;
      camera.position.z = Math.sin(t) * 3.5;
      camera.lookAt(target);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || w * 0.75;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameIdRef.current != null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      container.innerHTML = "";
    };
  }, [colorHex, infill]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[4/3] rounded-3xl bg-neutral-100 overflow-hidden"
    />
  );
}
