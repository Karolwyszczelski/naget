"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaCube, FaBars, FaTree } from "react-icons/fa";

type Finish = "mat" | "brokat";
type Variant = "standup" | "palisade";

type Props = {
  colorHex: string;
  finish: Finish;
};

// --- WYMIARY STANDARDOWE (w metrach) ---
const WIDTH = 2.0;
const HEIGHT = 2.0;
const DEPTH = 0.65;

// Profile konstrukcyjne (Rama)
const FRAME_W = 0.06;
const FRAME_D = 0.04;

// Profile wypełnienia
// STAND UP (Pionowe)
const SU_W = 0.06;
const SU_D = 0.04;
const SU_GAP = 0.04;

// PALISADA (Poziome)
const PAL_H = 0.08;
const PAL_D = 0.02;
const PAL_GAP = 0.04;

export default function DrewutniaPoprawiona({ colorHex, finish }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [variant, setVariant] = useState<Variant>("standup");
  const [hasBack, setHasBack] = useState(true);
  const [showWood, setShowWood] = useState(true);
  
  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const woodMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(2.5, 1.8, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.0, 0);

    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#2d2d2d"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.3 : 0.5,
    });
    frameMatRef.current = frameMat;

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 1.0,
      metalness: 0.0,
    });
    woodMatRef.current = woodMat;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshStandardMaterial({ color: 0xe5edf9, roughness: 1 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if(!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      controls.dispose();
      if(container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !frameMatRef.current || !woodMatRef.current) return;
    const scene = sceneRef.current;
    const oldShed = scene.getObjectByName("shed");
    if(oldShed) scene.remove(oldShed);

    const shedGroup = new THREE.Group();
    shedGroup.name = "shed";
    scene.add(shedGroup);

    const mat = frameMatRef.current;
    mat.color.set(colorHex || "#2d2d2d");
    mat.roughness = finish === "mat" ? 0.8 : 0.4;
    mat.metalness = finish === "mat" ? 0.3 : 0.5;

    // 1. RAMA GŁÓWNA
    const postGeo = new THREE.BoxGeometry(FRAME_W, HEIGHT, FRAME_D);
    const postPos = [
      [-WIDTH/2 + FRAME_W/2, -DEPTH/2 + FRAME_D/2],
      [WIDTH/2 - FRAME_W/2, -DEPTH/2 + FRAME_D/2],
      [-WIDTH/2 + FRAME_W/2, DEPTH/2 - FRAME_D/2],
      [WIDTH/2 - FRAME_W/2, DEPTH/2 - FRAME_D/2],
    ];
    postPos.forEach(([x, z]) => {
      const p = new THREE.Mesh(postGeo, mat);
      p.position.set(x, HEIGHT/2, z);
      p.castShadow = true;
      shedGroup.add(p);
    });

    const baseWGeo = new THREE.BoxGeometry(WIDTH, FRAME_D, FRAME_W);
    const baseDGeo = new THREE.BoxGeometry(FRAME_W, FRAME_D, DEPTH - 2*FRAME_W);

    const botBack = new THREE.Mesh(baseWGeo, mat);
    botBack.position.set(0, FRAME_D/2, -DEPTH/2 + FRAME_W/2);
    shedGroup.add(botBack);
    const botFront = new THREE.Mesh(baseWGeo, mat);
    botFront.position.set(0, FRAME_D/2, DEPTH/2 - FRAME_W/2);
    shedGroup.add(botFront);
    const botLeft = new THREE.Mesh(baseDGeo, mat);
    botLeft.position.set(-WIDTH/2 + FRAME_W/2, FRAME_D/2, 0);
    shedGroup.add(botLeft);
    const botRight = new THREE.Mesh(baseDGeo, mat);
    botRight.position.set(WIDTH/2 - FRAME_W/2, FRAME_D/2, 0);
    shedGroup.add(botRight);

    const topBack = botBack.clone(); topBack.position.y = HEIGHT - FRAME_D/2; shedGroup.add(topBack);
    const topFront = botFront.clone(); topFront.position.y = HEIGHT - FRAME_D/2; shedGroup.add(topFront);
    const topLeft = botLeft.clone(); topLeft.position.y = HEIGHT - FRAME_D/2; shedGroup.add(topLeft);
    const topRight = botRight.clone(); topRight.position.y = HEIGHT - FRAME_D/2; shedGroup.add(topRight);

    const roofBeamGeo = new THREE.BoxGeometry(FRAME_W, FRAME_W, DEPTH);
    const beam1 = new THREE.Mesh(roofBeamGeo, mat);
    beam1.position.set(-WIDTH/6, HEIGHT - FRAME_W/2, 0);
    shedGroup.add(beam1);
    const beam2 = new THREE.Mesh(roofBeamGeo, mat);
    beam2.position.set(WIDTH/6, HEIGHT - FRAME_W/2, 0);
    shedGroup.add(beam2);

    const sheetGeo = new THREE.BoxGeometry(WIDTH + 0.1, 0.02, DEPTH + 0.1);
    const sheet = new THREE.Mesh(sheetGeo, mat);
    sheet.position.set(0, HEIGHT + 0.01, 0);
    sheet.castShadow = true;
    shedGroup.add(sheet);

    // 2. WYPEŁNIENIE (POPRAWIONE)
    const buildWall = (w: number, h: number, x: number, z: number, rotY: number) => {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(x, h/2 + FRAME_D, z);
      wallGroup.rotation.y = rotY;
      const fillHeight = h - 2*FRAME_D;
      
      if (variant === "standup") {
        // --- POPRAWKA LOGIKI STAND UP ---
        // Obliczamy ile maksymalnie lameli (n) zmieści się w szerokości (w).
        // Wzór: w = n*SU_W + (n-1)*SU_GAP  =>  w + SU_GAP = n*(SU_W + SU_GAP)
        const count = Math.floor((w + SU_GAP) / (SU_W + SU_GAP));
        
        // Obliczamy faktyczną szerokość zajmowaną przez te lamele
        const totalFillWidth = count * SU_W + (count - 1) * SU_GAP;
        
        // Pozycja startowa tak, aby wycentrować cały układ
        const startX = -totalFillWidth / 2 + SU_W / 2;
        
        const geo = new THREE.BoxGeometry(SU_W, fillHeight, SU_D);
        for(let i=0; i<count; i++) {
          const bar = new THREE.Mesh(geo, mat);
          bar.position.set(startX + i*(SU_W + SU_GAP), 0, 0);
          bar.castShadow = true;
          wallGroup.add(bar);
        }
      } else {
        // PALISADA (Bez zmian)
        const count = Math.floor(fillHeight / (PAL_H + PAL_GAP));
        const startY = -fillHeight/2 + PAL_H/2;
        const geo = new THREE.BoxGeometry(w, PAL_H, PAL_D);
        for(let i=0; i<count; i++) {
          const bar = new THREE.Mesh(geo, mat);
          bar.position.set(0, startY + i*(PAL_H + PAL_GAP), 0);
          bar.castShadow = true;
          wallGroup.add(bar);
        }
      }
      return wallGroup;
    };

    const leftWall = buildWall(DEPTH - 2*FRAME_W, HEIGHT, -WIDTH/2 + FRAME_W/2, 0, Math.PI/2);
    shedGroup.add(leftWall);
    const rightWall = buildWall(DEPTH - 2*FRAME_W, HEIGHT, WIDTH/2 - FRAME_W/2, 0, Math.PI/2);
    shedGroup.add(rightWall);
    if (hasBack) {
      const backWall = buildWall(WIDTH - 2*FRAME_W, HEIGHT, 0, -DEPTH/2 + FRAME_W/2, 0);
      shedGroup.add(backWall);
    }

    // 3. DREWNO
    if (showWood) {
      const logGroup = new THREE.Group();
      const logLen = 0.4;
      const logRad = 0.05;
      const logGeo = new THREE.CylinderGeometry(logRad, logRad, logLen, 8);
      const rows = 5;
      const cols = 4;
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols - (r%2); c++) {
           const log = new THREE.Mesh(logGeo, woodMatRef.current!);
           const x = -WIDTH/2 + 0.2 + c * (logRad*2 + 0.02) + (r%2)*logRad;
           const y = FRAME_D + logRad + r * (logRad*1.8);
           const z = 0;
           log.rotation.x = Math.PI/2;
           log.rotation.z = (Math.random() - 0.5) * 0.2;
           log.position.set(x, y, z + (Math.random()-0.5)*0.05);
           log.castShadow = true;
           logGroup.add(log);
        }
      }
      shedGroup.add(logGroup);
    }

  }, [colorHex, finish, variant, hasBack, showWood]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-soft bg-transparent">
       <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
        <button
          onClick={() => setVariant(variant === "standup" ? "palisade" : "standup")}
          className="w-10 h-10 rounded-full bg-white text-gray-700 shadow-md flex items-center justify-center border border-gray-200"
          title={variant === "standup" ? "Zmień na Palisadę" : "Zmień na Stand Up"}
        >
          {variant === "standup" ? <FaBars className="rotate-90" /> : <FaBars />}
        </button>
        <button
          onClick={() => setHasBack(!hasBack)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border ${hasBack ? 'bg-white text-gray-700' : 'bg-gray-200 text-gray-400'}`}
          title="Tylna ściana"
        >
          <FaCube />
        </button>
        <button
          onClick={() => setShowWood(!showWood)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border ${showWood ? 'bg-white text-yellow-700' : 'bg-gray-200 text-gray-400'}`}
          title="Pokaż/Ukryj drewno"
        >
          <FaTree />
        </button>
      </div>

      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg leading-tight">
        <b className="text-[12px] block mb-1">DREWUTNIA {variant === "standup" ? "STAND UP" : "PALISADA"}</b>
        Wymiary: 200x65x200 cm<br/>
        {hasBack ? "Wersja wolnostojąca" : "Wersja przyścienna (bez pleców)"}
      </div>
    </div>
  );
}