"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FaLightbulb, FaSyncAlt } from "react-icons/fa";

// --- TYPY ---
type Finish = "mat" | "brokat";
type ProfileId = "60x40" | "80x40" | "80x80";
type SpacingId = "2" | "4" | "6" | "9";
type FillType = "prosta" | "twist";

type Props = {
  colorHex: string;
  finish: Finish;
  profileId: ProfileId;
  spacingId: SpacingId;
  fillType: FillType;
};

// --- WYMIARY (cm -> m) ---
const ROOF_WIDTH = 1.2;    // Szerokość daszka
const ROOF_DEPTH = 1.0;    // Głębokość wysięgu
const HEIGHT = 2.4;        // Wysokość całkowita
const POST_SIZE = 0.10;    // Słupy 100x100mm
const ROOF_THICKNESS = 0.12; // Grubość ramy dachu

// Parametry profili wypełnienia (tylna ściana)
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

export default function ZadaszenieModel({
  colorHex,
  finish,
  profileId,
  spacingId,
  fillType,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Refy do materiałów i obiektów
  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glassMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const ledLightRef = useRef<THREE.PointLight | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);
  
  const slatGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);

  // Stan
  const [isLightOn, setIsLightOn] = useState(true); // Lampa domyślnie włączona
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const isAutoRotatingRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || width * 1.2;

    // 1. SCENA
    const scene = new THREE.Scene();
    scene.background = null; 

    // 2. KAMERA (Widok od dołu/boku, żeby pokazać lampę i daszek)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(2, 1.8, 2.5); 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.2, 0); // Celujemy w środek wysokości
    controls.autoRotate = isAutoRotatingRef.current;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 3. MATERIAŁY
    // Metal (Stal malowana proszkowo)
    const metalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#363636"),
      roughness: finish === "mat" ? 0.8 : 0.4,
      metalness: finish === "mat" ? 0.2 : 0.5,
    });
    metalMaterialRef.current = metalMat;

    // Szkło mleczne (bezpieczne)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.2,
      transmission: 0.6, // Przepuszczalność światła (półprzezroczyste)
      thickness: 0.02,
      transparent: true,
      opacity: 0.8,      // Mleczny efekt
      side: THREE.DoubleSide
    });
    glassMaterialRef.current = glassMat;

    // --- BUDOWA MODELU ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. SŁUPY NOŚNE (TYLNE)
    const postGeo = new THREE.BoxGeometry(POST_SIZE, HEIGHT, POST_SIZE);
    
    // Lewy słup
    const leftPost = new THREE.Mesh(postGeo, metalMat);
    leftPost.position.set(-ROOF_WIDTH/2 + POST_SIZE/2, HEIGHT/2, -ROOF_DEPTH/2 + POST_SIZE/2);
    leftPost.castShadow = true;
    leftPost.receiveShadow = true;
    mainGroup.add(leftPost);

    // Prawy słup
    const rightPost = new THREE.Mesh(postGeo, metalMat);
    rightPost.position.set(ROOF_WIDTH/2 - POST_SIZE/2, HEIGHT/2, -ROOF_DEPTH/2 + POST_SIZE/2);
    rightPost.castShadow = true;
    rightPost.receiveShadow = true;
    mainGroup.add(rightPost);

    // Dolna belka łącząca słupy (stabilizacja, jak na zdjęciu)
    const bottomBarGeo = new THREE.BoxGeometry(ROOF_WIDTH, 0.04, 0.04);
    const bottomBar = new THREE.Mesh(bottomBarGeo, metalMat);
    bottomBar.position.set(0, 0.02, -ROOF_DEPTH/2 + POST_SIZE/2);
    mainGroup.add(bottomBar);

    // B. RAMA DACHOWA (GÓRA)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, HEIGHT - ROOF_THICKNESS/2, 0); // Na szczycie
    mainGroup.add(roofGroup);

    // Funkcja belki ramy dachu
    const createRoofBar = (w: number, h: number, d: number, x: number, z: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metalMat);
        m.position.set(x, 0, z);
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
    };

    // Belka tylna (między słupami)
    roofGroup.add(createRoofBar(ROOF_WIDTH, ROOF_THICKNESS, POST_SIZE, 0, -ROOF_DEPTH/2 + POST_SIZE/2));
    // Belka przednia
    roofGroup.add(createRoofBar(ROOF_WIDTH, ROOF_THICKNESS, POST_SIZE, 0, ROOF_DEPTH/2 - POST_SIZE/2));
    // Belka lewa (łącząca)
    roofGroup.add(createRoofBar(POST_SIZE, ROOF_THICKNESS, ROOF_DEPTH - 2*POST_SIZE, -ROOF_WIDTH/2 + POST_SIZE/2, 0));
    // Belka prawa (łącząca)
    roofGroup.add(createRoofBar(POST_SIZE, ROOF_THICKNESS, ROOF_DEPTH - 2*POST_SIZE, ROOF_WIDTH/2 - POST_SIZE/2, 0));

    // C. SZKŁO MLECZNE (Wypełnienie dachu)
    // Wymiar szkła to wnętrze ramki
    const glassW = ROOF_WIDTH - 2*POST_SIZE;
    const glassD = ROOF_DEPTH - 2*POST_SIZE;
    const glassGeo = new THREE.PlaneGeometry(glassW, glassD);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = 0.02; // Lekko podniesione względem środka ramy
    roofGroup.add(glass);

    // D. LAMPA LED (Poniżej szkła)
    // Obudowa lampy
    const lampGeo = new THREE.BoxGeometry(0.3, 0.02, 0.3);
    const lampMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        emissive: 0xffffee, 
        emissiveIntensity: 0.5 
    });
    const lampMesh = new THREE.Mesh(lampGeo, lampMat);
    lampMesh.position.set(0, -ROOF_THICKNESS/2 - 0.01, 0); // Pod ramą
    roofGroup.add(lampMesh);
    ledMeshRef.current = lampMesh;

    // Źródło światła (PointLight rzucający światło w dół)
    const spotLight = new THREE.PointLight(0xffffee, 5, 5);
    spotLight.position.set(0, HEIGHT - 0.2, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);
    ledLightRef.current = spotLight;

    // E. WYPEŁNIENIE TYLNE (Dynamiczne - Slat Group)
    const slatGroup = new THREE.Group();
    // Pozycjonujemy grupę slatów między tylnymi słupami
    slatGroup.position.set(0, 0, -ROOF_DEPTH/2 + POST_SIZE/2);
    mainGroup.add(slatGroup);
    slatGroupRef.current = slatGroup;


    // ŚRODOWISKO
    const planeGeo = new THREE.PlaneGeometry(8, 8);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xe5edf9, roughness: 1 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(5, 5, 8);
    sunLight.castShadow = true;
    scene.add(sunLight);


    // PĘTLA
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

  // UPDATE MATERIAŁU
  useEffect(() => {
    if (metalMaterialRef.current) {
      metalMaterialRef.current.color.set(colorHex || "#363636");
      metalMaterialRef.current.roughness = finish === "mat" ? 0.8 : 0.4;
      metalMaterialRef.current.metalness = finish === "mat" ? 0.2 : 0.5;
    }
  }, [colorHex, finish]);

  // UPDATE ŚWIATŁA LED
  useEffect(() => {
    if(ledLightRef.current && ledMeshRef.current) {
        if(isLightOn) {
            ledLightRef.current.intensity = 5;
            // @ts-ignore
            ledMeshRef.current.material.emissiveIntensity = 2.0;
        } else {
            ledLightRef.current.intensity = 0;
            // @ts-ignore
            ledMeshRef.current.material.emissiveIntensity = 0;
        }
    }
  }, [isLightOn]);

  // GENEROWANIE SZTACHET (Tył)
  useEffect(() => {
    const group = slatGroupRef.current;
    const mat = metalMaterialRef.current;
    if (!group || !mat) return;

    // Clean old
    group.clear();

    const pDims = PROFILE_DIMENSIONS[profileId] || PROFILE_DIMENSIONS["60x40"];
    const w = pDims.slatWidth;
    const d = pDims.slatDepth;
    const spacing = (parseFloat(spacingId) || 6) / 100;
    
    // Kąt
    const angle = fillType === "twist" ? (TWIST_ANGLES[profileId] || 45) * Math.PI / 180 : 0;

    // Obszar do wypełnienia (między słupami)
    // Słupy mają 10cm, dach 120cm. Prześwit = 120 - 20 = 100cm (ok. 1m)
    const fillWidth = ROOF_WIDTH - 2*POST_SIZE;
    
    const startX = -fillWidth/2 + w/2 + 0.01;
    const endX = fillWidth/2 - 0.01;
    let x = startX;

    // Wysokość sztachet: od ziemi do spodu dachu
    const h = HEIGHT - ROOF_THICKNESS; 
    const slatGeo = new THREE.BoxGeometry(w, h, d);

    while(x <= endX) {
        const slat = new THREE.Mesh(slatGeo, mat);
        // Pozycja Y = połowa wysokości wypełnienia
        slat.position.set(x, h/2, 0); 
        slat.rotation.y = angle;
        slat.castShadow = true;
        slat.receiveShadow = true;
        group.add(slat);
        x += w + spacing;
    }

  }, [profileId, spacingId, fillType]);

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

      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg leading-tight">
        <b className="text-[12px] block mb-1">Zadaszenie STAND UP</b>
        Wymiary: 120x100 cm<br/>
        Wysokość: 240 cm<br/>
        Szkło mleczne + LED
      </div>
    </div>
  );
}