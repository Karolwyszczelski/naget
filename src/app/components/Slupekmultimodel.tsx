"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { FaLightbulb, FaExchangeAlt, FaCube } from "react-icons/fa";

type Finish = "mat" | "brokat";
type PostVariant = "parcel" | "slim"; // Szeroki z paczką vs Wąski wysoki
type FrontMaterial = "steel" | "glass";

type Props = {
  colorHex: string;
  finish: Finish;
};

// --- WYMIARY (m) ---
// Wariant Parcel (Lewy na zdjęciu)
const PARCEL_W = 0.6;
const PARCEL_H = 1.4;
const PARCEL_D = 0.35;

// Wariant Slim (Prawy na zdjęciu)
const SLIM_W = 0.4;
const SLIM_H = 1.8;
const SLIM_D = 0.25;

function MultimediaScene({
  colorHex,
  finish,
  variant,
  frontMat,
  ledOn,
}: {
  colorHex: string;
  finish: string;
  variant: PostVariant;
  frontMat: FrontMaterial;
  ledOn: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);

  // Wymiary zależne od wariantu
  const W = variant === "parcel" ? PARCEL_W : SLIM_W;
  const H = variant === "parcel" ? PARCEL_H : SLIM_H;
  const D = variant === "parcel" ? PARCEL_D : SLIM_D;

  // --- MATERIAŁY ---
  // 1. Stalowa obudowa (Korpus)
  const steelMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: finish === "mat" ? 0.8 : 0.4,
    metalness: finish === "mat" ? 0.2 : 0.5,
  });

  // 2. Front (Stal lub Szkło)
  const frontMaterial =
    frontMat === "glass"
      ? new THREE.MeshPhysicalMaterial({
          color: 0x111111, // Czarne szkło
          roughness: 0.05,
          metalness: 0.1,
          transmission: 0.0, // Czarne szkło nieprzezroczyste (Lacobel)
          clearcoat: 1.0,
          reflectivity: 1.0,
        })
      : steelMaterial;

  // 3. Detale (Wrzutnia, drzwiczki - ciemniejszy akcent)
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.6,
    metalness: 0.4,
  });

  // 4. LED (Tekst)
  const textMaterial = new THREE.MeshStandardMaterial({
    color: ledOn ? 0xffffff : 0xcccccc, // Biały jak świeci, szary jak zgaszony
    emissive: ledOn ? 0xffffff : 0x000000,
    emissiveIntensity: ledOn ? 2.0 : 0,
    toneMapped: false,
  });

  return (
    <group ref={meshRef}>
      {/* 1. KORPUS (Tył i Boki) */}
      {/* Tył */}
      <mesh
        position={[0, H / 2, -D / 2 + 0.01]}
        castShadow
        receiveShadow
        material={steelMaterial}
      >
        <boxGeometry args={[W, H, 0.02]} />
      </mesh>
      {/* Bok Lewy */}
      <mesh
        position={[-W / 2 + 0.01, H / 2, 0]}
        castShadow
        receiveShadow
        material={steelMaterial}
      >
        <boxGeometry args={[0.02, H, D]} />
      </mesh>
      {/* Bok Prawy */}
      <mesh
        position={[W / 2 - 0.01, H / 2, 0]}
        castShadow
        receiveShadow
        material={steelMaterial}
      >
        <boxGeometry args={[0.02, H, D]} />
      </mesh>
      {/* Góra */}
      <mesh
        position={[0, H - 0.01, 0]}
        castShadow
        receiveShadow
        material={steelMaterial}
      >
        <boxGeometry args={[W, 0.02, D]} />
      </mesh>

      {/* 2. FRONT (Płyta czołowa) */}
      <mesh
        position={[0, H / 2, D / 2 - 0.01]}
        receiveShadow
        material={frontMaterial}
      >
        <boxGeometry args={[W - 0.005, H - 0.005, 0.02]} />
      </mesh>

      {/* 3. ELEMENTY FUNKCJONALNE */}

      {/* A. WRZUTNIA NA LISTY (Wspólna dla obu) */}
      <group position={[0, H - 0.25, D / 2]}>
        {/* Ramka */}
        <mesh material={detailMaterial} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.28, 0.08, 0.02]} />
        </mesh>
        {/* Klapka */}
        <mesh material={steelMaterial} position={[0, 0.01, 0.025]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.26, 0.06, 0.005]} />
        </mesh>
      </group>

      {/* B. WIDEOFON (Wspólny) */}
      {/* Mały czarny moduł nad lub pod wrzutnią */}
      <group position={[variant === 'slim' ? 0 : 0.15, H - 0.4, D / 2]}>
         <mesh material={new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.2})} position={[0,0,0.01]}>
            <boxGeometry args={[0.1, 0.16, 0.02]} />
         </mesh>
         {/* Obiektyw */}
         <mesh material={new THREE.MeshStandardMaterial({color: 0x000000, roughness: 0})} position={[0, 0.04, 0.02]}>
            <circleGeometry args={[0.015, 16]} />
         </mesh>
         {/* Przycisk */}
         <mesh material={new THREE.MeshStandardMaterial({color: 0x333333})} position={[0, -0.04, 0.02]}>
            <boxGeometry args={[0.04, 0.04, 0.01]} />
         </mesh>
      </group>

      {/* C. SPECYFIKA WARIANTU */}
      
      {variant === "parcel" ? (
        <>
          {/* PACZKOMAT (Duże drzwiczki) */}
          <group position={[0, H / 2 - 0.1, D / 2]}>
            {/* Wnęka/Obrys */}
            <mesh material={detailMaterial} position={[0, 0, 0.005]}>
              <boxGeometry args={[0.45, 0.5, 0.01]} />
            </mesh>
            {/* Drzwiczki */}
            <mesh material={steelMaterial} position={[0, 0, 0.02]}>
              <boxGeometry args={[0.43, 0.48, 0.02]} />
            </mesh>
            {/* Uchwyt (niewidoczny/pochwyt) - zróbmy wcięcie */}
            <mesh material={detailMaterial} position={[0.15, 0, 0.03]}>
               <boxGeometry args={[0.02, 0.1, 0.01]} />
            </mesh>
          </group>

          {/* NAPISY (Dół) - STALOWA 36 */}
          <group position={[0, 0.35, D / 2 + 0.011]}>
            <Text
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
              fontSize={0.07}
              letterSpacing={0.05}
              color={ledOn ? "white" : "#aaaaaa"}
              material={textMaterial}
              anchorX="center"
              anchorY="middle"
              position={[0, 0.08, 0]}
            >
              UL. STALOWA
            </Text>
            <Text
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
              fontSize={0.18}
              color={ledOn ? "white" : "#aaaaaa"}
              material={textMaterial}
              anchorX="center"
              anchorY="middle"
              position={[0, -0.08, 0]}
            >
              36
            </Text>
          </group>
        </>
      ) : (
        <>
          {/* WARIANT SLIM - Tylko duży numer */}
          <group position={[0, H - 0.7, D / 2 + 0.011]}>
            <Text
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
              fontSize={0.25}
              color={ledOn ? "white" : "#aaaaaa"}
              material={textMaterial}
              anchorX="center"
              anchorY="middle"
            >
              67
            </Text>
          </group>
        </>
      )}
    </group>
  );
}

