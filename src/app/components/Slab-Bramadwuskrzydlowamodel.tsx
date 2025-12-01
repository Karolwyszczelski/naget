"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaDoorOpen, FaDoorClosed, FaSyncAlt } from "react-icons/fa";

type Finish = "mat" | "brokat";

// Usunąłem HandleVariant, bo nie ma już uchwytów
type Props = {
  colorHex: string;            // kolor ramy (RAL)
  finish: Finish;              // mat / brokat
  panelTextureUrl?: string;    // tekstura płyty HPL / fasadowej
  panelLabel?: string;         // nazwa wzoru do wyświetlenia w overlay
};

// --- WYMIARY BRAMY DWUSKRZYDŁOWEJ SLAB ---
const GATE_TOTAL_WIDTH = 4.0;   // Całkowita szerokość wjazdu
const GATE_HEIGHT = 1.6;        // Wysokość skrzydła
const POST_SIZE = 0.12;         // Słupy 120x120

// POPRAWKA: Obliczamy szerokość jednego skrzydła z minimalnym luzem.
// Odejmujemy tylko 5mm (0.005m) na skrzydło na luzy montażowe.
// Daje to ok. 1cm przerwy na środku między skrzydłami.
const LEAF_WIDTH = (GATE_TOTAL_WIDTH / 2) - 0.005; 

// Rama (Profil 60x20 - ustawienie na sztorc)
const FRAME_FACE = 0.02;    // 20mm widoczne od frontu
const FRAME_DEPTH = 0.06;   // 60mm głębokości
const SLAB_THICKNESS = 0.012; // Płyta 12mm

// Detale SLAB
const GAP = 0.004;          // Dylatacja między płytą a ramą (cień)

