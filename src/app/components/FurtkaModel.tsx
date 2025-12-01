"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore – jeśli TS marudzi na ścieżkę, możesz dodać ten komentarz
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

const POST_HEIGHT = 1.8;
const POST_WIDTH = 0.12;
const GATE_WIDTH = 1.0;

// przybliżone przekroje profili w metrach
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

export default function FurtkaModel({
  colorHex,
  finish,
  profileId,
  spacingId,
  fillType,
}: Props) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const metalMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gateLeafRef = useRef<THREE.Group | null>(null);
  const slatsRef = useRef<THREE.Mesh[]>([]);
  const controlsRef = useRef<any>(null);

  const [isGateAnimating, setIsGateAnimating] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const isGateAnimatingRef = useRef(true);
  const isAutoRotatingRef = useRef(true);

  // INICJALIZACJA SCENY – tylko raz
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || width * (3 / 4);

    const scene = new THREE.Scene();
    // brak własnego tła – korzystamy z tła strony (pattern naget)
    scene.background = null;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3, 2.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    // przezroczyste tło – będzie widać pattern z body (tlo.jpg)
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.autoRotate = isAutoRotatingRef.current;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    // materiały
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#363636"),
      roughness: finish === "mat" ? 0.7 : 0.4,
      metalness: finish === "mat" ? 0.2 : 0.4,
    });
    metalMaterialRef.current = metalMaterial;

    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.8,
      roughness: 0.2,
    });

    // grupa furtki
    const gateGroup = new THREE.Group();
    scene.add(gateGroup);

    // słupki
    const createPost = (xPos: number) => {
      const geometry = new THREE.BoxGeometry(POST_WIDTH, POST_HEIGHT, POST_WIDTH);
      const post = new THREE.Mesh(geometry, metalMaterial);
      post.position.set(xPos, POST_HEIGHT / 2, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      return post;
    };

    const leftPost = createPost(-(GATE_WIDTH / 2 + POST_WIDTH / 2 + 0.02));
    const rightPost = createPost(GATE_WIDTH / 2 + POST_WIDTH / 2 + 0.02);
    gateGroup.add(leftPost);
    gateGroup.add(rightPost);

    // skrzydło z pivotem w osi zawiasów
    const gateLeaf = new THREE.Group();
    gateLeaf.position.set(-GATE_WIDTH / 2, 0, 0);
    gateGroup.add(gateLeaf);
    gateLeafRef.current = gateLeaf;

    // belki i rama – nie zależą od profilu/rozstawu
    const createBar = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, metalMaterial);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const slatHeight = POST_HEIGHT - 0.1;

    const bottomRail = createBar(
      GATE_WIDTH - 0.05,
      0.04,
      0.06,
      GATE_WIDTH / 2,
      0.2,
      0
    );
    gateLeaf.add(bottomRail);

    const middleRail = createBar(
      GATE_WIDTH - 0.05,
      0.04,
      0.06,
      GATE_WIDTH / 2,
      0.5,
      0
    );
    gateLeaf.add(middleRail);

    const sideFrameL = createBar(
      0.04,
      slatHeight,
      0.06,
      0.04 / 2,
      slatHeight / 2 + 0.05,
      0
    );
    const sideFrameR = createBar(
      0.04,
      slatHeight,
      0.06,
      GATE_WIDTH - 0.04 / 2,
      slatHeight / 2 + 0.05,
      0
    );
    gateLeaf.add(sideFrameL);
    gateLeaf.add(sideFrameR);

    // zawiasy
    const hingeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 16);
    const hinge1 = new THREE.Mesh(hingeGeo, hingeMaterial);
    hinge1.position.set(0, 1.4, 0);
    const hinge2 = new THREE.Mesh(hingeGeo, hingeMaterial);
    hinge2.position.set(0, 0.4, 0);
    hinge1.castShadow = true;
    hinge2.castShadow = true;
    gateLeaf.add(hinge1);
    gateLeaf.add(hinge2);

    // podłoga – delikatna, jasna, bez siatki
    const planeGeo = new THREE.PlaneGeometry(6, 6);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xe5edf9, // jasne, neutralne tło pod furtką
      roughness: 1,
      metalness: 0,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);

    // światło
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // animacja otwierania
    let time = 0;
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotatingRef.current;
        controlsRef.current.update();
      }

      if (gateLeaf && isGateAnimatingRef.current) {
        time += 0.01;
        const angle = ((Math.sin(time) + 1) / 2) * (Math.PI / 2);
        gateLeaf.rotation.y = angle;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 600;
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
  }, []); // init tylko raz

  // aktualizacja materiału (kolor + struktura)
  useEffect(() => {
    if (!metalMaterialRef.current) return;
    metalMaterialRef.current.color.set(colorHex || "#363636");
    if (finish === "mat") {
      metalMaterialRef.current.roughness = 0.7;
      metalMaterialRef.current.metalness = 0.2;
    } else {
      metalMaterialRef.current.roughness = 0.4;
      metalMaterialRef.current.metalness = 0.4;
    }
  }, [colorHex, finish]);

  // aktualizacja SZCZEBLI (profil, rozstaw, twist)
  useEffect(() => {
    const gateLeaf = gateLeafRef.current;
    const material = metalMaterialRef.current;
    if (!gateLeaf || !material) return;

    // usuń stare szczeble
    slatsRef.current.forEach((mesh) => {
      gateLeaf.remove(mesh);
    });
    slatsRef.current = [];

    const profileDims =
      PROFILE_DIMENSIONS[profileId as ProfileId] || PROFILE_DIMENSIONS["60x40"];
    const slatWidth = profileDims.slatWidth;
    const slatDepth = profileDims.slatDepth;
    const slatHeight = POST_HEIGHT - 0.1;

    const spacingCm = parseFloat(spacingId) || 6;
    const gap = spacingCm / 100; // cm -> m

    const angleDeg =
      fillType === "twist"
        ? TWIST_ANGLES[profileId as ProfileId] || 45
        : 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    let x = slatWidth / 2;
    while (x <= GATE_WIDTH - slatWidth / 2 + 1e-4) {
      const geom = new THREE.BoxGeometry(slatWidth, slatHeight, slatDepth);
      const slat = new THREE.Mesh(geom, material);
      slat.position.set(x, slatHeight / 2 + 0.05, 0);
      slat.castShadow = true;
      slat.receiveShadow = true;
      slat.rotation.y = angleRad;
      gateLeaf.add(slat);
      slatsRef.current.push(slat);

      x += slatWidth + gap;
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
    // kliknięcie w obszar 3D pauzuje/wznawia bramkę
    toggleGateAnimation();
  };

  return (
    <div
      ref={outerRef}
      className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft bg-transparent"
      onClick={handleWrapperClick}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* PRZYCISKI STEROWANIA – prawy górny róg */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
        {/* start/stop ruchu furtki */}
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
          aria-label={
            isGateAnimating
              ? "Zatrzymaj ruch furtki"
              : "Włącz ruch furtki"
          }
        >
          {isGateAnimating ? <FaPause /> : <FaPlay />}
        </button>

        {/* start/stop auto-rotacji widoku */}
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
          aria-label={
            isAutoRotating
              ? "Zatrzymaj automatyczny obrót widoku"
              : "Włącz automatyczny obrót widoku"
          }
        >
          <FaSyncAlt />
        </button>
      </div>

      {/* LEGENDA – lewy dolny róg, mała i dyskretna */}
      <div className="pointer-events-none absolute left-2 bottom-2 z-10 max-w-[75%] max-h-[20%] rounded-xl bg-white/45 backdrop-blur px-2 py-1 text-[4px] leading-tight text-white">
        <p className="font-semibold uppercase mb-1 text-[8px]">
          Sterowanie
        </p>
        <p className="text-[7px]">• Lewy przycisk myszy – obrót widoku</p>
  <p className="text-[7px]">• Prawy przycisk / scroll – przesuwanie i zoom</p>
  <p className="text-[7px]">• Kliknij w model lub ikonę pauzy – start/stop ruchu furtki</p>
  <p className="text-[7px]">• Ikona strzałki – włącz/wyłącz autoobrót kamery</p>
</div>
    </div>
  );
}
