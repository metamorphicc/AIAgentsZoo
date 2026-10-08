import { readFile } from "node:fs/promises";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expect, it } from "vitest";
import { findAnimalJoint } from "./animal-rig";
import { owlLidScale } from "./animal-motion";

async function loadModel(species: string) {
  const bytes = await readFile(`public/models/${species}-agent.glb`);
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
}

it("keeps the exported owl lids above its irises at rest and covers the eyes during a blink", async () => {
  const { scene } = await loadModel("owl");
  for (const side of ["L", "R"]) {
    const lid = findAnimalJoint(scene, `lid.${side}`)!;
    const eyelid = scene.getObjectByName(`Eyelid_${side}`)!;
    const iris = scene.getObjectByName(`Iris_${side}`)!;
    expect(lid).toBeDefined();
    expect(eyelid).toBeDefined();
    expect(iris).toBeDefined();
    lid.scale.set(1, owlLidScale(0), 1);
    scene.updateMatrixWorld(true);
    const irisBounds = new Box3().setFromObject(iris);
    expect(new Box3().setFromObject(eyelid).min.y).toBeGreaterThan(irisBounds.max.y);
    lid.scale.set(1, owlLidScale(1), 1);
    scene.updateMatrixWorld(true);
    const closed = new Box3().setFromObject(eyelid);
    expect(closed.min.y).toBeLessThan(irisBounds.min.y);
    expect(closed.max.y).toBeGreaterThan(irisBounds.max.y);
  }
});

it("exports a flat beaver paddle without rods and fixes its two upper incisors to the head", async () => {
  const { scene } = await loadModel("beaver");
  scene.updateMatrixWorld(true);
  const paddle = scene.getObjectByName("Beaver_Tail")!;
  expect(paddle).toBeDefined();
  const size = new Box3().setFromObject(paddle).getSize(new Vector3());
  expect(size.y).toBeLessThan(size.x * 0.5);
  expect(size.y).toBeLessThan(size.z * 0.5);
  scene.traverse((node) => expect(node.name.startsWith("Tail_Ridge")).toBe(false));
  const head = findAnimalJoint(scene, "head");
  for (const side of ["L", "R"]) expect(scene.getObjectByName(`Incisor_${side}`)?.parent).toBe(head);
});
