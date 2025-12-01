"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaDoorOpen, FaDoorClosed, FaSyncAlt } from "react-icons/fa";

// --- TYPY ---
type Finish = "mat" | "brokat";
type ProfileId = "60x40" | "80x40" | "80x80";
type SpacingId = "4" | "6" | "9";
type FillType = "prosta" | "twist";

type Props = {
  colorHex: string;
  finish: Finish;
  profileId: ProfileId;
  spacingId: SpacingId;
  fillType: FillType;
};

// --- WYMIARY ZGODNE ZE ZDJĘCIEM ---
const GATE_TOTAL_WIDTH = 4.0; 
const GATE_HEIGHT = 1.5; // Całkowita wysokość skrzydła
const POST_HEIGHT = 1.7;
const POST_WIDTH = 0.12;

const LEAF_WIDTH = (GATE_TOTAL_WIDTH / 2) - 0.03; // Szerokość skrzydła (minus luzy)

// Konstrukcja dolna (charakterystyczna dla Stand Up)
const BOTTOM_RAIL_SIZE = 0.04; // Profil 40x40 lub 60x40
const MIDDLE_RAIL_Y = 0.35;    // Wysokość drugiej poprzeczki (tworzącej "drabinkę")
const FRAME_THICKNESS = 0.05;  // Grubość ramy

const PROFILE_DIMENSIONS: Record<
  ProfileId,
  { slatWidth: number; slatDepth: number }
> = {
  "60x40": { slatWidth: 0.06, slatDepth: 0.04 },
  "80x40": { slatWidth: 0.08, slatDepth: 0.04 },
  "80x80": { slatWidth: 0.08, slatDepth: 0.08 },
};

const TWIST_ANGLES: Record<ProfileId, number> = {
  "60x40": 45,
  "80x40": 45,
  "80x80": 15,
};

