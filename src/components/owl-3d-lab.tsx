"use client";

import { ContactShadows, Grid, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import Image from "next/image";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { animalMotion, behaviorDuration } from "@/lib/zoo/animal-motion";

import type { SpeciesId } from "@/lib/zoo/types";

type AnimalProfile = {
  species: SpeciesId;
  actions: readonly string[];
  camera: [number, number, number];
  modelPath: string;
  scale: number;
  target: [number, number, number];
};

const animalProfiles = {
  raven: {
    species: "raven",
    actions: ["Idle", "Scan", "Call", "Signal"],
    camera: [7.2, 3.1, 6.8],
    modelPath: "/models/raven-agent.glb",
    scale: 1,
    target: [0, 1.3, 0],
  },
  beaver: {
    species: "beaver",
    actions: ["Idle", "Gnaw", "Tail Sweep", "Build"],
    camera: [5.8, 3.1, 7.2],
    modelPath: "/models/beaver-agent.glb",
    scale: 1.05,
    target: [0, 1.25, 0],
  },
  owl: {
    species: "owl",
    actions: ["Idle", "Look Around", "Blink", "Signal"],
    camera: [5.8, 3.6, 7.4],
    modelPath: "/models/owl-agent.glb",
    scale: 0.92,
    target: [0, 1.9, 0],
  },
  meerkat: {
    species: "meerkat",
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
  onReady,
  onFinished,
  playback,
  profile,
  reducedMotion,
}: {
  onReady: () => void;
  onFinished: () => void;
  playback: Playback;
  profile: AnimalProfile;
  reducedMotion: boolean;
}) {
  const { scene } = useGLTF(profile.modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const startedAt = useRef(0);
  const joints = useMemo(() => ["body", "head", "jaw", "tail", "wing.L", "wing.R", "arm.L", "arm.R", "lid.L", "lid.R"].flatMap((name) => {
    const node = model.getObjectByName(name);
    return node ? [{ name, node, rotation: node.rotation.clone(), scale: node.scale.clone() }] : [];
  }), [model]);

  useEffect(() => { onReady(); }, [onReady]);

  useEffect(() => {
    startedAt.current = performance.now();
    if (reducedMotion || playback.animation === "Idle") return;
    const timer = window.setTimeout(onFinished, (behaviorDuration[playback.animation] ?? 3) * 1000);
    return () => window.clearTimeout(timer);
  }, [onFinished, playback, reducedMotion]);

  useFrame(({ clock }) => {
    const motion = animalMotion(profile.species, playback.animation, (performance.now() - startedAt.current) / 1000, clock.elapsedTime);
    for (const joint of joints) {
      joint.node.rotation.copy(joint.rotation);
      joint.node.scale.copy(joint.scale);
      if (reducedMotion) continue;
      const { x, y, z } = joint.rotation;
      if (joint.name === "head") joint.node.rotation.set(x + motion.headX, y + motion.headY, z + motion.headZ);
      if (joint.name === "body") joint.node.scale.set(joint.scale.x, joint.scale.y * (1 + motion.breath), joint.scale.z);
      if (joint.name === "jaw") joint.node.rotation.set(x + motion.jaw, y, z);
      if (joint.name === "tail") joint.node.rotation.set(x, y + motion.tail, z);
      if (joint.name.startsWith("wing.")) joint.node.rotation.set(x, y, z + motion.wing * (joint.name.endsWith("L") ? 1 : -1));
      if (joint.name.startsWith("arm.")) joint.node.rotation.set(x + motion.arm, y, z);
      if (joint.name.startsWith("lid.")) joint.node.rotation.set(x + motion.blink * 0.9, y, z);
    }
  });

  return <primitive object={model} position={[0, 0, 0]} scale={profile.scale} />;
}

function ModelLoadingState({ name }: { name: string }) {
  const { progress } = useProgress();
  const value = Math.round(progress);

  return (
      <div className="animal-model-loading" role="status" aria-live="polite">
        <span>ASSEMBLING SPECIMEN</span>
        <strong>{name.toUpperCase()}</strong>
        <progress aria-label={`Loading 3D model of ${name}`} max="100" value={value}>{value}%</progress>
        <small>{value}% / MODEL DATA</small>
      </div>
  );
}

function ModelFallback({ species, onReady }: { species: SpeciesId; onReady?: () => void }) {
  useEffect(() => { onReady?.(); }, [onReady]);
  return <div className="animal-model-fallback"><Image src={`/models/${species}-preview.png`} alt={`${species} specimen`} width={700} height={700} /><p>The 3D view is unavailable in this browser. Reload to try again.</p></div>;
}

class ModelBoundary extends Component<{ children: ReactNode; species: SpeciesId }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ModelFallback species={this.props.species} /> : this.props.children; }
}

export function Animal3DViewport({ name, role, species }: { name: string; role: string; species: SpeciesId }) {
  const profile = animalProfiles[species];
  const [playback, setPlayback] = useState<Playback>({ animation: "Idle", requestId: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
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
          <span className="animal-model-live"><i aria-hidden="true" />ANIMATED SPECIMEN</span>
          <strong>{name.toUpperCase()} / {role.toUpperCase()}</strong>
        </div>
        <span>{reducedMotion ? "MOTION REDUCED" : "LIVE · RANDOM BEHAVIOR"}</span>
      </div>

      <div className="animal-model-viewer">
        <ModelBoundary species={species} key={species}>
        <Canvas
          camera={{ position: profile.camera, fov: 35 }}
          dpr={[1, 1.8]}
          frameloop={reducedMotion ? "demand" : "always"}
          gl={{ alpha: false, antialias: true }}
          shadows
          fallback={<ModelFallback species={species} onReady={onModelReady} />}
        >
          <color attach="background" args={["#030905"]} />
          <fog attach="fog" args={["#030905", 9, 18]} />
          <ambientLight intensity={1.4} />
          <directionalLight castShadow color="#b8ff32" intensity={3.2} position={[4, 7, 5]} />
          <directionalLight color="#ff6122" intensity={2.4} position={[-5, 3, -2]} />
          <Suspense fallback={null}>
            <AnimalModel onReady={onModelReady} onFinished={returnToIdle} playback={playback} profile={profile} reducedMotion={reducedMotion} />
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
        {!modelReady ? <div className="animal-model-overlay"><ModelLoadingState name={name} /></div> : null}
        </ModelBoundary>
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
