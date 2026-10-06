"use client";

import { ContactShadows, Grid, Html, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoopOnce, LoopRepeat } from "three";

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
    camera: [7.2, 3.1, 6.8],
    modelPath: "/models/raven-agent.glb",
    scale: 1,
    target: [0, 1.3, 0],
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

type Playback = {
  animation: string;
  requestId: number;
};

function AnimalModel({
  onFinished,
  playback,
  profile,
  reducedMotion,
}: {
  onFinished: () => void;
  playback: Playback;
  profile: AnimalProfile;
  reducedMotion: boolean;
}) {
  const { animations, scene } = useGLTF(profile.modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.fadeOut(0.18));

    if (reducedMotion) {
      Object.values(actions).forEach((action) => action?.stop());
      return;
    }

    const nextAction = actions[playback.animation] ?? actions.Idle;
    if (!nextAction) return;

    const isIdle = playback.animation === "Idle";
    nextAction
      .reset()
      .setLoop(isIdle ? LoopRepeat : LoopOnce, isIdle ? Infinity : 1)
      .fadeIn(0.22)
      .play();

    const finishTimer = isIdle
      ? undefined
      : window.setTimeout(onFinished, Math.max(480, nextAction.getClip().duration * 1000 + 120));

    return () => {
      if (finishTimer) window.clearTimeout(finishTimer);
      nextAction.fadeOut(0.18);
    };
  }, [actions, onFinished, playback, reducedMotion]);

  return <primitive object={model} position={[0, 0, 0]} scale={profile.scale} />;
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
  const [playback, setPlayback] = useState<Playback>({ animation: "Idle", requestId: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const behaviorTimer = useRef<number | undefined>(undefined);

  const clearBehaviorTimer = useCallback(() => {
    if (behaviorTimer.current) window.clearTimeout(behaviorTimer.current);
    behaviorTimer.current = undefined;
  }, []);

  const playBehavior = useCallback((animation: string) => {
    clearBehaviorTimer();
    setPlayback((current) => ({ animation, requestId: current.requestId + 1 }));
  }, [clearBehaviorTimer]);

  const scheduleBehavior = useCallback(() => {
    clearBehaviorTimer();
    if (reducedMotion) return;

    const behaviors = profile.actions.filter((action) => action !== "Idle");
    const wait = 2200 + Math.random() * 3600;
    behaviorTimer.current = window.setTimeout(() => {
      const next = behaviors[Math.floor(Math.random() * behaviors.length)] ?? "Idle";
      setPlayback((current) => ({ animation: next, requestId: current.requestId + 1 }));
    }, wait);
  }, [clearBehaviorTimer, profile.actions, reducedMotion]);

  const returnToIdle = useCallback(() => {
    setPlayback((current) => ({ animation: "Idle", requestId: current.requestId + 1 }));
    scheduleBehavior();
  }, [scheduleBehavior]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    scheduleBehavior();
    return clearBehaviorTimer;
  }, [clearBehaviorTimer, scheduleBehavior, species]);

  return (
    <section className="animal-model-shell" aria-label={`Interactive 3D model of ${name}`}>
      <div className="animal-model-toolbar">
        <div>
          <span className="animal-model-live"><i aria-hidden="true" />AUTONOMOUS SPECIMEN</span>
          <strong>{name.toUpperCase()} / {role.toUpperCase()}</strong>
        </div>
        <span>{reducedMotion ? "MOTION REDUCED" : "LIVE · RANDOM BEHAVIOR"}</span>
      </div>

      <div className="animal-model-viewer">
        <Canvas
          camera={{ position: profile.camera, fov: 35 }}
          dpr={[1, 1.8]}
          frameloop="always"
          gl={{ alpha: false, antialias: true }}
          shadows
        >
          <color attach="background" args={["#030905"]} />
          <fog attach="fog" args={["#030905", 9, 18]} />
          <ambientLight intensity={1.4} />
          <directionalLight castShadow color="#b8ff32" intensity={3.2} position={[4, 7, 5]} />
          <directionalLight color="#ff6122" intensity={2.4} position={[-5, 3, -2]} />
          <Suspense fallback={<ModelLoadingState />}>
            <AnimalModel onFinished={returnToIdle} playback={playback} profile={profile} reducedMotion={reducedMotion} />
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
          <strong>{playback.animation}</strong>
        </div>
        <div className="animal-model-actions">
          {profile.actions.map((name) => (
            <button
              aria-pressed={playback.animation === name}
              key={name}
              onClick={() => {
                playBehavior(name);
                if (name === "Idle") scheduleBehavior();
              }}
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
