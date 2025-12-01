"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";

type Finish = "mat" | "brokat";

type MeshProps = {
  colorHex: string;
  finish: Finish;
};

function FurtkaMesh({ colorHex, finish }: MeshProps) {
  const { scene, materials } = useGLTF(
    "/models/furtka-standup.glb"
  ) as unknown as {
    scene: THREE.Object3D;
    materials: Record<string, THREE.MeshStandardMaterial>;
  };

  useEffect(() => {
    // zmieniamy tylko materiał profili
    const mat = materials["ProfilesMat"];
    if (!mat) return;

    mat.color.set(colorHex);

    // „mat” vs „brokat” – uproszczone sterowanie parametrami
    if (finish === "mat") {
      mat.roughness = 0.9;
      mat.metalness = 0.1;
    } else {
      // brokat – mniejsza chropowatość, większy połysk
      mat.roughness = 0.4;
      mat.metalness = 0.4;
    }
  }, [materials, colorHex, finish]);

  return <primitive object={scene} position={[0, -1, 0]} />;
}

export default function FurtkaPreview3D(props: MeshProps) {
  const { colorHex, finish } = props;

  return (
    <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100">
      <Canvas camera={{ position: [2.6, 2, 3.4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <FurtkaMesh colorHex={colorHex} finish={finish} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}

// preładowanie modelu (opcjonalnie)
useGLTF.preload("/models/furtka-standup.glb");
