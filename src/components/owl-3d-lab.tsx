"use client";

import { ContactShadows, Grid, Html, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { LoopRepeat } from "three";

import type { SpeciesId } from "@/lib/zoo/types";

type AnimalProfile = {
  actions: readonly string[];
  camera: [number, number, number];
  modelPath: string;
  scale: number;
  target: [number, number, number];
};

const animalProfiles = {
  raven: {
    actions: ["Idle", "Scan", "Call", "Signal"],
    camera: [5.6, 3.5, 7],
    modelPath: "/models/raven-agent.glb",
    scale: 1,
    target: [0, 1.65, 0],
  },
  beaver: {
    actions: ["Idle", "Gnaw", "Tail Sweep", "Build"],
    camera: [5.8, 3.1, 7.2],
    modelPath: "/models/beaver-agent.glb",
    scale: 1.05,
    target: [0, 1.25, 0],
  },
  owl: {
    actions: ["Idle", "Look Around", "Blink", "Signal"],
    camera: [5.8, 3.6, 7.4],
    modelPath: "/models/owl-agent.glb",
    scale: 0.92,
    target: [0, 1.9, 0],
  },
  meerkat: {
    actions: ["Idle", "Lookout", "Scan", "Alert"],
    camera: [5.7, 3.4, 7.2],
    modelPath: "/models/meerkat-agent.glb",
    scale: 1,
    target: [0, 1.65, 0],
  },
} satisfies Record<SpeciesId, AnimalProfile>;

function AnimalModel({ animation, profile }: { animation: string; profile: AnimalProfile }) {
  const { animations, scene } = useGLTF(profile.modelPath);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const nextAction = actions[animation];
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    nextAction?.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.25).play();

    return () => {
      nextAction?.fadeOut(0.2);
    };
  }, [actions, animation]);

  return <primitive object={scene} position={[0, 0, 0]} scale={profile.scale} />;
}

function ModelLoadingState() {
  return (
    <Html center>
      <span className="owl-lab-loading">LOADING SPECIMEN</span>
    </Html>
  );
}

export function Animal3DViewport({ name, role, species }: { name: string; role: string; species: SpeciesId }) {
  const profile = animalProfiles[species];
  const [selection, setSelection] = useState<{ animation: string; species: SpeciesId }>({ animation: "Idle", species });
  const animation = selection.species === species ? selection.animation : "Idle";

  return (
    <section className="animal-model-shell" aria-label={`Interactive 3D model of ${name}`}>
      <div className="animal-model-toolbar">
        <div>
          <span className="animal-model-live"><i aria-hidden="true" />LIVE SPECIMEN</span>
          <strong>{name.toUpperCase()} / {role.toUpperCase()}</strong>
        </div>
        <span>RIGGED · 4 BEHAVIOR CLIPS</span>
      </div>

      <div className="animal-model-viewer">
        <Canvas
          camera={{ position: profile.camera, fov: 35 }}
          dpr={[1, 1.8]}
          gl={{ alpha: false, antialias: true }}
          shadows
        >
          <color attach="background" args={["#030905"]} />
          <fog attach="fog" args={["#030905", 9, 18]} />
          <ambientLight intensity={1.4} />
          <directionalLight castShadow color="#b8ff32" intensity={3.2} position={[4, 7, 5]} />
          <directionalLight color="#ff6122" intensity={2.4} position={[-5, 3, -2]} />
          <Suspense fallback={<ModelLoadingState />}>
            <AnimalModel animation={animation} profile={profile} />
            <ContactShadows opacity={0.62} position={[0, -0.04, 0]} scale={8} blur={2.8} far={6} />
          </Suspense>
          <Grid
            args={[12, 12]}
            cellColor="#16331d"
            cellSize={0.5}
            cellThickness={0.5}
            fadeDistance={12}
            fadeStrength={1.2}
            position={[0, -0.08, 0]}
            sectionColor="#345c2c"
            sectionSize={2}
            sectionThickness={0.8}
          />
          <OrbitControls
            enableDamping
            enablePan={false}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.02}
            minDistance={5}
            minPolarAngle={Math.PI / 4}
            target={profile.target}
          />
        </Canvas>
        <p className="animal-model-hint">DRAG TO ORBIT · SCROLL TO ZOOM</p>
      </div>

      <div className="animal-model-controls" aria-label="Animation controls">
        <div>
          <span>BEHAVIOR CLIP</span>
          <strong>{animation}</strong>
        </div>
        <div className="animal-model-actions">
          {profile.actions.map((name) => (
            <button
              aria-pressed={animation === name}
              key={name}
              onClick={() => setSelection({ animation: name, species })}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.values(animalProfiles).forEach((profile) => useGLTF.preload(profile.modelPath));
