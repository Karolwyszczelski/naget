"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaLightbulb, FaSyncAlt } from "react-icons/fa";

type Finish = "mat" | "brokat";

type Props = {
  colorHex: string;            // Kolor elementów stalowych (obróbki)
  finish: Finish;
  panelTextureUrl?: string;    // Opcjonalna tekstura płyty
};

// --- WYMIARY ZADASZENIA SLAB ---
const HEIGHT = 2.4;         // Wysokość całkowita
const WIDTH = 1.2;          // Szerokość
const DEPTH = 1.0;          // Głębokość daszka
const WALL_THICKNESS = 0.12; // Grubość ściany tylnej (masywna)
const ROOF_THICKNESS = 0.12; // Grubość dachu
const FRAME_THIN = 0.02;     // Grubość obróbki blacharskiej

export default function SlabZadaszenieModel({
  colorHex,
  finish,
  panelTextureUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Refy
  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const concreteMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  
  const ledLightRef = useRef<THREE.PointLight | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);
  
  const controlsRef = useRef<any>(null);

  // Stan
  const [isLightOn, setIsLightOn] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const isAutoRotatingRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENA
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(2.5, 1.8, 2.5); // Widok 3/4
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.2, 0);
    controls.autoRotate = isAutoRotatingRef.current;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 2. MATERIAŁY
    // Stal (obróbki, krawędzie)
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#2d2d2d"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.3 : 0.5,
    });
    frameMatRef.current = frameMat;

    // Beton / Płyta (Główna bryła)
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0, // Szary beton (bazowy)
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.01,
    });
    concreteMatRef.current = concreteMat;

    // Szkło mleczne (panel LED)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      transmission: 0.6,
      thickness: 0.02,
      transparent: true,
      opacity: 0.9,
    });
    glassMatRef.current = glassMat;

    // 3. BUDOWA BRYŁY
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Pozycjonowanie: Tył zadaszenia na Z = -DEPTH/2
    const backWallZ = -DEPTH/2 + WALL_THICKNESS/2;

    // A. ŚCIANA TYLNA (Pionowa płyta)
    // Budujemy ją z BoxGeometry
    const wallGeo = new THREE.BoxGeometry(WIDTH, HEIGHT, WALL_THICKNESS);
    const wall = new THREE.Mesh(wallGeo, concreteMat);
    wall.position.set(0, HEIGHT/2, backWallZ);
    wall.castShadow = true;
    wall.receiveShadow = true;
    mainGroup.add(wall);

    // B. DACH (Pozioma płyta)
    // Dach wychodzi do przodu.
    // Jego środek Z to 0. (Od -DEPTH/2 do +DEPTH/2)
    const roofGeo = new THREE.BoxGeometry(WIDTH, ROOF_THICKNESS, DEPTH);
    const roof = new THREE.Mesh(roofGeo, concreteMat);
    // Dach leży na szczycie ściany
    roof.position.set(0, HEIGHT - ROOF_THICKNESS/2, 0); 
    roof.castShadow = true;
    roof.receiveShadow = true;
    mainGroup.add(roof);

    // C. OBRÓBKA BLACHARSKA (Flashing) - Detal ze zdjęcia
    // Cienka ciemna płyta na samym szczycie dachu
    const flashingGeo = new THREE.BoxGeometry(WIDTH + 0.02, 0.02, DEPTH + 0.02);
    const flashing = new THREE.Mesh(flashingGeo, frameMat);
    flashing.position.set(0, HEIGHT + 0.01, 0); // Na samej górze
    flashing.castShadow = true;
    mainGroup.add(flashing);

    // D. PANEL LED (Szklany wkład)
    // Wycinek w suficie - symulujemy go dodając płaski panel pod spodem dachu,
    // otoczony ramką z materiału betonu, żeby wyglądał na wpuszczony.
    
    // Ramka LED (żeby szkło nie dotykało krawędzi)
    const glassMargin = 0.15; // 15cm marginesu od krawędzi dachu
    const glassW = WIDTH - 2*glassMargin;
    const glassD = DEPTH - 2*glassMargin; // Odejmujemy marginesy (płyta tylna jest grubsza)

    const glassPanelGeo = new THREE.BoxGeometry(glassW, 0.02, glassD);
    const glassPanel = new THREE.Mesh(glassPanelGeo, glassMat);
    // Pozycja: Spód dachu + odrobina w górę (wcięcie)
    glassPanel.position.set(0, HEIGHT - ROOF_THICKNESS - 0.01, (DEPTH/2 - glassD/2) - glassMargin); 
    // Przesunięcie Z: szkło jest centrowane w części wiszącej (nie wchodzi w ścianę tylną)
    // Część wisząca ma głębokość: DEPTH - WALL_THICKNESS
    const overhangDepth = DEPTH - WALL_THICKNESS;
    const overhangCenterZ = (DEPTH/2) - (overhangDepth/2);
    glassPanel.position.z = overhangCenterZ;

    mainGroup.add(glassPanel);
    ledMeshRef.current = glassPanel;

    // Źródło światła
    const spotLight = new THREE.PointLight(0xffffee, 3, 4);
    spotLight.position.set(0, HEIGHT - 0.2, overhangCenterZ);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);
    ledLightRef.current = spotLight;

    // E. DETALE KONSTRUKCYJNE (Opcjonalne listwy boczne, jeśli to SLAB FENCE)
    // Na zdjęciu widać gładki beton, ale dodajmy delikatne profile boczne od wewnątrz, 
    // żeby nawiązać do konstrukcji stalowej Slab Fence.
    const strutGeo = new THREE.BoxGeometry(0.04, HEIGHT - ROOF_THICKNESS, 0.04);
    
    const strutL = new THREE.Mesh(strutGeo, frameMat);
    strutL.position.set(-WIDTH/2 + 0.02, (HEIGHT - ROOF_THICKNESS)/2, backWallZ - WALL_THICKNESS/2 + 0.02);
    // mainGroup.add(strutL); // Opcjonalne - na zdjęciu tego nie widać, więc ukrywam

    // 4. OTOCZENIE
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({ color: 0xe5edf9, roughness: 1 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight); // Doświetlenie tyłu

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // ANIMACJA
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // RESIZE
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // UPDATE MATERIAŁU
  useEffect(() => {
    if (frameMatRef.current) {
      frameMatRef.current.color.set(colorHex || "#2d2d2d");
      frameMatRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
      frameMatRef.current.metalness = finish === "mat" ? 0.3 : 0.5;
    }
  }, [colorHex, finish]);

  // UPDATE LED
  useEffect(() => {
    const light = ledLightRef.current;
    const mesh = ledMeshRef.current;
    if (!light || !mesh) return;

    // cast to a material type that has emissive/emissiveIntensity
    const mat = mesh.material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;

    if (isLightOn) {
      light.intensity = 3;
      mat.emissive = new THREE.Color(0xffffee);
      // some materials use emissiveIntensity
      (mat as any).emissiveIntensity = 1.5;
    } else {
      light.intensity = 0;
      if ('emissive' in mat) mat.emissive.set(0x000000);
      (mat as any).emissiveIntensity = 0;
    }

    mat.needsUpdate = true;
  }, [isLightOn]);

  // UPDATE TEKSTURY
  useEffect(() => {
    const mat = concreteMatRef.current;
    if (!mat) return;
    if (!panelTextureUrl) {
      if (mat.map) {
        mat.map.dispose();
        mat.map = null;
        mat.needsUpdate = true;
      }
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(panelTextureUrl, (tex) => {
        // Skalowanie tekstury dla realizmu betonu
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 2); 
        if (mat.map) mat.map.dispose();
        mat.map = tex;
        mat.needsUpdate = true;
    });
  }, [panelTextureUrl]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-soft bg-transparent">
       {/* Kontrolki */}
       <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setIsLightOn(!isLightOn); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border ${isLightOn ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white text-gray-400 border-gray-200'}`}
          title="Włącz/Wyłącz LED"
        >
          <FaLightbulb />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsAutoRotating(!isAutoRotating); isAutoRotatingRef.current = !isAutoRotating; }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors border ${isAutoRotating ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          <FaSyncAlt size={12} />
        </button>
      </div>

      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg leading-tight">
        <b className="text-[12px] block mb-1">Zadaszenie SLAB</b>
        Pełna płyta (beton/HPL)<br/>
        Oświetlenie LED wpuszczane
      </div>
    </div>
  );
}