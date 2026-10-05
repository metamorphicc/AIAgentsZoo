"use client";

import { ContactShadows, Grid, Html, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";

const animationNames = ["Idle", "Inspect", "Sleep", "Signal"] as const;
type OwlAnimation = (typeof animationNames)[number];

function OwlModel({ animation }: { animation: OwlAnimation }) {
  const { animations, scene } = useGLTF("/models/owl-agent.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const nextAction = actions[animation];
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    nextAction?.reset().fadeIn(0.25).play();

    return () => {
      nextAction?.fadeOut(0.2);
    };
  }, [actions, animation]);

  return <primitive object={scene} position={[0, 0, 0]} scale={0.92} />;
}

function ModelLoadingState() {
  return (
    <Html center>
      <span className="owl-lab-loading">LOADING SPECIMEN</span>
    </Html>
  );
}

export function Owl3DLab() {
  const [animation, setAnimation] = useState<OwlAnimation>("Idle");

  return (
    <section className="owl-lab" aria-label="Interactive 3D model of Owl 01">
      <div className="owl-lab-toolbar">
        <div>
          <span className="owl-lab-live"><i aria-hidden="true" />LIVE MODEL</span>
          <strong>OWL 01 / ARCHIVIST</strong>
        </div>
        <span>GLB · 65 KB · 4 CLIPS</span>
      </div>

      <div className="owl-lab-viewer">
        <Canvas
          camera={{ position: [5.8, 3.6, 7.4], fov: 35 }}
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
            <OwlModel animation={animation} />
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
            autoRotate={animation === "Idle"}
            autoRotateSpeed={0.55}
            enableDamping
            enablePan={false}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.02}
            minDistance={5}
            minPolarAngle={Math.PI / 4}
            target={[0, 1.9, 0]}
          />
        </Canvas>
        <p className="owl-lab-hint">DRAG TO ORBIT · SCROLL TO ZOOM</p>
      </div>

      <div className="owl-lab-controls" aria-label="Animation controls">
        <div>
          <span>BEHAVIOR CLIP</span>
          <strong>{animation}</strong>
        </div>
        <div className="owl-lab-actions">
          {animationNames.map((name) => (
            <button
              aria-pressed={animation === name}
              key={name}
              onClick={() => setAnimation(name)}
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

useGLTF.preload("/models/owl-agent.glb");