// --- GŁÓWNY KOMPONENT ---
export default function MultimediaPostModel({
  colorHex = "#333333",
  finish = "mat",
}: Partial<Props>) {
  const [variant, setVariant] = useState<PostVariant>("parcel");
  const [frontMat, setFrontMat] = useState<FrontMaterial>("steel");
  const [ledOn, setLedOn] = useState(false);

  return (
    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-soft bg-gray-100">
      <Canvas shadows camera={{ position: [2, 1.5, 3.5], fov: 40 }}>
        {/* Oświetlenie */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[-5, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Światło od LEDa (delikatna poświata z przodu) */}
        {ledOn && (
           <pointLight position={[0, 1, 1]} intensity={0.5} color="white" distance={2} />
        )}

        {/* Podłoga */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#e5e5e5" />
        </mesh>

        <MultimediaScene
          colorHex={colorHex}
          finish={finish}
          variant={variant}
          frontMat={frontMat}
          ledOn={ledOn}
        />

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} target={[0, 0.9, 0]} />
      </Canvas>

      {/* UI Controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Zmiana Wariantu (Slim/Parcel) */}
        <button
          onClick={() => setVariant(variant === "parcel" ? "slim" : "parcel")}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-white text-gray-700 border border-gray-200 transition-transform active:scale-95"
          title={variant === "parcel" ? "Zmień na Slim" : "Zmień na Paczkomat"}
        >
          <FaExchangeAlt />
        </button>

        {/* Zmiana Frontu (Stal/Szkło) */}
        <button
          onClick={() => setFrontMat(frontMat === "steel" ? "glass" : "steel")}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-colors ${
             frontMat === "glass" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-700 border-gray-200"
          }`}
          title="Zmień materiał frontu"
        >
          <FaCube />
        </button>

        {/* Włącznik LED */}
        <button
          onClick={() => setLedOn(!ledOn)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-colors ${
            ledOn
              ? "bg-yellow-400 text-white border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.6)]"
              : "bg-white text-gray-400 border-gray-200"
          }`}
          title="Podświetlenie LED"
        >
          <FaLightbulb />
        </button>
      </div>

      <div className="absolute left-4 bottom-4 text-white/90 text-[10px] pointer-events-none bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
        <b className="text-[12px] block mb-1">SŁUPEK MULTIMEDIALNY</b>
        Typ: {variant === "parcel" ? "Z Paczkomatem" : "Slim Standard"}<br/>
        Front: {frontMat === "steel" ? "Blacha" : "Szkło hartowane"}<br/>
        Wyposażenie: Wideofon, LED, Skrzynka
      </div>
    </div>
  );
}