export default function BramaDwuskrzydlowaPoprawiona({
  colorHex,
  finish,
  profileId,
  spacingId,
  fillType,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  const leftLeafRef = useRef<THREE.Group | null>(null);
  const rightLeafRef = useRef<THREE.Group | null>(null);
  const slatMeshesRef = useRef<THREE.Mesh[]>([]); // Do czyszczenia
  const controlsRef = useRef<any>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const currentAngleRef = useRef(0);
  const isAutoRotatingRef = useRef(true);

  // INICJALIZACJA
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || width * (3 / 4);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6); // Kamera na wprost bramy

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.8, 0);
    controls.autoRotate = isAutoRotatingRef.current;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#363636"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.2 : 0.5,
    });
    metalMaterialRef.current = metalMaterial;

    // --- SŁUPKI ---
    const staticGroup = new THREE.Group();
    scene.add(staticGroup);

    const postGeo = new THREE.BoxGeometry(POST_WIDTH, POST_HEIGHT, POST_WIDTH);
    const createPost = (x: number) => {
      const mesh = new THREE.Mesh(postGeo, metalMaterial);
      mesh.position.set(x, POST_HEIGHT/2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      staticGroup.add(mesh);
    };
    createPost(-GATE_TOTAL_WIDTH/2 - POST_WIDTH/2);
    createPost(GATE_TOTAL_WIDTH/2 + POST_WIDTH/2);

    // --- SETUP SKRZYDEŁ (Puste kontenery) ---
    const leftLeaf = new THREE.Group();
    leftLeaf.position.set(-GATE_TOTAL_WIDTH/2, 0, 0);
    scene.add(leftLeaf);
    leftLeafRef.current = leftLeaf;

    const rightLeaf = new THREE.Group();
    rightLeaf.position.set(GATE_TOTAL_WIDTH/2, 0, 0);
    scene.add(rightLeaf);
    rightLeafRef.current = rightLeaf;

    // --- PODŁOGA ---
    const planeGeo = new THREE.PlaneGeometry(10, 6);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xe5edf9, roughness: 1 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // --- ŚWIATŁO ---
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(-3, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // --- PĘTLA ANIMACJI ---
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }

      // Animacja otwierania
      const target = isOpen ? Math.PI / 2 : 0;
      currentAngleRef.current = THREE.MathUtils.lerp(currentAngleRef.current, target, 0.05);

      if (leftLeafRef.current && rightLeafRef.current) {
        leftLeafRef.current.rotation.y = -currentAngleRef.current;
        rightLeafRef.current.rotation.y = currentAngleRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if(!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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

  // --- AKTUALIZACJA MATERIAŁU ---
  useEffect(() => {
    if (!metalMaterialRef.current) return;
    metalMaterialRef.current.color.set(colorHex || "#363636");
    metalMaterialRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
    metalMaterialRef.current.metalness = finish === "mat" ? 0.2 : 0.5;
  }, [colorHex, finish]);

  // --- GENEROWANIE BRAMY (RAMA + LAMELE) ---
  useEffect(() => {
    const leftLeaf = leftLeafRef.current;
    const rightLeaf = rightLeafRef.current;
    const mat = metalMaterialRef.current;
    if (!leftLeaf || !rightLeaf || !mat) return;

    // 1. Czyścimy stare elementy
    slatMeshesRef.current.forEach(m => {
        m.removeFromParent();
        m.geometry.dispose();
    });
    slatMeshesRef.current = [];

    // Parametry profili
    const pDims = PROFILE_DIMENSIONS[profileId] || PROFILE_DIMENSIONS["60x40"];
    const slatW = pDims.slatWidth;
    const slatD = pDims.slatDepth;
    const spacing = (parseFloat(spacingId) || 6) / 100;

    // Kąt Twist
    const angleDeg = fillType === "twist" ? TWIST_ANGLES[profileId] || 45 : 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    // --- FUNKCJA BUDUJĄCA JEDNO SKRZYDŁO ---
    const buildWing = (group: THREE.Group, isLeft: boolean) => {
        const dir = isLeft ? 1 : -1;
        
        // A. RAMA POZIOMA (Belki konstrukcyjne)
        // Belka dolna (tuż nad ziemią)
        const bottomRailY = 0.08; 
        const bottomRailGeo = new THREE.BoxGeometry(LEAF_WIDTH, BOTTOM_RAIL_SIZE, FRAME_THICKNESS);
        const bottomRail = new THREE.Mesh(bottomRailGeo, mat);
        // Pozycja X: środek skrzydła (przesunięty o połowę szerokości w odpowiednią stronę)
        bottomRail.position.set((LEAF_WIDTH/2 + 0.01) * dir, bottomRailY, 0);
        bottomRail.castShadow = true;
        group.add(bottomRail);
        slatMeshesRef.current.push(bottomRail);

        // Belka środkowa (tworząca efekt drabinki)
        const midRailGeo = new THREE.BoxGeometry(LEAF_WIDTH, BOTTOM_RAIL_SIZE, FRAME_THICKNESS);
        const midRail = new THREE.Mesh(midRailGeo, mat);
        midRail.position.set((LEAF_WIDTH/2 + 0.01) * dir, MIDDLE_RAIL_Y, 0);
        midRail.castShadow = true;
        group.add(midRail);
        slatMeshesRef.current.push(midRail);

        // B. RAMA PIONOWA (Boki skrzydła)
        // Pion przy zawiasie
        const sideH = GATE_HEIGHT;
        const sideGeo = new THREE.BoxGeometry(0.04, sideH, 0.05); // Profil ramy bocznej
        
        const hingePost = new THREE.Mesh(sideGeo, mat);
        hingePost.position.set(0.03 * dir, sideH/2 + 0.05, 0);
        group.add(hingePost);
        slatMeshesRef.current.push(hingePost);

        // Pion na środku bramy
        const lockPost = new THREE.Mesh(sideGeo, mat);
        lockPost.position.set((LEAF_WIDTH - 0.01) * dir, sideH/2 + 0.05, 0);
        group.add(lockPost);
        slatMeshesRef.current.push(lockPost);

        // C. WYPEŁNIENIE (LAMELE)
        // Kluczowa zmiana: Lamele biegną od dolnej belki w górę
        // Startujemy zaraz za ramą pionową
        const startX = 0.06;
        const endX = LEAF_WIDTH - 0.06;
        let x = startX;

        // Geometria lameli - wysoka na całą bramę
        const slatH = GATE_HEIGHT; 
        // Lamele "stoją" na dolnej belce, albo są zrównane z jej dołem.
        // Na zdjęciu wyglądają jakby szły od samego dołu ramy.
        // Y Position = Środek wysokości lameli. Jeśli dół ma być na wys. 0.06 (podstawa ramy), to środek jest wyżej.
        const slatBaseY = bottomRailY - BOTTOM_RAIL_SIZE/2; // Spód ramy
        const slatPosY = slatBaseY + slatH/2;

        const slatGeo = new THREE.BoxGeometry(slatW, slatH, slatD);

        while (x <= endX) {
            const slat = new THREE.Mesh(slatGeo, mat);
            slat.position.set(x * dir, slatPosY, 0);
            slat.rotation.y = angleRad * dir; // Twist
            slat.castShadow = true;
            slat.receiveShadow = true;
            group.add(slat);
            slatMeshesRef.current.push(slat);

            x += slatW + spacing;
        }

        // D. Zawiasy (detal)
        const hingeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12);
        const hingeMat = new THREE.MeshStandardMaterial({color: 0x999999, metalness: 0.8});
        const h1 = new THREE.Mesh(hingeGeo, hingeMat);
        h1.position.set(0, POST_HEIGHT - 0.4, 0);
        const h2 = new THREE.Mesh(hingeGeo, hingeMat);
        h2.position.set(0, 0.4, 0);
        group.add(h1, h2);
        slatMeshesRef.current.push(h1, h2);
    };

    buildWing(leftLeaf, true);
    buildWing(rightLeaf, false);

  }, [profileId, spacingId, fillType]); // Re-render przy zmianie opcji

  return (
    <div ref={containerRef} className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-soft bg-transparent cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
      {/* Kontrolki */}
      <div className="absolute right-3 top-3 flex flex-col gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border ${isOpen ? 'bg-accent text-white border-accent' : 'bg-white text-gray-700 border-gray-200'}`}
        >
          {isOpen ? <FaDoorClosed /> : <FaDoorOpen />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsAutoRotating(!isAutoRotating); isAutoRotatingRef.current = !isAutoRotating; }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors border ${isAutoRotating ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          <FaSyncAlt size={12} />
        </button>
      </div>
      
      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <b>Brama Stand Up Dwuskrzydłowa</b><br/>
        Wiernie odwzorowana konstrukcja
      </div>
    </div>
  );
}