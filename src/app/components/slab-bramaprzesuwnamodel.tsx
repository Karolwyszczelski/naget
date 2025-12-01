"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaDoorOpen, FaDoorClosed, FaSyncAlt } from "react-icons/fa";

type Finish = "mat" | "brokat";

type Props = {
  colorHex: string;            // kolor ramy (RAL)
  finish: Finish;              // mat / brokat
  panelTextureUrl?: string;    // tekstura płyty
};

// --- WYMIARY BRAMY PRZESUWNEJ SLAB (na bazie zdjęcia) ---
const GATE_OPENING_WIDTH = 4.5; // Światło wjazdu (szersze dla 3 dużych płyt)
const GATE_HEIGHT = 1.6;        // Wysokość płyt
const TAIL_WIDTH = 1.8;         // Długość przeciwwagi
const TOTAL_GATE_LENGTH = GATE_OPENING_WIDTH + TAIL_WIDTH;

const POST_SIZE = 0.12;         // Słupy 120x120

// Profile ramy
const FRAME_FACE = 0.04;        // Szerokość profilu od frontu (40mm)
const FRAME_DEPTH = 0.06;       // Głębokość profilu (60mm)
const RAIL_HEIGHT = 0.10;       // Wysokość dolnej szyny jezdnej (masywna)

// Płyty
const SLAB_THICKNESS = 0.015;   // Grubość płyty
const PANEL_COUNT = 3;          // 3 PŁYTY (Zgodnie ze zdjęciem)
const PANEL_GAP = 0.005;        // 5mm przerwy między płytami

