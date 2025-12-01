"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaPause, FaPlay, FaSyncAlt } from "react-icons/fa";

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
const GATE_HEIGHT = 1.5;       // Całkowita wysokość sztachet od szyny
const GATE_OPENING_WIDTH = 4.0; 
const TAIL_WIDTH = 1.8;        // Długość przeciwwagi
const TOTAL_WIDTH = GATE_OPENING_WIDTH + TAIL_WIDTH;
const POST_HEIGHT = 1.7; 
const POST_WIDTH = 0.10; 

// Wymiary profili konstrukcyjnych
const GUIDE_RAIL_HEIGHT = 0.08; // Szyna jezdna 80x80
const MOUNT_PROFILE_HEIGHT = 0.04; // Profil pod sztachetami
const BOTTOM_GAP = 0.06; // Prześwit między szyną a profilem montażowym (efekt drabinki)

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

export default function BramaPrzesuwnaModel({
  colorHex,
  finish,
  profileId,
  spacingId,
  fillType,
}: Props) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gateFrameGroupRef = useRef<THREE.Group | null>(null);
  const slatsRef = useRef<THREE.Mesh[]>([]);
  const controlsRef = useRef<any>(null);

  const [isGateAnimating, setIsGateAnimating] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const isGateAnimatingRef = useRef(true);
  const isAutoRotatingRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || width * (3 / 4);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 9.5); // Widok lekko z dołu/frontu jak na zdjęciu

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

    // --- SŁUPKI STACJONARNE ---
    const staticGroup = new THREE.Group();
    scene.add(staticGroup);

    const createPost = (xPos: number, isGuide: boolean) => {
      const geometry = new THREE.BoxGeometry(POST_WIDTH, POST_HEIGHT, POST_WIDTH);
      const post = new THREE.Mesh(geometry, metalMaterial);
      // Słupek prowadzący (prawy) musi być odsunięty, żeby brama (ogon) przejechała
      const zOffset = isGuide ? POST_WIDTH + 0.05 : 0;
      post.position.set(xPos, POST_HEIGHT / 2, zOffset);
      post.castShadow = true;
      post.receiveShadow = true;
      return post;
    };

    // Lewy słupek (domykowy)
    const catchPost = createPost(-GATE_OPENING_WIDTH / 2 - POST_WIDTH, false);
    staticGroup.add(catchPost);

    // Prawy słupek (prowadzący) - przy nim są rolki
    const guidePost = createPost(GATE_OPENING_WIDTH / 2 + POST_WIDTH, true);
    staticGroup.add(guidePost);

    // --- BRAMA PRZESUWNA (Ruchoma) ---
    const gateFrameGroup = new THREE.Group();
    scene.add(gateFrameGroup);
    gateFrameGroupRef.current = gateFrameGroup;

    // Funkcja pomocnicza do belek
    const createBar = (w: number, h: number, d: number, x: number, y: number, z: number, rotZ: number = 0) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, metalMaterial);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rotZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // 1. SZYNA JEZDNA (Najniższy element, przez całą długość)
    // Pozycja Y = połowa wysokości szyny
    const railY = GUIDE_RAIL_HEIGHT / 2;
    // Środek X całej belki:
    const railCenterX = (-GATE_OPENING_WIDTH / 2) + (TOTAL_WIDTH / 2);
    
    const guideRail = createBar(TOTAL_WIDTH, GUIDE_RAIL_HEIGHT, 0.08, railCenterX, railY, 0);
    gateFrameGroup.add(guideRail);

    // 2. PROFIL MONTAŻOWY (Nad szyną, pod sztachetami)
    // Jest krótszy - kończy się tam, gdzie zaczyna się trójkąt ogona (mniej więcej)
    // Chociaż na zdjęciu wygląda, że idzie przez całą długość światła + kawałek ogona.
    // Przyjmijmy, że idzie przez całą długość bramy (spójność konstrukcji).
    const mountProfileY = GUIDE_RAIL_HEIGHT + BOTTOM_GAP + MOUNT_PROFILE_HEIGHT / 2;
    const mountProfile = createBar(TOTAL_WIDTH, MOUNT_PROFILE_HEIGHT, 0.06, railCenterX, mountProfileY, 0);
    gateFrameGroup.add(mountProfile);

    // 3. ŁĄCZNIKI (DRABINKA) - Małe klocki między szyną a profilem
    const spacerCount = Math.floor(TOTAL_WIDTH / 0.5); // Co pół metra
    const spacerGeo = new THREE.BoxGeometry(0.02, BOTTOM_GAP, 0.04);
    for(let i=0; i<=spacerCount; i++) {
        const x = (-GATE_OPENING_WIDTH/2) + (i * (TOTAL_WIDTH/spacerCount));
        const spacer = new THREE.Mesh(spacerGeo, metalMaterial);
        spacer.position.set(x, GUIDE_RAIL_HEIGHT + BOTTOM_GAP/2, 0);
        spacer.castShadow = true;
        gateFrameGroup.add(spacer);
    }

    // 4. SŁUPEK KONSTRUKCYJNY (Oddziela światło od ogona)
    // To jest ten gruby profil pionowy, od którego zaczyna się skos
    const mainStructuralPostX = GATE_OPENING_WIDTH / 2; 
    // Wysokość słupka od góry profilu montażowego do szczytu
    const structuralPostHeight = GATE_HEIGHT; 
    const structuralPostY = mountProfileY + MOUNT_PROFILE_HEIGHT/2 + structuralPostHeight/2;
    
    const structPost = createBar(0.08, structuralPostHeight, 0.08, mainStructuralPostX, structuralPostY, 0);
    gateFrameGroup.add(structPost);

    // 5. UKOS (PRZECIWWAGA)
    // Punkty zaczepienia
    const tailStartX = mainStructuralPostX;
    const tailStartY = mountProfileY + MOUNT_PROFILE_HEIGHT/2 + structuralPostHeight; // Szczyt słupka
    const tailEndX = mainStructuralPostX + TAIL_WIDTH;
    const tailEndY = mountProfileY; // Do poziomu profilu montażowego/szyny

    const deltaX = tailEndX - tailStartX;
    const deltaY = tailStartY - tailEndY;
    const diagLen = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    const diagonal = createBar(
        diagLen, 0.06, 0.06, 
        tailStartX + deltaX/2, 
        tailStartY - deltaY/2, 
        0, 
        -angle
    );
    gateFrameGroup.add(diagonal);

    // 6. WZMOCNIENIA PIONOWE W OGONIE (DWA, zgodnie ze zdjęciem)
    const tailBraceYBase = mountProfileY + MOUNT_PROFILE_HEIGHT/2;
    
    // Wspornik 1 (bliżej środka)
    const brace1X = tailStartX + (TAIL_WIDTH * 0.33);
    // Obliczamy wysokość w tym punkcie z trójkąta
    const brace1Height = structuralPostHeight * 0.66; 
    const brace1 = createBar(0.04, brace1Height, 0.04, brace1X, tailBraceYBase + brace1Height/2, 0);
    gateFrameGroup.add(brace1);

    // Wspornik 2 (dalej)
    const brace2X = tailStartX + (TAIL_WIDTH * 0.66);
    const brace2Height = structuralPostHeight * 0.33;
    const brace2 = createBar(0.04, brace2Height, 0.04, brace2X, tailBraceYBase + brace2Height/2, 0);
    gateFrameGroup.add(brace2);

    // --- PODŁOGA ---
    const planeGeo = new THREE.PlaneGeometry(15, 8);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xe5edf9,
      roughness: 1,
      metalness: 0,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);

    // OŚWIETLENIE
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    // Dopasowanie cienia do długiej bramy
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    scene.add(dirLight);

    // ANIMACJA
    let time = 0;
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }

      if (gateFrameGroupRef.current && isGateAnimatingRef.current) {
        time += 0.01;
        const progress = (Math.sin(time) + 1) / 2; // 0..1
        // Przesuw w prawo (otwieranie)
        // Brama musi zjechać tak, żeby odsłonić światło wjazdu (4m)
        gateFrameGroupRef.current.position.x = progress * (GATE_OPENING_WIDTH - 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || w * (3 / 4);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      controlsRef.current = null;
    };
  }, []);

  // UPDATE MATERIAŁU
  useEffect(() => {
    if (!metalMaterialRef.current) return;
    metalMaterialRef.current.color.set(colorHex || "#363636");
    if (finish === "mat") {
      metalMaterialRef.current.roughness = 0.8;
      metalMaterialRef.current.metalness = 0.2;
    } else {
      metalMaterialRef.current.roughness = 0.4;
      metalMaterialRef.current.metalness = 0.5;
    }
  }, [colorHex, finish]);

  // GENEROWANIE SZTACHET (Wypełnienie)
  useEffect(() => {
    const gateGroup = gateFrameGroupRef.current;
    const material = metalMaterialRef.current;
    if (!gateGroup || !material) return;

    // Usuń stare sztachety
    slatsRef.current.forEach((mesh) => {
      gateGroup.remove(mesh);
    });
    slatsRef.current = [];

    const profileDims = PROFILE_DIMENSIONS[profileId as ProfileId] || PROFILE_DIMENSIONS["60x40"];
    const slatWidth = profileDims.slatWidth;
    const slatDepth = profileDims.slatDepth;
    
    // Wysokość sztachet
    // Sztachety stoją na profilu montażowym i sięgają do samej góry (równo ze słupkiem konstrukcyjnym)
    const slatFullHeight = GATE_HEIGHT; 

    const spacingCm = parseFloat(spacingId) || 6;
    const gap = spacingCm / 100;

    const angleDeg = fillType === "twist" ? TWIST_ANGLES[profileId as ProfileId] || 45 : 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Obliczamy pozycje Y startową (góra profilu montażowego)
    // Szyna (0.08) + Przerwa (0.06) + Profil (0.04)
    const mountProfileTopY = GUIDE_RAIL_HEIGHT + BOTTOM_GAP + MOUNT_PROFILE_HEIGHT;
    const slatCenterY = mountProfileTopY + slatFullHeight / 2;

    // Generujemy od lewej krawędzi bramy do słupka konstrukcyjnego
    // Lewa krawędź ramy to: -GATE_OPENING_WIDTH / 2
    // Prawa granica to: GATE_OPENING_WIDTH / 2 (tam stoi gruby słupek)
    
    const startX = (-GATE_OPENING_WIDTH / 2) + 0.02 + slatWidth/2;
    const endX = (GATE_OPENING_WIDTH / 2) - 0.08; // Odejmujemy grubość słupka

    let currentX = startX;

    while (currentX <= endX) {
      const geom = new THREE.BoxGeometry(slatWidth, slatFullHeight, slatDepth);
      const slat = new THREE.Mesh(geom, material);
      
      slat.position.set(currentX, slatCenterY, 0);
      slat.castShadow = true;
      slat.receiveShadow = true;
      slat.rotation.y = angleRad; // Obsługa Twist
      
      gateGroup.add(slat);
      slatsRef.current.push(slat);

      currentX += slatWidth + gap;
    }

  }, [profileId, spacingId, fillType]);

  const toggleGateAnimation = () => {
    setIsGateAnimating((prev) => {
      const next = !prev;
      isGateAnimatingRef.current = next;
      return next;
    });
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating((prev) => {
      const next = !prev;
      isAutoRotatingRef.current = next;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next;
      }
      return next;
    });
  };

  const handleWrapperClick = () => {
    toggleGateAnimation();
  };

  return (
    <div
      ref={outerRef}
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-soft bg-transparent"
      onClick={handleWrapperClick}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Kontrolki */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleGateAnimation();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] shadow-md transition-colors ${
            isGateAnimating
              ? "bg-white text-accent border-accent"
              : "bg-white/80 text-neutral-600 border-border"
          }`}
        >
          {isGateAnimating ? <FaPause /> : <FaPlay />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleAutoRotate();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] shadow-md transition-colors ${
            isAutoRotating
              ? "bg-white text-accent border-accent"
              : "bg-white/80 text-neutral-600 border-border"
          }`}
        >
          <FaSyncAlt />
        </button>
      </div>

      <div className="pointer-events-none absolute left-2 bottom-2 z-10 max-w-[75%] max-h-[20%] rounded-xl bg-white/45 backdrop-blur px-2 py-1 text-[4px] leading-tight text-white">
        <p className="font-semibold uppercase mb-1 text-[8px]">
          Brama Przesuwna Stand Up
        </p>
        <p className="text-[7px]">Konstrukcja samonośna z podwójną szyną</p>
      </div>
    </div>
  );
}