export default function SlabBramaCleanModel({
  colorHex,
  finish,
  panelTextureUrl,
  panelLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  const leftWingRef = useRef<THREE.Group | null>(null);
  const rightWingRef = useRef<THREE.Group | null>(null);
  
  const isOpenRef = useRef(false);
  const currentAngleRef = useRef(0);
  const isAutoRotatingRef = useRef(true);

  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const concreteMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [uiIsOpen, setUiIsOpen] = useState(false);
  const [uiAutoRotate, setUiAutoRotate] = useState(true);

  // --- INICJALIZACJA SCENY ---
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    // Kamera ustawiona na wprost, żeby pokazać gładką taflę bramy
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.0, 5.5); 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    // --- MATERIAŁY ---
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#262626"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.2 : 0.5,
    });
    frameMatRef.current = frameMat;

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xdcdcdc,
      roughness: 1.0,
      metalness: 0.0,
      bumpScale: 0.005,
    });
    concreteMatRef.current = concreteMat;

    // --- GEOMETRIA ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // SŁUPY GŁÓWNE
    const postGeo = new THREE.BoxGeometry(POST_SIZE, GATE_HEIGHT + 0.1, POST_SIZE);
    const postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(-GATE_TOTAL_WIDTH / 2 - POST_SIZE / 2 - 0.01, (GATE_HEIGHT + 0.1) / 2, 0);
    postL.castShadow = true;
    mainGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, frameMat);
    postR.position.set(GATE_TOTAL_WIDTH / 2 + POST_SIZE / 2 + 0.01, (GATE_HEIGHT + 0.1) / 2, 0);
    postR.castShadow = true;
    mainGroup.add(postR);

    // --- FUNKCJA TWORZĄCA SKRZYDŁO (BEZ UCHWYTÓW) ---
    const createWing = (isLeft: boolean) => {
        const wingGroup = new THREE.Group();
        // Pivot przy słupku
        const pivotX = isLeft ? (-GATE_TOTAL_WIDTH/2) : (GATE_TOTAL_WIDTH/2);
        wingGroup.position.set(pivotX, 0, 0);
        mainGroup.add(wingGroup);

        // Kierunek budowania
        const dir = isLeft ? 1 : -1;

        // A. RAMA 60x20
        const vGeo = new THREE.BoxGeometry(FRAME_FACE, GATE_HEIGHT, FRAME_DEPTH);
        // Pion przy zawiasie (z małym luzem)
        const frameHinge = new THREE.Mesh(vGeo, frameMat);
        frameHinge.position.set((FRAME_FACE/2 + 0.005) * dir, GATE_HEIGHT/2, 0); 
        frameHinge.castShadow = true;
        wingGroup.add(frameHinge);

        // Pion na środku bramy (styk)
        const frameCenter = new THREE.Mesh(vGeo, frameMat);
        // Ustawiamy go na samym końcu obliczonej szerokości skrzydła
        frameCenter.position.set((LEAF_WIDTH - FRAME_FACE/2) * dir, GATE_HEIGHT/2, 0);
        frameCenter.castShadow = true;
        wingGroup.add(frameCenter);

        // Poziomy
        const hWidth = LEAF_WIDTH - 2*FRAME_FACE - 0.005; // Długość belki poziomej
        const hGeo = new THREE.BoxGeometry(hWidth, FRAME_FACE, FRAME_DEPTH);
        
        // Środek geometryczny skrzydła
        const wingCenterOffset = (LEAF_WIDTH / 2 + 0.0025) * dir;

        const frameTop = new THREE.Mesh(hGeo, frameMat);
        frameTop.position.set(wingCenterOffset, GATE_HEIGHT - FRAME_FACE/2, 0);
        frameTop.castShadow = true;
        wingGroup.add(frameTop);

        const frameBot = new THREE.Mesh(hGeo, frameMat);
        frameBot.position.set(wingCenterOffset, FRAME_FACE/2, 0);
        frameBot.castShadow = true;
        wingGroup.add(frameBot);

        // B. PŁYTA (SLAB)
        // Wymiar płyty uwzględnia ramę i dylatację (GAP)
        const slabW = LEAF_WIDTH - (2*FRAME_FACE) - (2*GAP) - 0.005;
        const slabH = GATE_HEIGHT - (2*FRAME_FACE) - (2*GAP);
        const slabGeo = new THREE.BoxGeometry(slabW, slabH, SLAB_THICKNESS);
        const slab = new THREE.Mesh(slabGeo, concreteMat);
        
        // Płyta centrowana w skrzydle, zagłębiona w ramie (Z=0)
        slab.position.set(wingCenterOffset, GATE_HEIGHT/2, 0);
        slab.castShadow = true;
        slab.receiveShadow = true;
        wingGroup.add(slab);

        // UWAGA: USUNIĘTO SEKCJE Z UCHWYTAMI

        // D. ZAWIASY
        const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08);
        const hingeMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 });
        
        const h1 = new THREE.Mesh(hingeGeo, hingeMat);
        h1.position.set(0.005 * dir, GATE_HEIGHT - 0.3, 0);
        wingGroup.add(h1);
        const h2 = new THREE.Mesh(hingeGeo, hingeMat);
        h2.position.set(0.005 * dir, 0.3, 0);
        wingGroup.add(h2);

        return wingGroup;
    };

    leftWingRef.current = createWing(true);
    rightWingRef.current = createWing(false);

    // Podłoże i Światła (bez zmian)
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 5, 10); // Światło prosto z przodu, żeby oświetlić płyty
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Animacja
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }
      const targetAngle = isOpenRef.current ? Math.PI / 2 : 0;
      currentAngleRef.current = THREE.MathUtils.lerp(currentAngleRef.current, targetAngle, 0.06);
      if (leftWingRef.current && rightWingRef.current) {
        leftWingRef.current.rotation.y = -currentAngleRef.current;
        rightWingRef.current.rotation.y = currentAngleRef.current;
      }
      renderer.render(scene, camera);
    };
    animate();

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

  // Aktualizacja koloru ramy
  useEffect(() => {
    if (frameMatRef.current) {
      frameMatRef.current.color.set(colorHex || "#262626");
      frameMatRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
      frameMatRef.current.metalness = finish === "mat" ? 0.2 : 0.5;
      frameMatRef.current.needsUpdate = true;
    }
  }, [colorHex, finish]);

  // Texture loading
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
    loader.load(
      panelTextureUrl,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // Tekstura powtarza się raz na każde skrzydło
        tex.repeat.set(2, 1); 
        if (mat.map) mat.map.dispose();
        mat.map = tex;
        mat.needsUpdate = true;
      }
    );
  }, [panelTextureUrl]);

  const toggleGate = () => {
    isOpenRef.current = !isOpenRef.current;
    setUiIsOpen(isOpenRef.current);
  };

  const toggleAutoRotate = () => {
    isAutoRotatingRef.current = !isAutoRotatingRef.current;
    setUiAutoRotate(isAutoRotatingRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-soft bg-gray-100 cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        toggleGate();
      }}
    >
      {/* UI */}
      <div className="absolute right-3 top-3 flex flex-col gap-2 z-10 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleGate();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border ${
            uiIsOpen
              ? "bg-accent text-white border-accent"
              : "bg-white text-gray-700 border-gray-200"
          }`}
        >
          {uiIsOpen ? <FaDoorClosed /> : <FaDoorOpen />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleAutoRotate();
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors border ${
            uiAutoRotate
              ? "bg-accent text-white border-accent"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          <FaSyncAlt size={12} />
        </button>
      </div>

      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg leading-tight border border-white/10">
        <b className="text-[12px] block mb-1">SLAB FENCE – Brama Dwuskrzydłowa</b>
        <span className="block">
          Płyta: {panelLabel ? panelLabel : "gładka (beton/HPL)"}
        </span>
        <span className="block">
          Konstrukcja: bez widocznych uchwytów
        </span>
      </div>
    </div>
  );
}