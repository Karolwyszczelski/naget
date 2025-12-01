"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaDoorOpen, FaDoorClosed, FaSyncAlt } from "react-icons/fa";

type Finish = "mat" | "brokat";
type HandleVariant = "flat" | "tube";

type Props = {
  colorHex: string;            // kolor ramy (RAL)
  finish: Finish;              // mat / brokat
  panelTextureUrl?: string;    // tekstura płyty HPL / fasadowej
  panelLabel?: string;         // nazwa wzoru do wyświetlenia w overlay
  handleVariant?: HandleVariant; // typ pochwytu (na razie: płaski / rurka)
  
};

// --- WYMIARY SLAB FENCE (furtka) ---
const GATE_WIDTH = 1.0;
const GATE_HEIGHT = 1.6;
const POST_SIZE = 0.12;

// Rama
const FRAME_FACE = 0.02;
const FRAME_DEPTH = 0.06;
const SLAB_THICKNESS = 0.012;

// Detale
const GAP = 0.004;
const HANDLE_WIDTH = 0.04;
const HANDLE_THICK = 0.01;
const HANDLE_OFFSET = 0.035;

export default function SlabFurtkaModel({
  colorHex,
  finish,
  panelTextureUrl,
  panelLabel,
  handleVariant = "flat",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  // grupa skrzydła
  const gateGroupRef = useRef<THREE.Group | null>(null);
  const isOpenRef = useRef(false);
  const currentAngleRef = useRef(0);
  const isAutoRotatingRef = useRef(true);

  // materiały / meshe
  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const concreteMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const slabRef = useRef<THREE.Mesh | null>(null);

  const handleFlatRef = useRef<THREE.Mesh | null>(null);
  const handleTubeRef = useRef<THREE.Mesh | null>(null);

  const [uiIsOpen, setUiIsOpen] = useState(false);
  const [uiAutoRotate, setUiAutoRotate] = useState(true);

  // --- INICJALIZACJA SCENY ---
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(1.2, 1.5, 3.0);
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
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // --- MATERIAŁY ---
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#262626"),
      roughness: finish === "mat" ? 0.8 : 0.5,
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

    // Słupy
    const postGeo = new THREE.BoxGeometry(POST_SIZE, GATE_HEIGHT + 0.1, POST_SIZE);

    const postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(-GATE_WIDTH / 2 - POST_SIZE / 2 - 0.015, (GATE_HEIGHT + 0.1) / 2, 0);
    postL.castShadow = true;
    mainGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, frameMat);
    postR.position.set(GATE_WIDTH / 2 + POST_SIZE / 2 + 0.015, (GATE_HEIGHT + 0.1) / 2, 0);
    postR.castShadow = true;
    mainGroup.add(postR);

    // Skrzydło furtki (pivot na lewej krawędzi)
    const wing = new THREE.Group();
    wing.position.set(-GATE_WIDTH / 2, 0, 0);
    mainGroup.add(wing);
    gateGroupRef.current = wing;

    // Rama
    const vGeo = new THREE.BoxGeometry(FRAME_FACE, GATE_HEIGHT, FRAME_DEPTH);
    const frameL = new THREE.Mesh(vGeo, frameMat);
    frameL.position.set(FRAME_FACE / 2, GATE_HEIGHT / 2, 0);
    frameL.castShadow = true;
    wing.add(frameL);

    const frameR = new THREE.Mesh(vGeo, frameMat);
    frameR.position.set(GATE_WIDTH - FRAME_FACE / 2, GATE_HEIGHT / 2, 0);
    frameR.castShadow = true;
    wing.add(frameR);

    const hWidth = GATE_WIDTH - 2 * FRAME_FACE;
    const hGeo = new THREE.BoxGeometry(hWidth, FRAME_FACE, FRAME_DEPTH);

    const frameTop = new THREE.Mesh(hGeo, frameMat);
    frameTop.position.set(GATE_WIDTH / 2, GATE_HEIGHT - FRAME_FACE / 2, 0);
    frameTop.castShadow = true;
    wing.add(frameTop);

    const frameBot = new THREE.Mesh(hGeo, frameMat);
    frameBot.position.set(GATE_WIDTH / 2, FRAME_FACE / 2, 0);
    frameBot.castShadow = true;
    wing.add(frameBot);

    // Płyta fasadowa
    const slabW = GATE_WIDTH - 2 * FRAME_FACE - 2 * GAP;
    const slabH = GATE_HEIGHT - 2 * FRAME_FACE - 2 * GAP;
    const slabGeo = new THREE.BoxGeometry(slabW, slabH, SLAB_THICKNESS);
    const slab = new THREE.Mesh(slabGeo, concreteMat);
    slab.position.set(GATE_WIDTH / 2, GATE_HEIGHT / 2, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    wing.add(slab);
    slabRef.current = slab;

    // Pochwyt – płaski
    const handleHeight = GATE_HEIGHT;
    const handleGeoFlat = new THREE.BoxGeometry(HANDLE_WIDTH, handleHeight, HANDLE_THICK);
    const handleX = GATE_WIDTH - FRAME_FACE - 0.12;
    const handleZ = FRAME_DEPTH / 2 + HANDLE_OFFSET + HANDLE_THICK / 2;

    const handleFlat = new THREE.Mesh(handleGeoFlat, frameMat);
    handleFlat.position.set(handleX, GATE_HEIGHT / 2, handleZ);
    handleFlat.castShadow = true;
    wing.add(handleFlat);
    handleFlatRef.current = handleFlat;

    // Pochwyt – rurka (drugi wariant)
    const tubeRadius = HANDLE_THICK / 1.6;
    const tubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, handleHeight, 24);
    const handleTube = new THREE.Mesh(tubeGeo, frameMat);
    handleTube.rotation.z = Math.PI / 2;
    handleTube.position.set(handleX, GATE_HEIGHT / 2, handleZ);
    handleTube.castShadow = true;
    handleTube.visible = false; // domyślnie ukryty
    wing.add(handleTube);
    handleTubeRef.current = handleTube;

    // Nóżki mocujące pochwyt
    const mountGeo = new THREE.BoxGeometry(0.015, 0.015, HANDLE_OFFSET);
    const m1 = new THREE.Mesh(mountGeo, frameMat);
    m1.position.set(handleX, GATE_HEIGHT - 0.25, FRAME_DEPTH / 2 + HANDLE_OFFSET / 2);
    wing.add(m1);

    const m2 = new THREE.Mesh(mountGeo, frameMat);
    m2.position.set(handleX, 0.25, FRAME_DEPTH / 2 + HANDLE_OFFSET / 2);
    wing.add(m2);

    // Zawiasy
    const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08);
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 });
    const h1 = new THREE.Mesh(hingeGeo, hingeMat);
    h1.position.set(0, GATE_HEIGHT - 0.3, 0);
    wing.add(h1);

    const h2 = new THREE.Mesh(hingeGeo, hingeMat);
    h2.position.set(0, 0.3, 0);
    wing.add(h2);

    // Podłoże
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Światła
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(-3, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(3, 2, 2);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Animacja
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }

      const targetAngle = isOpenRef.current ? Math.PI / 2 : 0;
      currentAngleRef.current = THREE.MathUtils.lerp(
        currentAngleRef.current,
        targetAngle,
        0.08
      );

      if (gateGroupRef.current) {
        gateGroupRef.current.rotation.y = -currentAngleRef.current;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aktualizacja koloru / struktury ramy
  useEffect(() => {
    if (frameMatRef.current) {
      frameMatRef.current.color.set(colorHex || "#262626");
      frameMatRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
      frameMatRef.current.metalness = finish === "mat" ? 0.3 : 0.6;
      frameMatRef.current.needsUpdate = true;
    }
  }, [colorHex, finish]);

  // texture HPL / fasada na płycie
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
    let cancelled = false;

    loader.load(
      panelTextureUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy =
          rendererRef.current?.capabilities.getMaxAnisotropy() ?? 1;
        if (mat.map) mat.map.dispose();
        mat.map = tex;
        mat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn("Nie udało się załadować tekstury HPL", err);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [panelTextureUrl]);

  // przełączanie wariantu pochwytu
  useEffect(() => {
    const variant = handleVariant ?? "flat";
    if (!handleFlatRef.current || !handleTubeRef.current) return;
    handleFlatRef.current.visible = variant === "flat";
    handleTubeRef.current.visible = variant === "tube";
  }, [handleVariant]);

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
      className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-soft bg-gray-100 cursor-pointer"
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
        <b className="text-[12px] block mb-1">SLAB FENCE – furtka</b>
        <span className="block">
          Płyta:{" "}
          {panelLabel ? panelLabel : "płyta fasadowa HPL / włókno-cement"}
        </span>
        <span className="block">
          Stelaż: stal ocynkowana + kolor z palety RAL
        </span>
      </div>
    </div>
  );
}