export default function SlabBramaPrzesuwnaDetail({
  colorHex,
  finish,
  panelTextureUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  // Grupa przesuwna bramy
  const gateGroupRef = useRef<THREE.Group | null>(null);
  
  const isOpenRef = useRef(false);
  const currentPosRef = useRef(0); 
  const isAutoRotatingRef = useRef(true);

  // Materiały
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

    // Kamera ustawiona tak, by objąć długą bramę
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 9.0); 
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
      color: new THREE.Color(colorHex || "#2d2d2d"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.3 : 0.6,
    });
    frameMatRef.current = frameMat;

    // Beton / Płyta
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.005,
    });
    concreteMatRef.current = concreteMat;

    // --- GEOMETRIA ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. SŁUPY STACJONARNE
    const postGeo = new THREE.BoxGeometry(POST_SIZE, GATE_HEIGHT + 0.2, POST_SIZE);

    // Słupek lewy (domykowy)
    const postCatch = new THREE.Mesh(postGeo, frameMat);
    postCatch.position.set(-GATE_OPENING_WIDTH / 2 - POST_SIZE / 2 - 0.05, (GATE_HEIGHT + 0.2) / 2, 0);
    postCatch.castShadow = true;
    mainGroup.add(postCatch);

    // Słupek prawy (prowadzący - bramka przejeżdża obok niego)
    // Ustawiamy go z tyłu bramy (offset Z), jak w typowych bramach przesuwnych
    const postGuide = new THREE.Mesh(postGeo, frameMat);
    postGuide.position.set(GATE_OPENING_WIDTH / 2 + POST_SIZE / 2 + 0.05, (GATE_HEIGHT + 0.2) / 2, -POST_SIZE); 
    postGuide.castShadow = true;
    mainGroup.add(postGuide);

    // Rolki prowadzące (detal na słupku)
    const rollerGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1);
    const roller = new THREE.Mesh(rollerGeo, frameMat);
    roller.rotation.x = Math.PI/2;
    roller.position.set(GATE_OPENING_WIDTH / 2 + POST_SIZE / 2 + 0.05, GATE_HEIGHT + 0.1, -POST_SIZE/2 + 0.15);
    mainGroup.add(roller);


    // 2. BRAMA PRZESUWNA (Cała konstrukcja)
    const gate = new THREE.Group();
    // Ustawiamy pozycję początkową tak, by brama zamykała światło wjazdu
    // Środek bramy (geometryczny) musi być przesunięty, bo brama ma ogon.
    // Długość części wjazdowej = GATE_OPENING_WIDTH
    // Długość ogona = TAIL_WIDTH
    // Środek części wjazdowej = 0 (wględem sceny)
    // Przesunięcie środka całej grupy = TAIL_WIDTH / 2 w prawo
    const startX = -TAIL_WIDTH / 2; 
    gate.position.set(startX, 0, 0);
    mainGroup.add(gate);
    gateGroupRef.current = gate;
    currentPosRef.current = startX;

    // A. SZYNA JEZDNA (Dół - przez całą długość)
    const railGeo = new THREE.BoxGeometry(TOTAL_GATE_LENGTH, RAIL_HEIGHT, FRAME_DEPTH);
    const rail = new THREE.Mesh(railGeo, frameMat);
    rail.position.set(0, RAIL_HEIGHT / 2, 0);
    rail.castShadow = true;
    gate.add(rail);

    // --- CZĘŚĆ GŁÓWNA (3 PANELE) ---
    // Obliczamy pozycję części głównej względem środka grupy
    const mainPartCenterX = -TAIL_WIDTH / 2;
    const mainPartBaseY = RAIL_HEIGHT; // Zaczyna się nad szyną

    // 1. Rama zewnętrzna części głównej
    // Pion lewy (czoło bramy)
    const vGeo = new THREE.BoxGeometry(FRAME_FACE, GATE_HEIGHT, FRAME_DEPTH);
    const frameL = new THREE.Mesh(vGeo, frameMat);
    frameL.position.set(mainPartCenterX - GATE_OPENING_WIDTH/2 + FRAME_FACE/2, mainPartBaseY + GATE_HEIGHT/2, 0);
    frameL.castShadow = true;
    gate.add(frameL);

    // Pion prawy (oddziela panele od ogona)
    const frameR = new THREE.Mesh(vGeo, frameMat);
    frameR.position.set(mainPartCenterX + GATE_OPENING_WIDTH/2 - FRAME_FACE/2, mainPartBaseY + GATE_HEIGHT/2, 0);
    frameR.castShadow = true;
    gate.add(frameR);

    // Poziom góra
    const hGeo = new THREE.BoxGeometry(GATE_OPENING_WIDTH, FRAME_FACE, FRAME_DEPTH);
    const frameTop = new THREE.Mesh(hGeo, frameMat);
    frameTop.position.set(mainPartCenterX, mainPartBaseY + GATE_HEIGHT - FRAME_FACE/2, 0);
    frameTop.castShadow = true;
    gate.add(frameTop);

    // 2. PANELE (3 równe części)
    // Szerokość dostępna na panele
    const panelsTotalWidth = GATE_OPENING_WIDTH - 2*FRAME_FACE;
    // Odejmujemy przerwy (2 przerwy między 3 panelami + luzy boczne)
    const singlePanelWidth = (panelsTotalWidth - (PANEL_COUNT - 1)*PANEL_GAP) / PANEL_COUNT;
    const panelHeight = GATE_HEIGHT - FRAME_FACE; // Od szyny do górnej belki

    const panelGeo = new THREE.BoxGeometry(singlePanelWidth, panelHeight, SLAB_THICKNESS);

    // Rysowanie 3 paneli
    for(let i=0; i<PANEL_COUNT; i++) {
        const panel = new THREE.Mesh(panelGeo, concreteMat);
        
        // Obliczanie pozycji X
        // Startujemy od lewej wewnętrznej krawędzi
        const startInnerX = mainPartCenterX - panelsTotalWidth/2;
        // Przesuwamy o połowę panelu + indeks * (szerokość + przerwa)
        const posX = startInnerX + (singlePanelWidth/2) + i*(singlePanelWidth + PANEL_GAP);

        panel.position.set(posX, mainPartBaseY + panelHeight/2, 0);
        panel.castShadow = true;
        panel.receiveShadow = true;
        gate.add(panel);
    }

    // --- OGON (PRZECIWWAGA) ---
    // Trójkąt prostokątny z dwoma pionami w środku
    const tailStartLocalX = mainPartCenterX + GATE_OPENING_WIDTH/2; // Początek ogona
    const tailEndLocalX = tailStartLocalX + TAIL_WIDTH;             // Koniec ogona
    
    // Górny profil ukośny (przeciwprostokątna)
    // Punkt A (góra, styk z bramą): [tailStartLocalX, mainPartBaseY + GATE_HEIGHT]
    // Punkt B (dół, koniec szyny): [tailEndLocalX, mainPartBaseY]
    
    const deltaX = tailEndLocalX - tailStartLocalX;
    const deltaY = GATE_HEIGHT; // Różnica wysokości
    const diagLen = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    const diagGeo = new THREE.BoxGeometry(diagLen, FRAME_FACE, FRAME_DEPTH);
    const diagonal = new THREE.Mesh(diagGeo, frameMat);
    // Środek belki ukośnej
    diagonal.position.set(tailStartLocalX + deltaX/2, mainPartBaseY + deltaY/2, 0);
    diagonal.rotation.z = -angle; // Obrót w dół
    diagonal.castShadow = true;
    gate.add(diagonal);

    // Piony w ogonie (2 sztuki, równomiernie rozmieszczone)
    const strutsCount = 2;
    // Dzielimy ogon na 3 sekcje (start -> s1 -> s2 -> koniec)
    const stepX = TAIL_WIDTH / (strutsCount + 1);

    for(let i=1; i<=strutsCount; i++) {
        const xOffset = i * stepX;
        const currentX = tailStartLocalX + xOffset;
        
        // Obliczamy wysokość trójkąta w tym punkcie (z twierdzenia Talesa)
        // Wysokość maleje liniowo wraz z odległością od bramy
        const currentH = GATE_HEIGHT * (1 - (xOffset / TAIL_WIDTH));
        
        const strutGeo = new THREE.BoxGeometry(FRAME_FACE, currentH, FRAME_DEPTH);
        const strut = new THREE.Mesh(strutGeo, frameMat);
        
        // Pozycja Y: środek słupka (zaczyna się od szyny w górę)
        strut.position.set(currentX, mainPartBaseY + currentH/2, 0);
        strut.castShadow = true;
        gate.add(strut);
    }


    // Podłoże
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 6),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Światła
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 8, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    // Szeroki zakres cienia dla długiej bramy
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-5, 2, 5);
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

      // Logika otwierania
      // Zamknięta: startX (-TAIL_WIDTH/2)
      // Otwarta: startX + GATE_OPENING_WIDTH (przesuwamy w prawo o szerokość wjazdu)
      const closedX = -TAIL_WIDTH / 2;
      const openX = closedX + GATE_OPENING_WIDTH;
      const targetX = isOpenRef.current ? openX : closedX;

      currentPosRef.current = THREE.MathUtils.lerp(
        currentPosRef.current,
        targetX,
        0.04
      );

      if (gateGroupRef.current) {
        gateGroupRef.current.position.x = currentPosRef.current;
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

  // Update materiałów
  useEffect(() => {
    if (frameMatRef.current) {
      frameMatRef.current.color.set(colorHex || "#2d2d2d");
      frameMatRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
      frameMatRef.current.metalness = finish === "mat" ? 0.3 : 0.6;
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
        // Powtarzamy teksturę na 3 panele
        tex.repeat.set(3, 1); 
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
        <b className="text-[12px] block mb-1">SLAB FENCE – Brama Przesuwna</b>
        <span className="block">Wypełnienie: 3 panele Slab</span>
        <span className="block">Ogon: Trójkąt z 2 słupkami</span>
      </div>
    </div>
  );
}